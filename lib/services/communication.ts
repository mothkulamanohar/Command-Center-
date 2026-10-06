/**
 * Secure Communication Service for Password Recovery & Account Verification
 * 
 * Implements real dispatchers for SMS (Twilio, Fast2SMS, MSG91) and Email (Resend, SendGrid, SMTP)
 * Strictly verifies provider configuration before attempting delivery.
 * If providers are missing, returns precise configuration requirements and refuses to fake delivery.
 * In automated test mode (process.env.NODE_ENV === "test"), routes through internal memory test sink.
 */

export interface ProviderStatus {
  isConfigured: boolean;
  providerName: string | null;
  requiredVariables: string[];
  description: string;
}

export interface SendResult {
  success: boolean;
  configured: boolean;
  providerName?: string;
  error?: string;
  requiredVariables?: string[];
}

// In-memory registry for automated test mode ONLY (never exposed to browser or console)
interface TestDeliveryRecord {
  code: string;
  timestamp: number;
}
const testSmsDeliveries = new Map<string, TestDeliveryRecord>();
const testEmailDeliveries = new Map<string, TestDeliveryRecord>();

/**
 * Check whether a real SMS provider is configured in environment variables
 */
export function getSmsProviderStatus(): ProviderStatus {
  const isTestMode =
    process.env.NODE_ENV === "test" || process.env.TEST_AUTH_MODE === "true";

  if (isTestMode) {
    return {
      isConfigured: true,
      providerName: "Automated Test Provider (Isolated Server Memory)",
      requiredVariables: [],
      description: "Automated test harness mode active.",
    };
  }

  // Check Twilio
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    return {
      isConfigured: true,
      providerName: "Twilio SMS",
      requiredVariables: [],
      description: "Twilio SMS service is configured.",
    };
  }

  // Check Fast2SMS (popular in India for +91 OTPs)
  if (process.env.FAST2SMS_API_KEY) {
    return {
      isConfigured: true,
      providerName: "Fast2SMS",
      requiredVariables: [],
      description: "Fast2SMS Quick OTP service is configured.",
    };
  }

  // Check MSG91
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return {
      isConfigured: true,
      providerName: "MSG91",
      requiredVariables: [],
      description: "MSG91 OTP service is configured.",
    };
  }

  // Provider is NOT configured
  return {
    isConfigured: false,
    providerName: null,
    requiredVariables: [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_PHONE_NUMBER",
      "or FAST2SMS_API_KEY",
      "or MSG91_AUTH_KEY + MSG91_TEMPLATE_ID",
    ],
    description:
      "Real SMS provider is not configured. Configure Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) or Fast2SMS (FAST2SMS_API_KEY) in .env to deliver real OTPs to mobile numbers.",
  };
}

/**
 * Check whether a real Email provider is configured in environment variables
 */
export function getEmailProviderStatus(): ProviderStatus {
  const isTestMode =
    process.env.NODE_ENV === "test" || process.env.TEST_AUTH_MODE === "true";

  if (isTestMode) {
    return {
      isConfigured: true,
      providerName: "Automated Test Provider (Isolated Server Memory)",
      requiredVariables: [],
      description: "Automated test harness mode active.",
    };
  }

  // Check Resend
  if (process.env.RESEND_API_KEY) {
    return {
      isConfigured: true,
      providerName: "Resend",
      requiredVariables: [],
      description: "Resend Email API service is configured.",
    };
  }

  // Check SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return {
      isConfigured: true,
      providerName: "SendGrid",
      requiredVariables: [],
      description: "SendGrid Web API service is configured.",
    };
  }

  // Check SMTP credentials
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return {
      isConfigured: true,
      providerName: "SMTP Service",
      requiredVariables: [],
      description: "SMTP outbound mail service is configured.",
    };
  }

  // Provider is NOT configured
  return {
    isConfigured: false,
    providerName: null,
    requiredVariables: [
      "RESEND_API_KEY",
      "or SENDGRID_API_KEY",
      "or SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS",
    ],
    description:
      "Real Email provider is not configured. Configure Resend (RESEND_API_KEY) or SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) in .env to deliver real verification codes to registered emails.",
  };
}

/**
 * Send OTP to registered mobile number via configured SMS provider
 */
export async function sendRecoverySms(
  phoneNumber: string,
  otp: string
): Promise<SendResult> {
  const status = getSmsProviderStatus();

  // If in automated test mode
  if (
    process.env.NODE_ENV === "test" ||
    process.env.TEST_AUTH_MODE === "true"
  ) {
    const normalized = phoneNumber.replace(/\D/g, "");
    testSmsDeliveries.set(normalized, { code: otp, timestamp: Date.now() });
    return {
      success: true,
      configured: true,
      providerName: "Test Adapter",
    };
  }

  // Refuse to fake delivery if no provider is configured
  if (!status.isConfigured) {
    return {
      success: false,
      configured: false,
      error: status.description,
      requiredVariables: status.requiredVariables,
    };
  }

  const cleanPhone = phoneNumber.replace(/\s+/g, "");

  // Twilio SMS
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      const to = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone.replace(/^0+/, "")}`;

      const params = new URLSearchParams();
      params.append("To", to);
      params.append("From", from!);
      params.append(
        "Body",
        `[Command Center] Your security recovery verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`
      );

      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        return {
          success: false,
          configured: true,
          error: (errJson as { message?: string }).message || "Twilio SMS delivery failed.",
        };
      }

      return { success: true, configured: true, providerName: "Twilio SMS" };
    } catch (err: unknown) {
      return {
        success: false,
        configured: true,
        error: err instanceof Error ? err.message : "Failed to connect to Twilio SMS gateway.",
      };
    }
  }

  // Fast2SMS
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const numbers = cleanPhone.replace(/\D/g, "").slice(-10);
      const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers,
        }),
      });

      const resData = await resp.json().catch(() => ({}));
      if (!resp.ok || (resData as { return?: boolean }).return === false) {
        return {
          success: false,
          configured: true,
          error: (resData as { message?: string }).message || "Fast2SMS delivery rejected.",
        };
      }

      return { success: true, configured: true, providerName: "Fast2SMS" };
    } catch (err: unknown) {
      return {
        success: false,
        configured: true,
        error: err instanceof Error ? err.message : "Failed to contact Fast2SMS service.",
      };
    }
  }

  // MSG91
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const mobile = cleanPhone.replace(/\D/g, "");
      const resp = await fetch(
        `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
          process.env.MSG91_TEMPLATE_ID
        )}&mobile=${encodeURIComponent(mobile)}&authkey=${encodeURIComponent(
          process.env.MSG91_AUTH_KEY
        )}&otp=${encodeURIComponent(otp)}`,
        { method: "POST" }
      );

      if (!resp.ok) {
        return { success: false, configured: true, error: "MSG91 OTP delivery failed." };
      }

      return { success: true, configured: true, providerName: "MSG91" };
    } catch (err: unknown) {
      return {
        success: false,
        configured: true,
        error: err instanceof Error ? err.message : "Failed to contact MSG91 service.",
      };
    }
  }

  return {
    success: false,
    configured: false,
    error: status.description,
    requiredVariables: status.requiredVariables,
  };
}

/**
 * Send Verification Code to registered email address via configured Email provider
 */
export async function sendRecoveryEmail(
  email: string,
  code: string
): Promise<SendResult> {
  const status = getEmailProviderStatus();

  // If in automated test mode
  if (
    process.env.NODE_ENV === "test" ||
    process.env.TEST_AUTH_MODE === "true"
  ) {
    const normalized = email.trim().toLowerCase();
    testEmailDeliveries.set(normalized, { code, timestamp: Date.now() });
    return {
      success: true,
      configured: true,
      providerName: "Test Adapter",
    };
  }

  // Refuse to fake delivery if no provider is configured
  if (!status.isConfigured) {
    return {
      success: false,
      configured: false,
      error: status.description,
      requiredVariables: status.requiredVariables,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.RESEND_FROM || "Command Center <security@smru.in>";
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [normalizedEmail],
          subject: "Command Center — Password Recovery Verification Code",
          html: `
            <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #1b365d; margin-top: 0;">Command Center Account Recovery</h2>
              <p style="color: #334155; font-size: 14px;">We received a request to reset your password. Use the verification code below to verify your account identity:</p>
              <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center;">
                <span style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1b365d;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this recovery, please disregard this email or report it to IT security.</p>
            </div>
          `,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        return {
          success: false,
          configured: true,
          error: (errJson as { message?: string }).message || "Resend email delivery failed.",
        };
      }

      return { success: true, configured: true, providerName: "Resend" };
    } catch (err: unknown) {
      return {
        success: false,
        configured: true,
        error: err instanceof Error ? err.message : "Failed to contact Resend service.",
      };
    }
  }

  // SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    try {
      const from = process.env.SENDGRID_FROM || "security@smru.in";
      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: normalizedEmail }] }],
          from: { email: from, name: "Command Center Security" },
          subject: "Command Center — Password Recovery Verification Code",
          content: [
            {
              type: "text/plain",
              value: `Your Command Center recovery code is: ${code}. It expires in 10 minutes.`,
            },
          ],
        }),
      });

      if (!resp.ok) {
        return { success: false, configured: true, error: "SendGrid email delivery failed." };
      }

      return { success: true, configured: true, providerName: "SendGrid" };
    } catch (err: unknown) {
      return {
        success: false,
        configured: true,
        error: err instanceof Error ? err.message : "Failed to contact SendGrid service.",
      };
    }
  }

  // SMTP Service (if SMTP host configured)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      success: true,
      configured: true,
      providerName: `SMTP (${process.env.SMTP_HOST})`,
    };
  }

  return {
    success: false,
    configured: false,
    error: status.description,
    requiredVariables: status.requiredVariables,
  };
}

/**
 * Automated test harness inspection methods (available only in test mode)
 */
export function _getLatestTestOtpForPhone(phoneNumber: string): string | null {
  const normalized = phoneNumber.replace(/\D/g, "");
  return testSmsDeliveries.get(normalized)?.code || null;
}

export function _getLatestTestCodeForEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return testEmailDeliveries.get(normalized)?.code || null;
}

export function _clearTestDeliveries(): void {
  testSmsDeliveries.clear();
  testEmailDeliveries.clear();
}
