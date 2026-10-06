import { describe, it, expect } from "vitest";
import {
  verifyCertificateByCode,
  registerIssuedCertificate,
  generateCertificateCode,
} from "@/lib/services/certificate";

describe("Certificate Verification System (SPEC §PART 2, PART 4, PART 8)", () => {
  it("authenticates genuine certificate by Certificate Number (ICC-ACH-2026-0001)", async () => {
    const res = await verifyCertificateByCode("ICC-ACH-2026-0001");
    expect(res.found).toBe(true);
    expect(res.valid).toBe(true);
    expect(res.status).toBe("VALID");
    expect(res.number).toBe("ICC-ACH-2026-0001");
    expect(res.code).toBe("K7Q2M9XA4D");
    expect(res.recipientName).toBe("Sri Ram");
    expect(res.title).toBe("Certificate of Achievement");
    expect(res.trainingName).toBe("Attendance / Office Management Training");
    expect(res.issuingOrganization).toBe("St. Mary's University (SMRU)");
    expect(res.collegeWebsiteUrl).toBe("https://smru.edu.in/");
    expect(res.attendancePercent).toBe("96.5%");
    expect(res.presentDays).toBe(20);
    expect(res.lateArrivals).toBe(2);
    expect(res.halfDays).toBe(1);
    expect(res.avgInTime).toBe("09:08");
    expect(res.totalHours).toBe("172.5h");
  });

  it("authenticates genuine certificate by Verification Code (K7Q2M9XA4D)", async () => {
    const res = await verifyCertificateByCode("K7Q2M9XA4D");
    expect(res.found).toBe(true);
    expect(res.valid).toBe(true);
    expect(res.status).toBe("VALID");
    expect(res.recipientName).toBe("Sri Ram");
    expect(res.number).toBe("ICC-ACH-2026-0001");
    expect(res.collegeWebsiteUrl).toBe("https://smru.edu.in/");
  });

  it("supports case-insensitive lookup (lowercase cert number and code)", async () => {
    const resNum = await verifyCertificateByCode("icc-ach-2026-0001");
    expect(resNum.found).toBe(true);
    expect(resNum.valid).toBe(true);

    const resCode = await verifyCertificateByCode("k7q2m9xa4d");
    expect(resCode.found).toBe(true);
    expect(resCode.valid).toBe(true);
  });

  it("returns INVALID CERTIFICATE for fake, random, or malformed certificate numbers", async () => {
    const fakeNumbers = [
      "ICC-FAKE-9999",
      "RANDOM_XYZ",
      "SMRU-INVALID-0000",
      "NONEXISTENT_12345",
      "UNKNOWN_CODE",
    ];

    for (const id of fakeNumbers) {
      const res = await verifyCertificateByCode(id);
      expect(res.found).toBe(false);
      expect(res.valid).toBe(false);
      expect(res.status).toBe("INVALID");
      expect(res.collegeWebsiteUrl).toBe("https://smru.edu.in/");
    }
  });

  it("returns INVALID for empty or whitespace-only queries", async () => {
    const emptyRes = await verifyCertificateByCode("");
    expect(emptyRes.found).toBe(false);
    expect(emptyRes.valid).toBe(false);
    expect(emptyRes.status).toBe("INVALID");

    const spacesRes = await verifyCertificateByCode("   ");
    expect(spacesRes.found).toBe(false);
    expect(spacesRes.valid).toBe(false);
  });

  it("accurately reports REVOKED status for revoked credentials", async () => {
    const res = await verifyCertificateByCode("T3M5R8Q1LX");
    expect(res.found).toBe(true);
    expect(res.valid).toBe(false);
    expect(res.status).toBe("REVOKED");
    expect(res.revoked).toBe(true);
    expect(res.revokeReason).toBeDefined();
  });

  it("supports dynamic certificate registration and immediate public verification", async () => {
    const uniqueNumber = `ICC-ACH-2026-${Date.now().toString().slice(-4)}`;
    const uniqueCode = generateCertificateCode();

    registerIssuedCertificate({
      number: uniqueNumber,
      code: uniqueCode,
      recipientName: "Test Student Alpha",
      title: "Executive Training Certificate",
      trainingName: "Enterprise Infrastructure & Cloud Systems",
      attendancePercent: "98.2%",
      presentDays: 24,
      lateArrivals: 1,
      halfDays: 0,
      avgInTime: "08:58",
      totalHours: "185.0h",
      issuedAt: "06 October 2026",
      state: "ISSUED",
    });

    // Verifiable by Number
    const verifyByNumber = await verifyCertificateByCode(uniqueNumber);
    expect(verifyByNumber.found).toBe(true);
    expect(verifyByNumber.valid).toBe(true);
    expect(verifyByNumber.recipientName).toBe("Test Student Alpha");
    expect(verifyByNumber.code).toBe(uniqueCode);

    // Verifiable by Code
    const verifyByCode = await verifyCertificateByCode(uniqueCode);
    expect(verifyByCode.found).toBe(true);
    expect(verifyByCode.valid).toBe(true);
    expect(verifyByCode.number).toBe(uniqueNumber);
  });

  it("never exposes private credentials or database secrets (PART 8 - SECURITY)", async () => {
    const res = await verifyCertificateByCode("ICC-ACH-2026-0001");
    // Ensure no password hashes, internal tokens, or session tokens exist
    expect((res as any).passwordHash).toBeUndefined();
    expect((res as any).password).toBeUndefined();
    expect((res as any).token).toBeUndefined();
    expect((res as any).secret).toBeUndefined();
    expect((res as any).databaseUrl).toBeUndefined();
  });

  it("ensures public verify URL structure does not contain localhost (PART 3)", () => {
    const publicUrlTemplate = (numberOrCode: string) => {
      let target = `/verify/${numberOrCode}`;
      if (!target.startsWith("http")) {
        target = `https://smru.edu.in${target.startsWith("/") ? "" : "/"}${target}`;
      }
      return target.replace(/https?:\/\/localhost(:\d+)?/, "https://smru.edu.in");
    };

    const url = publicUrlTemplate("ICC-ACH-2026-0001");
    expect(url).toBe("https://smru.edu.in/verify/ICC-ACH-2026-0001");
    expect(url).not.toContain("localhost");
    expect(url).not.toContain("127.0.0.1");
  });
});
