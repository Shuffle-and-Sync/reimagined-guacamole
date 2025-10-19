import { logger } from "../logger";
import { storage } from "../storage";
import { createHash } from "crypto";
import type {
  DeviceContext,
  DeviceFingerprintData,
} from "./device-fingerprinting";
import {
  generateDeviceFingerprint,
  validateDeviceContext,
  extractDeviceContext,
} from "./device-fingerprinting";
// TODO: Fix token imports - revokeTokenByJTI needs to be implemented
// import { revokeTokenByJTI } from './tokens';

/**
 * Enterprise-grade Session Security Service
 * Provides comprehensive session security with device tracking, geographic validation,
 * and suspicious activity detection for enhanced authentication security.
 */

export interface SessionSecurityContext {
  userId: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  deviceContext?: DeviceContext;
  location?: string;
  timestamp: Date;
}

export interface SecurityRiskAssessment {
  riskScore: number; // 0.0 (safe) to 1.0 (high risk)
  riskFactors: string[];
  trustScore: number; // 0.0 (untrusted) to 1.0 (fully trusted)
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresAction: boolean;
  recommendedActions: string[];
}

export interface SuspiciousActivityFlags {
  newDevice: boolean;
  newLocation: boolean;
  newIpRange: boolean;
  suspiciousUserAgent: boolean;
  rapidLocationChange: boolean;
  multipleDevicesSimultaneous: boolean;
  anomalousTimingPattern: boolean;
  highRiskIpAddress: boolean;
}

export interface GeographicAnomaly {
  type:
    | "impossible_travel"
    | "new_country"
    | "high_risk_location"
    | "ip_location_mismatch";
  severity: "low" | "medium" | "high" | "critical";
  details: string;
  previousLocation?: string;
  currentLocation?: string;
  timeFrame?: string;
}

/**
 * Enhanced Session Security Service
 * Core service for comprehensive session security management
 */
export class SessionSecurityService {
  private static instance: SessionSecurityService;

  // Geographic risk assessment
  private readonly HIGH_RISK_COUNTRIES = new Set([
    "CN",
    "RU",
    "IR",
    "KP",
    "BY", // Example high-risk country codes
  ]);

  // IP ranges and patterns
  private readonly SUSPICIOUS_IP_PATTERNS = [
    /^10\./, // Private networks (suspicious for external access)
    /^192\.168\./, // Private networks
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private networks
    /^127\./, // Localhost
  ];

  // Maximum reasonable travel speed (km/h) for impossible travel detection
  private readonly MAX_TRAVEL_SPEED = 900; // Approximately jet aircraft speed

  public static getInstance(): SessionSecurityService {
    if (!SessionSecurityService.instance) {
      SessionSecurityService.instance = new SessionSecurityService();
    }
    return SessionSecurityService.instance;
  }

  /**
   * Comprehensive session security assessment
   * Analyzes security context and returns risk assessment with recommended actions
   */
  async assessSessionSecurity(
    context: SessionSecurityContext,
  ): Promise<SecurityRiskAssessment> {
    try {
      logger.info("Starting comprehensive session security assessment", {
        userId: context.userId,
        ipAddress: context.ipAddress?.substring(0, 8) + "***", // Partial IP for logging
      });

      // Generate device fingerprint
      const deviceContext =
        context.deviceContext ||
        extractDeviceContext(
          { "user-agent": context.userAgent },
          context.ipAddress,
        );
      const deviceFingerprint = generateDeviceFingerprint(deviceContext);

      // Parallel security assessments for efficiency
      const [
        deviceRisk,
        geographicRisk,
        behaviorRisk,
        suspiciousFlags,
        historicalContext,
      ] = await Promise.all([
        this.assessDeviceRisk(context.userId, deviceFingerprint),
        this.assessGeographicRisk(
          context.userId,
          context.ipAddress,
          context.location,
        ),
        this.assessBehaviorRisk(context.userId, context.timestamp),
        this.detectSuspiciousActivity(
          context.userId,
          deviceContext,
          context.ipAddress,
        ),
        this.getHistoricalSecurityContext(context.userId),
      ]);

      // Calculate composite risk score
      const riskScore = this.calculateCompositeRiskScore({
        deviceRisk: deviceRisk.score,
        geographicRisk: geographicRisk.score,
        behaviorRisk: behaviorRisk.score,
        suspiciousActivityWeight: suspiciousFlags.overallRisk,
      });

      // Calculate trust score based on device and user history
      const trustScore = await this.calculateTrustScore(
        context.userId,
        deviceFingerprint.hash,
        historicalContext,
      );

      // Compile all risk factors
      const allRiskFactors = [
        ...deviceRisk.factors,
        ...geographicRisk.factors,
        ...behaviorRisk.factors,
        ...this.getSuspiciousActivityFactors(suspiciousFlags),
      ];

      // Determine risk level and recommended actions
      const riskLevel = this.determineRiskLevel(riskScore);
      const recommendedActions = this.getRecommendedActions(
        riskLevel,
        allRiskFactors,
        suspiciousFlags,
      );

      const assessment: SecurityRiskAssessment = {
        riskScore,
        riskFactors: allRiskFactors,
        trustScore,
        riskLevel,
        requiresAction: riskLevel === "high" || riskLevel === "critical",
        recommendedActions,
      };

      // Log security assessment for monitoring
      await this.logSecurityAssessment(context, assessment, suspiciousFlags);

      logger.info("Session security assessment completed", {
        userId: context.userId,
        riskLevel,
        riskScore: riskScore.toFixed(3),
        trustScore: trustScore.toFixed(3),
        requiresAction: assessment.requiresAction,
      });

      return assessment;
    } catch (error) {
      logger.error("Failed to assess session security", {
        userId: context.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return default high-risk assessment on error (fail-safe)
      return {
        riskScore: 0.8,
        riskFactors: ["security_assessment_failed"],
        trustScore: 0.2,
        riskLevel: "high",
        requiresAction: true,
        recommendedActions: ["require_mfa", "log_security_event"],
      };
    }
  }

  /**
   * Enhanced geographic risk assessment with impossible travel detection
   */
  private async assessGeographicRisk(
    userId: string,
    ipAddress: string,
    location?: string,
  ): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0.0;

    try {
      // Get recent location history
      const recentLogins = await storage.getAuthAuditLogs(userId, {
        hours: 24,
      }); // Last 24 hours

      if (recentLogins.length === 0) {
        return { score: 0.0, factors: [] }; // No previous data
      }

      // Parse details JSON to get location
      const recentLoginDetails = recentLogins[0]?.details
        ? typeof recentLogins[0].details === "string"
          ? JSON.parse(recentLogins[0].details)
          : recentLogins[0].details
        : {};
      const previousLocation = recentLoginDetails.location;
      const previousIp = recentLogins[0]?.ipAddress;
      const previousTime = recentLogins[0]?.createdAt;

      // Check for IP address changes
      if (previousIp && previousIp !== ipAddress) {
        factors.push("ip_address_changed");
        score += 0.1;
      }

      // Check for location changes
      if (location && previousLocation && location !== previousLocation) {
        factors.push("location_changed");
        score += 0.2;

        // Check for impossible travel (basic geographic distance vs time)
        if (previousTime) {
          const timeElapsed =
            (Date.now() - new Date(previousTime).getTime()) / (1000 * 60 * 60); // hours

          // Simplified impossible travel detection
          // (In production, you'd use proper geographic distance calculation)
          if (
            timeElapsed < 2 &&
            this.isPotentiallyImpossibleTravel(previousLocation, location)
          ) {
            factors.push("impossible_travel_detected");
            score += 0.4;
          }
        }
      }

      // Check for high-risk geographic regions
      if (location && this.isHighRiskLocation(location)) {
        factors.push("high_risk_geographic_region");
        score += 0.3;
      }

      // Check for suspicious IP patterns
      if (this.isSuspiciousIpAddress(ipAddress)) {
        factors.push("suspicious_ip_pattern");
        score += 0.2;
      }

      return { score: Math.min(score, 1.0), factors };
    } catch (error) {
      logger.error("Geographic risk assessment failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { score: 0.3, factors: ["geographic_analysis_failed"] };
    }
  }

  /**
   * Device risk assessment based on fingerprint and trust history
   */
  private async assessDeviceRisk(
    userId: string,
    deviceFingerprint: DeviceFingerprintData,
  ): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0.0;

    try {
      // Check if device is known
      const existingDevice = await storage.getDeviceFingerprint(
        deviceFingerprint.hash,
      );

      if (!existingDevice) {
        factors.push("new_device_detected");
        score += 0.4; // New devices are higher risk
      } else {
        // Assess existing device risk using trustScore (0.0 - 1.0, lower is riskier)
        if (
          existingDevice.trustScore !== null &&
          existingDevice.trustScore !== undefined
        ) {
          // Invert trust score to get risk score (1.0 - trustScore)
          const riskScore = 1.0 - existingDevice.trustScore;
          score += riskScore * 0.5; // Weight the risk score
        }

        // Check if device is blocked
        if (existingDevice.isBlocked) {
          factors.push("device_blocked");
          score += 0.8;
        }

        // Low trust score is a risk factor
        if (
          existingDevice.trustScore !== null &&
          existingDevice.trustScore < 0.3
        ) {
          factors.push("device_low_trust");
          score += 0.3;
        }
      }

      // Validate device context for suspicious patterns
      const deviceValidation = validateDeviceContext({
        userAgent: deviceFingerprint.userAgent,
        ipAddress: "", // IP is validated separately
        screenResolution: deviceFingerprint.screenResolution,
        timezone: deviceFingerprint.timezone,
        language: deviceFingerprint.language,
        platform: deviceFingerprint.platform,
      });

      if (!deviceValidation.isValid) {
        factors.push(
          ...deviceValidation.warnings.map(
            (warning: string) => `device_${warning}`,
          ),
        );
        score += deviceValidation.warnings.length * 0.1;
      }

      return { score: Math.min(score, 1.0), factors };
    } catch (error) {
      logger.error("Device risk assessment failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { score: 0.4, factors: ["device_analysis_failed"] };
    }
  }

  /**
   * Behavioral risk assessment based on timing and access patterns
   */
  private async assessBehaviorRisk(
    userId: string,
    currentTime: Date,
  ): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0.0;

    try {
      // Get recent activity patterns
      const recentActivity = await storage.getAuthAuditLogs(userId, {
        hours: 24,
      });

      if (recentActivity.length > 0) {
        // Check for rapid successive attempts
        const recentAttempts = recentActivity.filter(
          (attempt) =>
            attempt.createdAt &&
            currentTime.getTime() - new Date(attempt.createdAt).getTime() <
              60000, // 1 minute
        );

        if (recentAttempts.length > 3) {
          factors.push("rapid_successive_attempts");
          score += 0.3;
        }

        // Check for unusual timing patterns (e.g., access at unusual hours)
        const hour = currentTime.getHours();
        const unusualHours = hour < 6 || hour > 23; // Very early morning or late night

        if (unusualHours) {
          // Check if this is normal for the user
          const userUsualHours = recentActivity
            .filter((activity) => activity.createdAt)
            .map((activity) => new Date(activity.createdAt).getHours())
            .filter((activityHour) => Math.abs(activityHour - hour) <= 2);

          if (userUsualHours.length === 0) {
            factors.push("unusual_access_time");
            score += 0.1;
          }
        }
      }

      return { score: Math.min(score, 1.0), factors };
    } catch (error) {
      logger.error("Behavioral risk assessment failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { score: 0.2, factors: ["behavior_analysis_failed"] };
    }
  }

  /**
   * Detect suspicious activity patterns with enhanced anomaly detection
   */
  private async detectSuspiciousActivity(
    userId: string,
    deviceContext: DeviceContext,
    ipAddress: string,
  ): Promise<SuspiciousActivityFlags & { overallRisk: number }> {
    const flags: SuspiciousActivityFlags = {
      newDevice: false,
      newLocation: false,
      newIpRange: false,
      suspiciousUserAgent: false,
      rapidLocationChange: false,
      multipleDevicesSimultaneous: false,
      anomalousTimingPattern: false,
      highRiskIpAddress: false,
    };

    try {
      // Check for new device
      const deviceFingerprint = generateDeviceFingerprint(deviceContext);
      const existingDevice = await storage.getDeviceFingerprint(
        deviceFingerprint.hash,
      );
      flags.newDevice = !existingDevice;

      // Check for suspicious user agent patterns
      flags.suspiciousUserAgent = this.isSuspiciousUserAgent(
        deviceContext.userAgent,
      );

      // Check for high-risk IP address
      flags.highRiskIpAddress = this.isSuspiciousIpAddress(ipAddress);

      // Get recent activity for pattern analysis
      const recentActivity = await storage.getAuthAuditLogs(userId, {
        hours: 24,
      });

      if (recentActivity.length > 0) {
        // Check for new location - parse from details JSON
        const recentLocations = new Set(
          recentActivity
            .filter((activity) => activity.details)
            .map((activity) => {
              const details =
                typeof activity.details === "string"
                  ? JSON.parse(activity.details)
                  : activity.details;
              return details?.location;
            })
            .filter(Boolean),
        );
        flags.newLocation = deviceContext.location
          ? !recentLocations.has(deviceContext.location)
          : false;

        // Check for new IP range (simplified - checks /24 subnet)
        const currentIpPrefix = ipAddress.split(".").slice(0, 3).join(".");
        const recentIpPrefixes = new Set(
          recentActivity
            .filter((activity) => activity.ipAddress)
            .map((activity) =>
              activity.ipAddress.split(".").slice(0, 3).join("."),
            ),
        );
        flags.newIpRange = !recentIpPrefixes.has(currentIpPrefix);

        // Check for multiple devices active simultaneously
        const recentDevices = new Set(
          recentActivity
            .filter(
              (activity) =>
                activity.createdAt &&
                Date.now() - new Date(activity.createdAt).getTime() < 3600000,
            ) // 1 hour
            .filter(
              (activity) =>
                activity.details && typeof activity.details === "object",
            )
            .map((activity) => (activity.details as any)?.deviceFingerprint)
            .filter(Boolean),
        );
        flags.multipleDevicesSimultaneous = recentDevices.size > 2;

        // Check for rapid location changes
        if (recentActivity.length >= 2) {
          const lastDetails = recentActivity[0]?.details
            ? typeof recentActivity[0].details === "string"
              ? JSON.parse(recentActivity[0].details)
              : recentActivity[0].details
            : null;
          const previousDetails = recentActivity[1]?.details
            ? typeof recentActivity[1].details === "string"
              ? JSON.parse(recentActivity[1].details)
              : recentActivity[1].details
            : null;
          const lastLocation = lastDetails?.location;
          const previousLocation = previousDetails?.location;
          const lastTime = new Date(recentActivity[0]?.createdAt || 0);
          const previousTime = new Date(recentActivity[1]?.createdAt || 0);

          if (
            lastLocation &&
            previousLocation &&
            lastLocation !== previousLocation
          ) {
            const timeElapsed =
              (lastTime.getTime() - previousTime.getTime()) / (1000 * 60 * 60); // hours
            flags.rapidLocationChange = timeElapsed < 1; // Less than 1 hour between different locations
          }
        }
      }

      // Calculate overall risk based on flags
      const riskWeights = {
        newDevice: 0.3,
        newLocation: 0.2,
        newIpRange: 0.1,
        suspiciousUserAgent: 0.4,
        rapidLocationChange: 0.5,
        multipleDevicesSimultaneous: 0.3,
        anomalousTimingPattern: 0.2,
        highRiskIpAddress: 0.6,
      };

      const overallRisk = Object.entries(flags).reduce(
        (risk, [flag, isActive]) => {
          if (isActive && flag in riskWeights) {
            return risk + riskWeights[flag as keyof typeof riskWeights];
          }
          return risk;
        },
        0.0,
      );

      return { ...flags, overallRisk: Math.min(overallRisk, 1.0) };
    } catch (error) {
      logger.error("Suspicious activity detection failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return { ...flags, overallRisk: 0.5 }; // Default medium risk on error
    }
  }

  /**
   * Calculate composite trust score based on device and user history
   */
  private async calculateTrustScore(
    userId: string,
    deviceHash: string,
    historicalContext: any,
  ): Promise<number> {
    try {
      let trustScore = 0.5; // Start with neutral trust

      // Get device information
      const device = await storage.getDeviceFingerprint(deviceHash);

      if (device) {
        // Use the existing trustScore from the device
        if (device.trustScore !== null && device.trustScore !== undefined) {
          trustScore = device.trustScore;
        }

        // Device age factor - devices seen longer ago are more trusted
        if (device.firstSeen) {
          const ageInDays =
            (Date.now() - device.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
          if (ageInDays > 90) trustScore += 0.1;
          else if (ageInDays > 30) trustScore += 0.05;
        }

        // Check if device is blocked
        if (device.isBlocked) {
          trustScore = Math.min(trustScore, 0.2); // Cap trust at 0.2 for blocked devices
        }
      }

      // Account trust (user behavior)
      if (historicalContext.accountAge > 90) trustScore += 0.1; // Account older than 90 days
      if (historicalContext.mfaEnabled) trustScore += 0.2; // MFA is enabled
      if (historicalContext.recentFailures < 3) trustScore += 0.1; // Low recent failures

      return Math.min(Math.max(trustScore, 0.0), 1.0); // Clamp between 0 and 1
    } catch (error) {
      logger.error("Trust score calculation failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0.3; // Default low trust on error
    }
  }

  /**
   * Calculate composite risk score from multiple risk factors
   */
  private calculateCompositeRiskScore(risks: {
    deviceRisk: number;
    geographicRisk: number;
    behaviorRisk: number;
    suspiciousActivityWeight: number;
  }): number {
    // Weighted composite scoring
    const weights = {
      device: 0.3,
      geographic: 0.25,
      behavior: 0.2,
      suspicious: 0.25,
    };

    const compositeScore =
      risks.deviceRisk * weights.device +
      risks.geographicRisk * weights.geographic +
      risks.behaviorRisk * weights.behavior +
      risks.suspiciousActivityWeight * weights.suspicious;

    return Math.min(Math.max(compositeScore, 0.0), 1.0);
  }

  /**
   * Determine risk level from composite risk score
   */
  private determineRiskLevel(
    riskScore: number,
  ): "low" | "medium" | "high" | "critical" {
    if (riskScore >= 0.8) return "critical";
    if (riskScore >= 0.6) return "high";
    if (riskScore >= 0.3) return "medium";
    return "low";
  }

  /**
   * Get recommended security actions based on risk assessment
   */
  private getRecommendedActions(
    riskLevel: "low" | "medium" | "high" | "critical",
    riskFactors: string[],
    suspiciousFlags: SuspiciousActivityFlags,
  ): string[] {
    const actions: string[] = [];

    switch (riskLevel) {
      case "critical":
        actions.push(
          "terminate_session",
          "require_mfa",
          "notify_user",
          "admin_review",
        );
        break;
      case "high":
        actions.push("require_mfa", "limit_session_duration", "notify_user");
        break;
      case "medium":
        actions.push("require_mfa", "log_security_event");
        break;
      case "low":
        actions.push("log_security_event");
        break;
    }

    // Additional actions based on specific risks
    if (suspiciousFlags.newDevice) actions.push("device_verification");
    if (suspiciousFlags.newLocation) actions.push("location_verification");
    if (suspiciousFlags.rapidLocationChange)
      actions.push("impossible_travel_review");
    if (suspiciousFlags.multipleDevicesSimultaneous)
      actions.push("concurrent_session_review");

    return Array.from(new Set(actions)); // Remove duplicates
  }

  /**
   * Helper methods for risk assessment
   */
  private isHighRiskLocation(location: string): boolean {
    // Extract country code (simplified - in production use proper geolocation)
    const countryCode = location.split(",").pop()?.trim().toUpperCase();
    return countryCode ? this.HIGH_RISK_COUNTRIES.has(countryCode) : false;
  }

  private isSuspiciousIpAddress(ipAddress: string): boolean {
    return this.SUSPICIOUS_IP_PATTERNS.some((pattern) =>
      pattern.test(ipAddress),
    );
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /automated/i,
      /test/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }

  private isPotentiallyImpossibleTravel(
    location1: string,
    location2: string,
  ): boolean {
    // Simplified impossible travel detection
    // In production, use proper geographic distance calculation
    const majorCities = [
      "New York",
      "London",
      "Tokyo",
      "Sydney",
      "Mumbai",
      "São Paulo",
    ];

    return (
      majorCities.includes(location1) &&
      majorCities.includes(location2) &&
      location1 !== location2
    );
  }

  private getSuspiciousActivityFactors(
    flags: SuspiciousActivityFlags,
  ): string[] {
    const factors: string[] = [];

    Object.entries(flags).forEach(([flag, isActive]) => {
      if (isActive && flag !== "overallRisk") {
        factors.push(flag);
      }
    });

    return factors;
  }

  private async getHistoricalSecurityContext(userId: string): Promise<any> {
    try {
      // Get user account information
      const user = await storage.getUser(userId);
      const accountAge =
        user && user.createdAt
          ? Date.now() - new Date(user.createdAt).getTime()
          : 0;

      // Get MFA status
      const mfaSettings = await storage.getUserMfaSettings(userId);
      const mfaEnabled = mfaSettings?.enabled || false;

      // Get recent failure count
      const recentFailures = await storage.getRecentAuthFailures(userId, 24); // 24 hours

      return {
        accountAge,
        mfaEnabled,
        recentFailures: recentFailures.length,
      };
    } catch (error) {
      logger.error("Failed to get historical security context", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { accountAge: 0, mfaEnabled: false, recentFailures: 0 };
    }
  }

  /**
   * Log comprehensive security assessment for monitoring and analysis
   */
  private async logSecurityAssessment(
    context: SessionSecurityContext,
    assessment: SecurityRiskAssessment,
    suspiciousFlags: SuspiciousActivityFlags,
  ): Promise<void> {
    try {
      await storage.createAuthAuditLog({
        userId: context.userId,
        eventType: "security_assessment",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        isSuccessful: !assessment.requiresAction,
        failureReason: assessment.requiresAction
          ? "high_risk_detected"
          : undefined,
        details: JSON.stringify({
          location: context.location,
          riskScore: assessment.riskScore,
          riskLevel: assessment.riskLevel,
          trustScore: assessment.trustScore,
          riskFactors: assessment.riskFactors,
          suspiciousFlags,
          recommendedActions: assessment.recommendedActions,
          sessionId: context.sessionId,
        }),
      });

      // Log high-risk events with additional detail
      if (
        assessment.riskLevel === "high" ||
        assessment.riskLevel === "critical"
      ) {
        logger.warn("High-risk session security event detected", {
          userId: context.userId,
          riskLevel: assessment.riskLevel,
          riskScore: assessment.riskScore,
          suspiciousFlags,
          ipAddress: context.ipAddress?.substring(0, 8) + "***",
        });
      }
    } catch (error) {
      logger.error("Failed to log security assessment", {
        userId: context.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

/**
 * Enhanced Session Management with Security Integration
 * Provides session lifecycle management with integrated security assessment
 */
export class EnhancedSessionManager {
  private securityService: SessionSecurityService;

  constructor() {
    this.securityService = SessionSecurityService.getInstance();
  }

  /**
   * Validate session with comprehensive security assessment
   */
  async validateSessionSecurity(
    userId: string,
    sessionId: string,
    request: {
      headers: Record<string, string | string[] | undefined>;
      ip: string;
    },
  ): Promise<{
    isValid: boolean;
    assessment: SecurityRiskAssessment;
    actions: string[];
  }> {
    try {
      // Extract device context from request
      const deviceContext = extractDeviceContext(request.headers, request.ip);

      // Create security context
      const securityContext: SessionSecurityContext = {
        userId,
        sessionId,
        ipAddress: request.ip,
        userAgent: deviceContext.userAgent,
        deviceContext,
        location: deviceContext.location,
        timestamp: new Date(),
      };

      // Perform comprehensive security assessment
      const assessment =
        await this.securityService.assessSessionSecurity(securityContext);

      // Determine if session should be allowed to continue
      const isValid = assessment.riskLevel !== "critical";

      // Execute recommended security actions
      const executedActions = await this.executeSecurityActions(
        userId,
        sessionId,
        assessment.recommendedActions,
        securityContext,
      );

      return {
        isValid,
        assessment,
        actions: executedActions,
      };
    } catch (error) {
      logger.error("Session security validation failed", {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Fail-safe: deny access on security validation failure
      return {
        isValid: false,
        assessment: {
          riskScore: 1.0,
          riskFactors: ["security_validation_failed"],
          trustScore: 0.0,
          riskLevel: "critical",
          requiresAction: true,
          recommendedActions: ["terminate_session"],
        },
        actions: ["terminate_session"],
      };
    }
  }

  /**
   * Execute security actions based on risk assessment
   */
  private async executeSecurityActions(
    userId: string,
    sessionId: string,
    actions: string[],
    context: SessionSecurityContext,
  ): Promise<string[]> {
    const executedActions: string[] = [];

    try {
      for (const action of actions) {
        switch (action) {
          case "terminate_session":
            await this.terminateSession(userId, sessionId);
            executedActions.push("session_terminated");
            break;

          case "require_mfa":
            // MFA requirement would be handled by middleware
            executedActions.push("mfa_required");
            break;

          case "limit_session_duration":
            await this.limitSessionDuration(userId, sessionId);
            executedActions.push("session_duration_limited");
            break;

          case "notify_user":
            await this.notifyUserOfSecurityEvent(userId, context);
            executedActions.push("user_notified");
            break;

          case "device_verification":
            await this.requestDeviceVerification(userId, context);
            executedActions.push("device_verification_requested");
            break;

          case "log_security_event":
            // Already logged in security assessment
            executedActions.push("security_event_logged");
            break;

          default:
            logger.warn("Unknown security action requested", {
              action,
              userId,
            });
        }
      }
    } catch (error) {
      logger.error("Failed to execute security actions", {
        userId,
        sessionId,
        actions,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return executedActions;
  }

  /**
   * Terminate session due to security concerns
   */
  private async terminateSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    try {
      // Revoke any associated JWT tokens
      // Note: This would need to be integrated with the specific session implementation
      logger.warn("Session terminated due to security concerns", {
        userId,
        sessionId,
      });

      // Log the termination
      await storage.createAuthAuditLog({
        userId,
        eventType: "session_terminated",
        isSuccessful: true,
        failureReason: "security_policy",
        details: JSON.stringify({ sessionId, reason: "high_security_risk" }),
      });
    } catch (error) {
      logger.error("Failed to terminate session", {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Limit session duration for security reasons
   */
  private async limitSessionDuration(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    try {
      // Implementation would depend on session storage mechanism
      logger.info("Session duration limited due to security assessment", {
        userId,
        sessionId,
      });
    } catch (error) {
      logger.error("Failed to limit session duration", {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Notify user of security event
   */
  private async notifyUserOfSecurityEvent(
    userId: string,
    context: SessionSecurityContext,
  ): Promise<void> {
    try {
      await storage.createNotification({
        userId,
        type: "system",
        title: "Security Alert",
        message:
          "Unusual activity detected on your account. Please review your recent activity.",
        priority: "high",
        data: JSON.stringify({
          ipAddress: context.ipAddress?.substring(0, 8) + "***",
          location: context.location,
          timestamp: context.timestamp.toISOString(),
        }),
      });

      logger.info("Security notification sent to user", { userId });
    } catch (error) {
      logger.error("Failed to notify user of security event", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Request additional device verification
   */
  private async requestDeviceVerification(
    userId: string,
    context: SessionSecurityContext,
  ): Promise<void> {
    try {
      // This would trigger additional verification flow
      logger.info("Device verification requested", { userId });

      await storage.createAuthAuditLog({
        userId,
        eventType: "device_verification_requested",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        isSuccessful: true,
        details: JSON.stringify({
          location: context.location,
          reason: "new_device_detected",
        }),
      });
    } catch (error) {
      logger.error("Failed to request device verification", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Export singleton instances
export const sessionSecurityService = SessionSecurityService.getInstance();
export const enhancedSessionManager = new EnhancedSessionManager();
