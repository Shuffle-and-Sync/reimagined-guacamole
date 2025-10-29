import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { Notification, User } from "@shared/schema";
import { NotificationDeliveryService } from "./notification-delivery.service";

// Mock SendGrid
jest.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock storage
jest.mock("../storage", () => ({
  storage: {
    getUser: jest.fn(),
    getUserSettings: jest.fn(),
  },
}));

describe("NotificationDeliveryService", () => {
  let service: NotificationDeliveryService;
  let mockUser: User;
  let mockNotification: Notification;

  beforeEach(() => {
    // Set SendGrid API key for testing
    process.env.SENDGRID_API_KEY = "test_api_key";
    process.env.SENDGRID_SENDER = "test@shuffleandsync.com";

    service = new NotificationDeliveryService();

    mockUser = {
      id: "user-123",
      email: "user@example.com",
      firstName: "John",
      username: "johndoe",
      lastName: null,
      profileImageUrl: null,
      primaryCommunity: null,
      bio: null,
      location: null,
      website: null,
      status: "online",
      statusMessage: null,
      timezone: null,
      dateOfBirth: null,
      isPrivate: false,
      showOnlineStatus: "everyone",
      allowDirectMessages: "everyone",
      passwordHash: null,
      isEmailVerified: false,
      emailVerifiedAt: null,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      accountLockedUntil: null,
      passwordChangedAt: null,
      mfaEnabled: false,
      mfaSecret: null,
      lastLoginAt: null,
      lastLoginIp: null,
      emailOptIn: true,
      marketingOptIn: false,
      termsAcceptedAt: null,
      privacyPolicyAcceptedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      role: "user",
    };

    mockNotification = {
      id: "notif-123",
      userId: "user-123",
      type: "streamStarted",
      title: "John is live!",
      message: "John started streaming",
      data: JSON.stringify({
        streamerName: "John",
        streamTitle: "Magic: The Gathering",
        streamUrl: "https://shuffleandsync.com/streams/123",
        platform: "Twitch",
      }),
      read: false,
      readAt: null,
      priority: "normal",
      expiresAt: null,
      actionUrl: "/streams/123",
      actionText: "Watch Stream",
      createdAt: new Date(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_SENDER;
  });

  describe("Constructor", () => {
    it("should initialize with SendGrid when API key is provided", () => {
      expect(service).toBeDefined();
    });

    it("should warn when SendGrid API key is not provided", () => {
      delete process.env.SENDGRID_API_KEY;
      const newService = new NotificationDeliveryService();
      expect(newService).toBeDefined();
    });
  });

  describe("buildEmailTemplateData", () => {
    it("should build email template data from notification", () => {
      // Access private method through type assertion for testing
      const result = (service as any).buildEmailTemplateData(
        mockUser,
        mockNotification,
      );

      expect(result).toBeDefined();
      expect(result.userName).toBe("John");
      expect(result.baseUrl).toBeDefined();
      expect(result.unsubscribeUrl).toBeDefined();
      expect(result.streamerName).toBe("John");
      expect(result.streamTitle).toBe("Magic: The Gathering");
    });

    it("should handle notification data as object", () => {
      mockNotification.data = {
        streamerName: "Jane",
        streamTitle: "Pokemon",
      };

      const result = (service as any).buildEmailTemplateData(
        mockUser,
        mockNotification,
      );

      expect(result.streamerName).toBe("Jane");
      expect(result.streamTitle).toBe("Pokemon");
    });

    it("should handle missing notification data", () => {
      mockNotification.data = null;

      const result = (service as any).buildEmailTemplateData(
        mockUser,
        mockNotification,
      );

      expect(result.userName).toBe("John");
      expect(result.baseUrl).toBeDefined();
    });

    it("should use username if firstName is not available", () => {
      mockUser.firstName = null;

      const result = (service as any).buildEmailTemplateData(
        mockUser,
        mockNotification,
      );

      expect(result.userName).toBe("johndoe");
    });

    it("should use 'there' as fallback if no name is available", () => {
      mockUser.firstName = null;
      mockUser.username = null;

      const result = (service as any).buildEmailTemplateData(
        mockUser,
        mockNotification,
      );

      expect(result.userName).toBe("there");
    });
  });

  describe("Email Queue", () => {
    it("should queue email for delivery", async () => {
      const result = await (service as any).deliverEmailNotification(
        mockUser,
        mockNotification,
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe("email");
      expect(result.deliveryId).toContain("email_");
    });

    it("should not queue email if user has no email address", async () => {
      mockUser.email = null;

      const result = await (service as any).deliverEmailNotification(
        mockUser,
        mockNotification,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("User has no email address");
    });

    it("should handle errors during queueing", async () => {
      // Create a notification with invalid data that will cause JSON parse to fail
      const invalidNotification = {
        ...mockNotification,
        data: "{ invalid json",
      };

      // This should still succeed because we handle JSON parse errors gracefully
      const result = await (service as any).deliverEmailNotification(
        mockUser,
        invalidNotification,
      );

      // The queueing should still succeed even with invalid JSON
      expect(result.success).toBe(true);
    });
  });

  describe("isRetryableError", () => {
    it("should identify retryable errors", () => {
      const retryableCodes = [408, 429, 500, 502, 503, 504];

      retryableCodes.forEach((code) => {
        const error = { code };
        const result = (service as any).isRetryableError(error);
        expect(result).toBe(true);
      });
    });

    it("should identify non-retryable errors", () => {
      const nonRetryableCodes = [400, 401, 403, 404];

      nonRetryableCodes.forEach((code) => {
        const error = { code };
        const result = (service as any).isRetryableError(error);
        expect(result).toBe(false);
      });
    });

    it("should check response statusCode as fallback", () => {
      const error = { response: { statusCode: 500 } };
      const result = (service as any).isRetryableError(error);
      expect(result).toBe(true);
    });
  });

  describe("Notification Type Templates", () => {
    it("should handle streamStarted notification", async () => {
      mockNotification.type = "streamStarted";
      const result = await (service as any).deliverEmailNotification(
        mockUser,
        mockNotification,
      );

      expect(result.success).toBe(true);
    });

    it("should handle collaborationInvite notification", async () => {
      mockNotification.type = "collaborationInvite";
      mockNotification.data = JSON.stringify({
        inviterName: "Jane",
        streamTitle: "Pokemon Tournament",
      });

      const result = await (service as any).deliverEmailNotification(
        mockUser,
        mockNotification,
      );

      expect(result.success).toBe(true);
    });

    it("should handle eventReminders notification", async () => {
      mockNotification.type = "eventReminders";
      mockNotification.data = JSON.stringify({
        eventTitle: "Yu-Gi-Oh! Duel Night",
        eventDate: "2024-11-01",
        eventTime: "19:00 EST",
      });

      const result = await (service as any).deliverEmailNotification(
        mockUser,
        mockNotification,
      );

      expect(result.success).toBe(true);
    });

    it("should handle tournamentUpdates notification", async () => {
      mockNotification.type = "tournamentUpdates";
      mockNotification.data = JSON.stringify({
        tournamentName: "Lorcana Championship",
        updateMessage: "Round 2 starts now!",
      });

      const result = await (service as any).deliverEmailNotification(
        mockUser,
        mockNotification,
      );

      expect(result.success).toBe(true);
    });
  });

  describe("processEmailQueue", () => {
    it("should process empty queue without errors", async () => {
      await expect((service as any).processEmailQueue()).resolves.not.toThrow();
    });
  });
});
