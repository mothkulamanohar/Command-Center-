import { describe, it, expect } from "vitest";
import { generateCertificateCode, IssueCertificateSchema } from "@/lib/services/certificate";
import { CertKind } from "@prisma/client";

describe("Certificate Code Generator & Unambiguous Alphabet (F-CERT-04)", () => {
  it("generates a 10-character code using only unambiguous characters", () => {
    const code = generateCertificateCode();
    expect(code).toHaveLength(10);
    // Unambiguous alphabet: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (no 0, 1, I, O)
    expect(/^[2-9A-HJ-NP-Z]{10}$/.test(code)).toBe(true);
    expect(code).not.toMatch(/[01IO]/);
  });

  it("generates unique codes on subsequent calls", () => {
    const code1 = generateCertificateCode();
    const code2 = generateCertificateCode();
    expect(code1).not.toBe(code2);
  });
});

describe("Certificate Issue Schema Validation (F-CERT-03)", () => {
  it("validates valid certificate issue input", () => {
    const input = {
      templateId: "tmpl-intern",
      userId: "user-intern-1",
      kind: CertKind.INTERNSHIP_COMPLETION,
      title: "Internship Completion Certificate",
      customData: {
        role: "Web Application Development Intern",
        grade: "Exceeds Expectations",
      },
    };

    const parsed = IssueCertificateSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kind).toBe(CertKind.INTERNSHIP_COMPLETION);
      expect(parsed.data.title).toBe("Internship Completion Certificate");
    }
  });

  it("rejects empty titles or invalid certificate kinds", () => {
    expect(
      IssueCertificateSchema.safeParse({
        templateId: "t",
        userId: "u",
        kind: CertKind.INTERNSHIP_COMPLETION,
        title: "",
      }).success
    ).toBe(false);

    expect(
      IssueCertificateSchema.safeParse({
        templateId: "t",
        userId: "u",
        kind: "INVALID_KIND" as any,
        title: "Valid Title",
      }).success
    ).toBe(false);
  });
});
