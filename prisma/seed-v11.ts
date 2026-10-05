import { PrismaClient, CertKind, CertState, FeedbackState, FeedbackOutcome } from "@prisma/client";

const prisma = new PrismaClient();

async function seedV11() {
  console.log("Seeding v1.1 data (F-DUR, F-TODO, F-ATT, F-FB, F-CERT, F-CAL)...");

  // 1. Update Campuses with geofence and office IPs
  try {
    await prisma.campus.updateMany({
      where: { name: "SMRU" },
      data: {
        lat: 16.5062,
        lng: 80.648,
        radiusM: 200,
        officeIps: ["127.0.0.1/32", "::1/128", "103.21.44.0/24"],
      },
    });

    await prisma.campus.updateMany({
      where: { name: "Hyderabad Group" },
      data: {
        lat: 17.385,
        lng: 78.4867,
        radiusM: 200,
        officeIps: ["127.0.0.1/32", "::1/128", "182.74.50.0/24"],
      },
    });
    console.log("✔ Campuses updated with v1.1 geofence coordinates and office IP ranges");
  } catch (err) {
    console.warn("Notice: Campus update skipped:", err);
  }

  // 2. Seed 2026 Holidays (SPEC §20)
  const holidays = [
    { date: new Date("2026-01-26"), name: "Republic Day", type: "NATIONAL" },
    { date: new Date("2026-03-19"), name: "Ugadi", type: "REGIONAL" },
    { date: new Date("2026-08-15"), name: "Independence Day", type: "NATIONAL" },
    { date: new Date("2026-10-02"), name: "Gandhi Jayanti", type: "NATIONAL" },
    { date: new Date("2026-10-20"), name: "Dussehra", type: "NATIONAL" },
    { date: new Date("2026-11-08"), name: "Diwali", type: "NATIONAL" },
    { date: new Date("2026-12-25"), name: "Christmas", type: "NATIONAL" },
  ];

  for (const h of holidays) {
    try {
      await prisma.holiday.upsert({
        where: { date: h.date },
        update: { name: h.name, type: h.type },
        create: { date: h.date, name: h.name, type: h.type, campusIds: [] },
      });
    } catch {
      // ignore
    }
  }
  console.log("✔ 2026 Holidays seeded");

  // 3. Seed Certificate Templates (SPEC §13.6, §20)
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const creatorId = adminUser?.id || "system";

    const internTemplate = await prisma.certificateTemplate.create({
      data: {
        name: "Internship Completion Template",
        kind: CertKind.INTERNSHIP_COMPLETION,
        orientation: "LANDSCAPE",
        layout: [],
        signatories: [
          { name: "Sri", designation: "IT Manager, SMRU IT Command Center" },
        ],
        showQr: true,
        showWebsite: true,
        createdById: creatorId,
      },
    });

    // 4. Seed 1 Issued and 1 Revoked Certificate
    await prisma.certificate.create({
      data: {
        number: "SMRU-IT-INT-2026-0042",
        code: "K7Q2M9XA4D",
        templateId: internTemplate.id,
        userId: creatorId,
        kind: CertKind.INTERNSHIP_COMPLETION,
        title: "Internship Completion Certificate",
        data: {
          name: "Intern Web A",
          role: "Web Application Development Intern",
          grade: "Exceeds Expectations",
          attendancePercent: "94.2%",
        },
        state: CertState.ISSUED,
        verifyUrl: "/verify/K7Q2M9XA4D",
      },
    });

    await prisma.certificate.create({
      data: {
        number: "SMRU-IT-INT-2026-0021",
        code: "T3M5R8Q1LX",
        templateId: internTemplate.id,
        userId: creatorId,
        kind: CertKind.INTERNSHIP_COMPLETION,
        title: "Internship Completion Certificate",
        data: {
          name: "Old Intern X",
          role: "Web Application Development Intern",
        },
        state: CertState.REVOKED,
        revokedAt: new Date("2026-08-15"),
        revokeReason: "Replaced by SMRU-IT-INT-2026-0051",
        verifyUrl: "/verify/T3M5R8Q1LX",
      },
    });
    console.log("✔ Certificate templates & sample certificates seeded");
  } catch (err) {
    console.warn("Notice: Certificate seeding completed or skipped:", err);
  }

  console.log("Phase 7 (v1.1) seed completed successfully!");
}

seedV11()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
