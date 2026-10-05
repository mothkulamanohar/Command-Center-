import ipaddr from "ipaddr.js";

/**
 * Checks if a client IP address matches any allowed CIDR range or exact IP
 * SPEC §10.5 (F-ATT-02)
 */
export function isIpInRanges(clientIp: string, allowedRanges: string[]): boolean {
  if (!clientIp || !allowedRanges || allowedRanges.length === 0) {
    return false;
  }

  // Clean IP (remove IPv6 mapped IPv4 prefix if present, e.g. ::ffff:192.168.1.1)
  let cleanIp = clientIp.trim();
  if (cleanIp.startsWith("::ffff:")) {
    cleanIp = cleanIp.slice(7);
  }

  // Local development shortcuts
  if (cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp === "localhost") {
    if (
      allowedRanges.includes("127.0.0.1/32") ||
      allowedRanges.includes("127.0.0.1") ||
      allowedRanges.includes("::1/128") ||
      allowedRanges.includes("::1") ||
      allowedRanges.includes("localhost")
    ) {
      return true;
    }
  }

  let parsedClient: ipaddr.IP;
  try {
    parsedClient = ipaddr.process(cleanIp);
  } catch {
    return false;
  }

  for (const range of allowedRanges) {
    try {
      const trimmedRange = range.trim();
      if (!trimmedRange) continue;

      if (trimmedRange.includes("/")) {
        const parsedCIDR = ipaddr.parseCIDR(trimmedRange);
        if (parsedClient.kind() === parsedCIDR[0].kind()) {
          if ((parsedClient as any).match(parsedCIDR)) {
            return true;
          }
        }
      } else {
        const parsedTarget = ipaddr.process(trimmedRange);
        if (parsedClient.toString() === parsedTarget.toString()) {
          return true;
        }
      }
    } catch {
      // Continue to next range if one is malformed
      continue;
    }
  }

  return false;
}

/**
 * Extracts the real client IP address from HTTP request headers,
 * supporting cloud reverse proxies (Cloudflare, AWS ALB, Nginx, Fly.io, etc.).
 */
export function getClientIpFromHeaders(headers: Headers): string {
  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  // AWS ALB / Nginx
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  // Standard X-Forwarded-For
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",");
    if (parts.length > 0 && parts[0].trim()) {
      return parts[0].trim();
    }
  }

  // Fallback
  return "127.0.0.1";
}

