import { createHash } from "crypto";
import { logger } from "../logger";

/**
 * Device fingerprinting utilities for enhanced MFA security
 * Generates unique device fingerprints for security context validation
 */

export interface DeviceContext {
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  ipAddress: string;
  location?: string;
}

export interface DeviceFingerprintData {
  hash: string;
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  deviceName?: string;
}

/**
 * Generate a unique device fingerprint hash from device characteristics
 */
export function generateDeviceFingerprint(
  context: DeviceContext,
): DeviceFingerprintData {
  try {
    // Combine device characteristics for fingerprinting
    const fingerprintData = [
      context.userAgent || "unknown",
      context.screenResolution || "unknown",
      context.timezone || "unknown",
      context.language || "unknown",
      context.platform || "unknown",
    ].join("|");

    // Create SHA-256 hash of device characteristics
    const hash = createHash("sha256").update(fingerprintData).digest("hex");

    // Generate user-friendly device name
    const deviceName = generateDeviceName(context);

    return {
      hash,
      userAgent: context.userAgent,
      screenResolution: context.screenResolution,
      timezone: context.timezone,
      language: context.language,
      platform: context.platform,
      deviceName,
    };
  } catch (error) {
    logger.error("Failed to generate device fingerprint", {
      error: error instanceof Error ? error.message : "Unknown error",
      userAgent: context.userAgent?.substring(0, 50), // Log partial UA for debugging
    });

    // Return a basic fingerprint in case of error
    const fallbackHash = createHash("sha256")
      .update(context.userAgent || "unknown")
      .digest("hex");
    return {
      hash: fallbackHash,
      userAgent: context.userAgent,
      deviceName: "Unknown Device",
    };
  }
}

/**
 * Generate a user-friendly device name from context
 */
function generateDeviceName(context: DeviceContext): string {
  const ua = context.userAgent || "";

  // Mobile devices
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) {
    if (ua.includes("Mobile")) return "Android Phone";
    return "Android Tablet";
  }

  // Desktop browsers
  if (ua.includes("Chrome")) {
    if (ua.includes("Mac")) return "Chrome on Mac";
    if (ua.includes("Windows")) return "Chrome on Windows";
    if (ua.includes("Linux")) return "Chrome on Linux";
    return "Chrome Browser";
  }

  if (ua.includes("Firefox")) {
    if (ua.includes("Mac")) return "Firefox on Mac";
    if (ua.includes("Windows")) return "Firefox on Windows";
    if (ua.includes("Linux")) return "Firefox on Linux";
    return "Firefox Browser";
  }

  if (ua.includes("Safari") && !ua.includes("Chrome")) {
    if (ua.includes("Mac")) return "Safari on Mac";
    return "Safari Browser";
  }

  if (ua.includes("Edge")) {
    if (ua.includes("Windows")) return "Edge on Windows";
    return "Edge Browser";
  }

  // Operating system detection
  if (ua.includes("Mac")) return "Mac Device";
  if (ua.includes("Windows")) return "Windows Device";
  if (ua.includes("Linux")) return "Linux Device";

  return "Unknown Device";
}

/**
 * Validate device context for basic security checks
 */
export function validateDeviceContext(context: DeviceContext): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;

  // Check for missing critical fields
  if (!context.userAgent || context.userAgent.length < 10) {
    warnings.push("Invalid or missing user agent");
    isValid = false;
  }

  if (!context.ipAddress) {
    warnings.push("Missing IP address");
    isValid = false;
  }

  // Check for suspicious patterns
  if (context.userAgent && context.userAgent.includes("bot")) {
    warnings.push("Potential bot detected in user agent");
  }

  // Check for common automation tools
  const automationPatterns = [
    "selenium",
    "phantomjs",
    "headless",
    "automation",
  ];
  if (
    context.userAgent &&
    automationPatterns.some((pattern) =>
      context.userAgent.toLowerCase().includes(pattern),
    )
  ) {
    warnings.push("Automation tool detected");
  }

  return { isValid, warnings };
}

/**
 * Extract device context from HTTP request headers
 */
export function extractDeviceContext(
  headers: Record<string, string | string[] | undefined>,
  ipAddress: string,
): DeviceContext {
  const userAgent = Array.isArray(headers["user-agent"])
    ? headers["user-agent"][0] || ""
    : headers["user-agent"] || "";

  return {
    userAgent,
    timezone: Array.isArray(headers["x-timezone"])
      ? headers["x-timezone"][0]
      : headers["x-timezone"],
    language: Array.isArray(headers["accept-language"])
      ? headers["accept-language"][0]
      : headers["accept-language"],
    ipAddress,
    // Additional fields can be populated from client-side JavaScript
  };
}

/**
 * Check if two device fingerprints are similar (for detecting device changes)
 */
export function compareDeviceFingerprints(
  fp1: DeviceFingerprintData,
  fp2: DeviceFingerprintData,
): {
  similarity: number;
  differences: string[];
} {
  const differences: string[] = [];
  let matchingFields = 0;
  let totalFields = 0;

  const fields: (keyof DeviceFingerprintData)[] = [
    "userAgent",
    "screenResolution",
    "timezone",
    "language",
    "platform",
  ];

  for (const field of fields) {
    totalFields++;
    if (fp1[field] === fp2[field]) {
      matchingFields++;
    } else if (fp1[field] && fp2[field]) {
      differences.push(`${field}_changed`);
    }
  }

  const similarity = totalFields > 0 ? matchingFields / totalFields : 0;

  return { similarity, differences };
}
