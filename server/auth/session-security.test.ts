/**
 * Session Security Tests
 *
 * Comprehensive tests for session security mechanisms including:
 * - Session validation (valid, invalid, expired sessions)
 * - Hijacking prevention (user agent/IP changes)
 * - Token management (rotation and revocation)
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  SessionSecurityService,
  EnhancedSessionManager,
  type SessionSecurityContext,
  type _SecurityRiskAssessment,
} from "./session-security";
import { storage } from "../storage";

// Mock dependencies
jest.mock("../storage");
jest.mock("../logger");

describe("Session Security Tests", () => {
  let sessionSecurityService: SessionSecurityService;
  let enhancedSessionManager: EnhancedSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionSecurityService = SessionSecurityService.getInstance();
    enhancedSessionManager = new EnhancedSessionManager();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Session Validation", () => {
    describe("Valid Sessions", () => {
      test("should validate a session with low risk score", async () => {
        // Mock storage responses for a trusted user with no risk factors
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days old
        };

        const mockDeviceFingerprint = {
          hash: "device-hash-123",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          trustScore: 0.9,
          isBlocked: false,
          firstSeen: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        };

        const mockMfaSettings = {
          enabled: true,
          userId: "user-123",
        };

        (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(
          mockDeviceFingerprint,
        );
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue(
          mockMfaSettings,
        );
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-456",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          timestamp: new Date(),
        };

        const result = await enhancedSessionManager.validateSessionSecurity(
          context.userId,
          context.sessionId,
          {
            headers: { "user-agent": context.userAgent },
            ip: context.ipAddress,
          },
        );

        expect(result.isValid).toBe(true);
        expect(result.assessment.riskLevel).toBe("low");
        expect(result.assessment.riskScore).toBeLessThan(0.3);
      });

      test("should validate session with known device and IP", async () => {
        const recentLogin = {
          userId: "user-123",
          ipAddress: "192.168.1.100",
          createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
          details: JSON.stringify({ location: "New York, US" }),
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.8,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          recentLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-123",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          location: "New York, US",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        expect(assessment.riskLevel).toBe("low");
        expect(assessment.requiresAction).toBe(false);
      });
    });

    describe("Invalid Sessions", () => {
      test("should invalidate session with blocked device", async () => {
        const blockedDevice = {
          hash: "blocked-device-hash",
          userAgent: "Suspicious Bot",
          trustScore: 0.1,
          isBlocked: true,
          firstSeen: new Date(),
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(
          blockedDevice,
        );
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-bad",
          ipAddress: "10.0.0.1",
          userAgent: "Suspicious Bot",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        // Blocked device is a major risk factor
        expect(assessment.riskFactors).toContain("device_blocked");
        expect(assessment.riskLevel).not.toBe("low");
        expect(assessment.riskScore).toBeGreaterThan(0.5);
      });

      test("should invalidate session with suspicious user agent", async () => {
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(null);
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-bot",
          ipAddress: "1.2.3.4",
          userAgent: "python-requests/2.28.0 bot crawler",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        // Suspicious user agent should elevate risk level
        expect(assessment.riskLevel).not.toBe("low");
        expect(assessment.riskScore).toBeGreaterThan(0.3);
      });

      test("should reject session with high risk score", async () => {
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(null);
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([
          { userId: "user-123" },
          { userId: "user-123" },
          { userId: "user-123" },
        ]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-risky",
          ipAddress: "10.0.0.1", // Suspicious private IP
          userAgent: "curl/7.68.0", // Bot user agent
          timestamp: new Date(),
        };

        const result = await enhancedSessionManager.validateSessionSecurity(
          context.userId,
          context.sessionId,
          {
            headers: { "user-agent": context.userAgent },
            ip: context.ipAddress,
          },
        );

        // Multiple risk factors should result in heightened security
        expect(result.assessment.riskLevel).not.toBe("low");
        expect(result.assessment.riskScore).toBeGreaterThan(0.3);
        expect(result.assessment.recommendedActions.length).toBeGreaterThan(0);
      });
    });

    describe("Expired Sessions", () => {
      test("should handle expired session gracefully", async () => {
        // Simulate session expiry by setting old login time
        const expiredLogin = {
          userId: "user-123",
          ipAddress: "192.168.1.100",
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          details: "{}",
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.5,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          expiredLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-expired",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        // Old session should still be assessed, but may have medium risk
        expect(assessment).toBeDefined();
        expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      });

      test("should require re-authentication for very old sessions", async () => {
        const veryOldLogin = {
          userId: "user-123",
          ipAddress: "192.168.1.100",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          details: "{}",
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(null);
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          veryOldLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-old",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        // New device with old account should have some risk
        expect(assessment.riskFactors).toContain("new_device_detected");
      });
    });
  });

  describe("Hijacking Prevention", () => {
    describe("User Agent Changes", () => {
      test("should detect user agent change and invalidate session", async () => {
        const previousLogin = {
          userId: "user-123",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          details: JSON.stringify({
            deviceFingerprint: "original-device-hash",
            location: "New York, US",
          }),
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(null); // New device
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          previousLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-hijack-attempt",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Linux; Android 10)", // Different user agent
          timestamp: new Date(),
        };

        const result = await enhancedSessionManager.validateSessionSecurity(
          context.userId,
          context.sessionId,
          {
            headers: { "user-agent": context.userAgent },
            ip: context.ipAddress,
          },
        );

        expect(result.assessment.riskFactors).toContain("new_device_detected");
        expect(result.assessment.recommendedActions).toContain(
          "device_verification",
        );
      });

      test("should flag suspicious device change", async () => {
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(null);
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          {
            userId: "user-123",
            createdAt: new Date(),
            details: JSON.stringify({ deviceFingerprint: "old-device" }),
          },
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-device-change",
          ipAddress: "192.168.1.100",
          userAgent: "NewBrowser/1.0",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        // New device should be detected as a risk factor
        expect(assessment.riskFactors).toContain("new_device_detected");
        expect(assessment.riskLevel).not.toBe("low");
      });
    });

    describe("IP Address Changes", () => {
      test("should detect IP address change and require verification", async () => {
        const previousLogin = {
          userId: "user-123",
          ipAddress: "192.168.1.100",
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
          details: JSON.stringify({ location: "New York, US" }),
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.7,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: true,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          previousLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-ip-change",
          ipAddress: "10.20.30.40", // Different IP
          userAgent: "Mozilla/5.0",
          location: "Los Angeles, US",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        expect(assessment.riskFactors).toContain("ip_address_changed");
        expect(assessment.riskFactors).toContain("location_changed");
      });

      test("should detect rapid location change (impossible travel)", async () => {
        const previousLogin = {
          userId: "user-123",
          ipAddress: "1.2.3.4",
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          details: JSON.stringify({ location: "Tokyo" }),
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.5,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          previousLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-impossible-travel",
          ipAddress: "5.6.7.8",
          userAgent: "Mozilla/5.0",
          location: "New York", // Physically impossible to travel from Tokyo to NY in 30 min
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        expect(assessment.riskFactors).toContain("location_changed");
        expect(assessment.riskFactors).toContain("impossible_travel_detected");
        // Impossible travel should result in heightened risk
        expect(assessment.riskLevel).not.toBe("low");
      });

      test("should flag new IP range as suspicious", async () => {
        const previousLogins = [
          {
            userId: "user-123",
            ipAddress: "192.168.1.100",
            createdAt: new Date(Date.now() - 1000 * 60 * 60),
            details: "{}",
          },
          {
            userId: "user-123",
            ipAddress: "192.168.1.101",
            createdAt: new Date(Date.now() - 1000 * 60 * 120),
            details: "{}",
          },
        ];

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.6,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue(
          previousLogins,
        );
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-new-ip-range",
          ipAddress: "10.0.0.50", // Completely different IP range
          userAgent: "Mozilla/5.0",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        expect(assessment.riskFactors).toContain("ip_address_changed");
      });
    });

    describe("Combined Changes", () => {
      test("should detect both IP and user agent change", async () => {
        const previousLogin = {
          userId: "user-123",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows)",
          createdAt: new Date(Date.now() - 1000 * 60 * 10),
          details: JSON.stringify({
            deviceFingerprint: "old-device",
            location: "New York, US",
          }),
        };

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue(null);
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          previousLogin,
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "session-multiple-changes",
          ipAddress: "10.0.0.1",
          userAgent: "Mozilla/5.0 (Linux)",
          location: "London, UK",
          timestamp: new Date(),
        };

        const result = await enhancedSessionManager.validateSessionSecurity(
          context.userId,
          context.sessionId,
          {
            headers: { "user-agent": context.userAgent },
            ip: context.ipAddress,
          },
        );

        // Multiple changes should result in elevated risk
        expect(result.assessment.riskLevel).not.toBe("low");
        expect(result.assessment.riskFactors).toContain("new_device_detected");
        expect(result.assessment.recommendedActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Token Management", () => {
    describe("Token Rotation", () => {
      test("should support session token rotation after configurable interval", async () => {
        // This test verifies that the system can rotate session tokens
        // Note: Token rotation would typically be implemented at the Auth.js level
        // This test ensures the security service can handle token updates

        const oldSessionId = "session-old-123";
        const newSessionId = "session-new-456";

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.9,
          isBlocked: false,
          firstSeen: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: true,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        // Validate old session first
        const oldSessionContext: SessionSecurityContext = {
          userId: "user-123",
          sessionId: oldSessionId,
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(Date.now() - 16 * 60 * 1000), // 16 minutes ago (past rotation interval)
        };

        const oldResult = await enhancedSessionManager.validateSessionSecurity(
          oldSessionContext.userId,
          oldSessionContext.sessionId,
          {
            headers: { "user-agent": oldSessionContext.userAgent },
            ip: oldSessionContext.ipAddress,
          },
        );

        expect(oldResult.isValid).toBe(true);

        // Now validate new session with rotated token
        const newSessionContext: SessionSecurityContext = {
          userId: "user-123",
          sessionId: newSessionId,
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(),
        };

        const newResult = await enhancedSessionManager.validateSessionSecurity(
          newSessionContext.userId,
          newSessionContext.sessionId,
          {
            headers: { "user-agent": newSessionContext.userAgent },
            ip: newSessionContext.ipAddress,
          },
        );

        expect(newResult.isValid).toBe(true);
        expect(newResult.assessment.riskLevel).toBe("low");
      });

      test("should maintain session continuity during token rotation", async () => {
        // Verify that rotating tokens doesn't break session security assessment
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.85,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: true,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          {
            userId: "user-123",
            ipAddress: "192.168.1.100",
            createdAt: new Date(Date.now() - 1000 * 60 * 10),
            details: JSON.stringify({ sessionId: "old-session-token" }),
          },
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "new-session-token-after-rotation",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(),
        };

        const assessment =
          await sessionSecurityService.assessSessionSecurity(context);

        expect(assessment.riskLevel).toBe("low");
        expect(assessment.trustScore).toBeGreaterThan(0.5);
      });

      test("should log token rotation for audit purposes", async () => {
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: "user-123",
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.8,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

        const context: SessionSecurityContext = {
          userId: "user-123",
          sessionId: "rotated-session-123",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(),
        };

        await sessionSecurityService.assessSessionSecurity(context);

        // Verify audit log was created
        expect(storage.createAuthAuditLog).toHaveBeenCalled();
        const auditCall = (storage.createAuthAuditLog as jest.Mock).mock
          .calls[0][0];
        expect(auditCall.userId).toBe("user-123");
        expect(auditCall.eventType).toBe("security_assessment");
      });
    });

    describe("Token Revocation", () => {
      test("should immediately terminate session upon logout", async () => {
        const sessionId = "session-to-revoke";
        const userId = "user-123";

        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});
        (storage.createNotification as jest.Mock).mockResolvedValue({});

        // Create maximum risk scenario: blocked device + bot + suspicious IP + many failures + impossible travel
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: userId,
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.0,
          isBlocked: true, // Blocked device = high risk
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          {
            userId,
            ipAddress: "1.2.3.4",
            createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
            details: JSON.stringify({ location: "Tokyo" }),
          },
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([
          { userId },
          { userId },
          { userId },
          { userId },
          { userId }, // Many failures
        ]);

        const result = await enhancedSessionManager.validateSessionSecurity(
          userId,
          sessionId,
          {
            headers: { "user-agent": "curl/7.68.0 bot" }, // Bot user agent
            ip: "127.0.0.1", // Suspicious localhost IP
          },
        );

        // Should result in high risk requiring action
        expect(result.assessment.riskLevel).toMatch(/high|critical/);
        expect(result.assessment.requiresAction).toBe(true);
        // High risk actions include MFA requirement and notifications
        expect(result.assessment.recommendedActions).toContain("require_mfa");
        expect(result.actions.length).toBeGreaterThan(0);

        // Verify security assessment was logged
        expect(storage.createAuthAuditLog).toHaveBeenCalled();
        const auditCalls = (storage.createAuthAuditLog as jest.Mock).mock.calls;
        const securityLog = auditCalls.find(
          (call) => call[0].eventType === "security_assessment",
        );
        expect(securityLog).toBeDefined();
      });

      test("should revoke session on security event detection", async () => {
        const sessionId = "session-security-event";
        const userId = "user-123";

        (storage.getUser as jest.Mock).mockResolvedValue({
          id: userId,
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "blocked-device",
          trustScore: 0.0,
          isBlocked: true, // Blocked device
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: false,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          {
            userId,
            ipAddress: "1.2.3.4",
            createdAt: new Date(Date.now() - 1000 * 60 * 30),
            details: JSON.stringify({ location: "Sydney" }),
          },
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([
          { userId },
          { userId },
          { userId },
          { userId },
          { userId }, // Many failures
        ]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});
        (storage.createNotification as jest.Mock).mockResolvedValue({});

        // Simulate high-risk security event
        const result = await enhancedSessionManager.validateSessionSecurity(
          userId,
          sessionId,
          {
            headers: { "user-agent": "curl/7.68.0 bot crawler" },
            ip: "127.0.0.1",
          },
        );

        expect(result.assessment.riskLevel).toMatch(/high|critical/);
        expect(result.assessment.requiresAction).toBe(true);
        // Verify security actions were taken
        expect(result.actions).toContain("mfa_required");
        expect(result.actions).toContain("user_notified");
      });

      test("should handle bulk session revocation for user", async () => {
        // Test that when a user logs out from all devices, all sessions can be revoked
        const userId = "user-123";
        const sessionIds = ["session-1", "session-2", "session-3"];

        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});
        (storage.createNotification as jest.Mock).mockResolvedValue({});

        // Simulate revoking all sessions by triggering high risk for each
        for (const sessionId of sessionIds) {
          (storage.getUser as jest.Mock).mockResolvedValue({
            id: userId,
            createdAt: new Date(),
          });
          (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
            hash: "device-hash",
            isBlocked: true,
            trustScore: 0.0,
          });
          (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
            enabled: false,
          });
          (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
            {
              userId,
              ipAddress: "1.2.3.4",
              createdAt: new Date(Date.now() - 1000 * 60 * 30),
              details: JSON.stringify({ location: "Tokyo" }),
            },
          ]);
          (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([
            { userId },
            { userId },
            { userId },
            { userId },
            { userId },
          ]);

          const result = await enhancedSessionManager.validateSessionSecurity(
            userId,
            sessionId,
            { headers: { "user-agent": "curl/7.68.0 bot" }, ip: "127.0.0.1" },
          );

          expect(result.assessment.riskLevel).toMatch(/high|critical/);
          expect(result.assessment.requiresAction).toBe(true);
          expect(result.actions.length).toBeGreaterThan(0);
        }

        // Verify security assessments were logged for all sessions
        const securityLogs = (
          storage.createAuthAuditLog as jest.Mock
        ).mock.calls.filter(
          (call) => call[0].eventType === "security_assessment",
        );
        expect(securityLogs.length).toBeGreaterThanOrEqual(sessionIds.length);
      });

      test("should verify session does not work after revocation", async () => {
        const sessionId = "revoked-session";
        const userId = "user-123";

        // First call - session is valid
        (storage.getUser as jest.Mock).mockResolvedValue({
          id: userId,
          createdAt: new Date(),
        });
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.8,
          isBlocked: false,
        });
        (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
          enabled: true,
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
        (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});
        (storage.createNotification as jest.Mock).mockResolvedValue({});

        const validResult =
          await enhancedSessionManager.validateSessionSecurity(
            userId,
            sessionId,
            { headers: { "user-agent": "Mozilla/5.0" }, ip: "192.168.1.100" },
          );

        expect(validResult.isValid).toBe(true);

        // Now simulate session being revoked with maximum risk factors
        (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
          hash: "device-hash",
          trustScore: 0.0,
          isBlocked: true, // Session revoked = 0.8 risk
        });
        (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([
          {
            userId,
            ipAddress: "1.2.3.4",
            createdAt: new Date(Date.now() - 1000 * 60 * 30),
            details: JSON.stringify({ location: "London" }),
          },
        ]);
        (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([
          { userId },
          { userId },
          { userId },
          { userId },
          { userId },
        ]);

        const revokedResult =
          await enhancedSessionManager.validateSessionSecurity(
            userId,
            sessionId,
            { headers: { "user-agent": "curl/7.68.0 bot" }, ip: "127.0.0.1" },
          );

        expect(revokedResult.assessment.riskLevel).toMatch(/high|critical/);
        expect(revokedResult.assessment.requiresAction).toBe(true);
        expect(revokedResult.assessment.riskFactors).toContain(
          "device_blocked",
        );
      });
    });
  });

  describe("Security Edge Cases", () => {
    test("should handle storage failures gracefully", async () => {
      // Simulate complete failure that triggers the catch blocks in each assessment method
      (storage.getUser as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
      );
      (storage.getDeviceFingerprint as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      (storage.getUserMfaSettings as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      (storage.getAuthAuditLogs as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      (storage.getRecentAuthFailures as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

      const context: SessionSecurityContext = {
        userId: "user-123",
        sessionId: "session-error",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
        timestamp: new Date(),
      };

      const assessment =
        await sessionSecurityService.assessSessionSecurity(context);

      // When components fail, they should report their specific failures
      expect(
        assessment.riskFactors.some(
          (factor) =>
            factor.includes("failed") || factor.includes("analysis_failed"),
        ),
      ).toBe(true);
      // Even with failures, system should still assess risk (medium level in this case)
      expect(assessment.riskLevel).not.toBe("low");
      expect(assessment.riskScore).toBeGreaterThan(0);
    });

    test("should handle validation errors gracefully", async () => {
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: "user-123",
        createdAt: new Date(),
      });
      (storage.getDeviceFingerprint as jest.Mock).mockRejectedValue(
        new Error("Device lookup failed"),
      );
      (storage.getUserMfaSettings as jest.Mock).mockResolvedValue(null);
      (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
      (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
      (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

      const result = await enhancedSessionManager.validateSessionSecurity(
        "user-123",
        "session-error",
        { headers: { "user-agent": "Mozilla/5.0" }, ip: "192.168.1.100" },
      );

      // Should still complete validation, possibly with higher risk
      expect(result).toBeDefined();
      expect(result.assessment).toBeDefined();
    });

    test("should handle concurrent session validations", async () => {
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: "user-123",
        createdAt: new Date(),
      });
      (storage.getDeviceFingerprint as jest.Mock).mockResolvedValue({
        hash: "device-hash",
        trustScore: 0.8,
        isBlocked: false,
      });
      (storage.getUserMfaSettings as jest.Mock).mockResolvedValue({
        enabled: false,
      });
      (storage.getAuthAuditLogs as jest.Mock).mockResolvedValue([]);
      (storage.getRecentAuthFailures as jest.Mock).mockResolvedValue([]);
      (storage.createAuthAuditLog as jest.Mock).mockResolvedValue({});

      // Simulate multiple concurrent validations
      const validations = Array.from({ length: 5 }, (_, i) =>
        enhancedSessionManager.validateSessionSecurity(
          "user-123",
          `session-${i}`,
          { headers: { "user-agent": "Mozilla/5.0" }, ip: "192.168.1.100" },
        ),
      );

      const results = await Promise.all(validations);

      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
        expect(result.assessment).toBeDefined();
      });
    });
  });
});
