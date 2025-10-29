/**
 * Streaming Coordinator Service Tests
 * Tests OAuth integration for platform streaming coordination
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { storage } from "../storage";
import { StreamingCoordinator } from "./streaming-coordinator.service";

// Mock storage module
jest.mock("../storage", () => ({
  storage: {
    getUser: jest.fn(),
    getUserPlatformAccounts: jest.fn(),
    getUserPlatformToken: jest.fn(),
  },
}));

describe("StreamingCoordinator OAuth Integration", () => {
  let coordinator: StreamingCoordinator;
  const mockUserId = "test-user-123";

  beforeEach(() => {
    coordinator = new StreamingCoordinator();
    jest.clearAllMocks();
  });

  afterEach(() => {
    coordinator.stopStreamMonitoring();
  });

  describe("getUserPlatforms", () => {
    it("should return empty array when user not found", async () => {
      (storage.getUser as jest.Mock).mockResolvedValue(null);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      expect(platforms).toEqual([]);
    });

    it("should return all platforms with disconnected status when no accounts exist", async () => {
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      expect(platforms).toHaveLength(3);
      expect(platforms[0].id).toBe("twitch");
      expect(platforms[0].isConnected).toBe(false);
      expect(platforms[1].id).toBe("youtube");
      expect(platforms[1].isConnected).toBe(false);
      expect(platforms[2].id).toBe("facebook");
      expect(platforms[2].isConnected).toBe(false);
    });

    it("should return connected status for active Twitch account with valid token", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([
        {
          id: "account-1",
          userId: mockUserId,
          platform: "twitch",
          handle: "test_streamer",
          platformUserId: "twitch-123",
          isActive: true,
          tokenExpiresAt: futureDate,
          lastVerified: new Date(),
        },
      ]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      const twitchPlatform = platforms.find((p) => p.id === "twitch");
      expect(twitchPlatform?.isConnected).toBe(true);
      expect(twitchPlatform?.username).toBe("test_streamer");
      expect(twitchPlatform?.profileUrl).toBe(
        "https://twitch.tv/test_streamer",
      );
    });

    it("should return disconnected status for active account with expired token", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([
        {
          id: "account-1",
          userId: mockUserId,
          platform: "twitch",
          handle: "test_streamer",
          platformUserId: "twitch-123",
          isActive: true,
          tokenExpiresAt: pastDate,
          lastVerified: new Date(),
        },
      ]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      const twitchPlatform = platforms.find((p) => p.id === "twitch");
      expect(twitchPlatform?.isConnected).toBe(false);
    });

    it("should return connected status for YouTube account with channel ID", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([
        {
          id: "account-2",
          userId: mockUserId,
          platform: "youtube",
          handle: "Test Channel",
          channelId: "UC123456789",
          isActive: true,
          tokenExpiresAt: futureDate,
          lastVerified: new Date(),
        },
      ]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      const youtubePlatform = platforms.find((p) => p.id === "youtube");
      expect(youtubePlatform?.isConnected).toBe(true);
      expect(youtubePlatform?.username).toBe("Test Channel");
      expect(youtubePlatform?.profileUrl).toBe(
        "https://youtube.com/channel/UC123456789",
      );
    });

    it("should return connected status for Facebook account", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([
        {
          id: "account-3",
          userId: mockUserId,
          platform: "facebook",
          handle: "Test Page",
          platformUserId: "fb-123",
          pageId: "page-456",
          isActive: true,
          tokenExpiresAt: futureDate,
          lastVerified: new Date(),
        },
      ]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      const facebookPlatform = platforms.find((p) => p.id === "facebook");
      expect(facebookPlatform?.isConnected).toBe(true);
      expect(facebookPlatform?.username).toBe("Test Page");
      expect(facebookPlatform?.profileUrl).toBe("https://facebook.com/fb-123");
    });

    it("should handle multiple connected platforms", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([
        {
          id: "account-1",
          userId: mockUserId,
          platform: "twitch",
          handle: "test_streamer",
          platformUserId: "twitch-123",
          isActive: true,
          tokenExpiresAt: futureDate,
          lastVerified: new Date(),
        },
        {
          id: "account-2",
          userId: mockUserId,
          platform: "youtube",
          handle: "Test Channel",
          channelId: "UC123456789",
          isActive: true,
          tokenExpiresAt: futureDate,
          lastVerified: new Date(),
        },
      ]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      const twitchPlatform = platforms.find((p) => p.id === "twitch");
      const youtubePlatform = platforms.find((p) => p.id === "youtube");
      const facebookPlatform = platforms.find((p) => p.id === "facebook");

      expect(twitchPlatform?.isConnected).toBe(true);
      expect(youtubePlatform?.isConnected).toBe(true);
      expect(facebookPlatform?.isConnected).toBe(false);
    });

    it("should handle inactive accounts as disconnected", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([
        {
          id: "account-1",
          userId: mockUserId,
          platform: "twitch",
          handle: "test_streamer",
          platformUserId: "twitch-123",
          isActive: false, // Account inactive
          tokenExpiresAt: futureDate,
          lastVerified: new Date(),
        },
      ]);

      const platforms = await coordinator.getUserPlatforms(mockUserId);

      const twitchPlatform = platforms.find((p) => p.id === "twitch");
      expect(twitchPlatform?.isConnected).toBe(false);
    });
  });

  describe("isUserStreaming", () => {
    it("should return not streaming when user not found", async () => {
      (storage.getUser as jest.Mock).mockResolvedValue(null);

      const result = await coordinator.isUserStreaming(mockUserId);

      expect(result.isStreaming).toBe(false);
    });

    it("should return not streaming when no platform accounts exist", async () => {
      (storage.getUser as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: "test@example.com",
      });
      (storage.getUserPlatformAccounts as jest.Mock).mockResolvedValue([]);

      const result = await coordinator.isUserStreaming(mockUserId);

      expect(result.isStreaming).toBe(false);
    });
  });
});
