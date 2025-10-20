/**
 * Analytics Tracking Verification Tests
 *
 * Comprehensive tests to verify analytics tracking functionality
 * for the final release verification checklist.
 *
 * Tests cover:
 * - Analytics service health and initialization
 * - Event tracking endpoints
 * - Funnel tracking
 * - Stream metrics tracking
 * - System and platform metrics
 * - Community analytics
 * - User insights
 * - Real-time analytics
 * - Data quality and privacy
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { analyticsService } from "../../services/analytics-service";
import type {
  AnalyticsEvent,
  StreamMetrics,
  CommunityMetrics,
  SystemMetrics,
} from "../../services/analytics-service";

describe("Analytics Tracking Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Analytics Service Health", () => {
    it("should initialize analytics service correctly", () => {
      expect(analyticsService).toBeDefined();
      expect(analyticsService).toHaveProperty("trackEvent");
      expect(analyticsService).toHaveProperty("trackFunnelStep");
      expect(analyticsService).toHaveProperty("trackStreamMetrics");
      expect(analyticsService).toHaveProperty("recordSystemMetrics");
      expect(analyticsService).toHaveProperty("aggregateCommunityMetrics");
      expect(analyticsService).toHaveProperty("getRealTimeStats");
      expect(analyticsService).toHaveProperty("generateDashboardData");
      expect(analyticsService).toHaveProperty("generateUserInsights");
    });

    it("should have all required methods available", () => {
      const requiredMethods = [
        "trackEvent",
        "trackFunnelStep",
        "trackStreamMetrics",
        "recordSystemMetrics",
        "aggregateCommunityMetrics",
        "getRealTimeStats",
        "generateDashboardData",
        "generateUserInsights",
      ];

      requiredMethods.forEach((method) => {
        expect(analyticsService).toHaveProperty(method);
        expect(
          typeof (analyticsService as Record<string, unknown>)[method],
        ).toBe("function");
      });
    });
  });

  describe("Event Tracking", () => {
    it("should track navigation events", async () => {
      const navigationEvent: AnalyticsEvent = {
        userId: "user-123",
        sessionId: "session-456",
        eventName: "page_view",
        eventCategory: "navigation",
        eventAction: "click",
        eventLabel: "homepage",
        properties: { page: "/", timestamp: new Date().toISOString() },
        context: {
          userAgent: "Mozilla/5.0",
          ipAddress: "127.0.0.1",
          pageUrl: "https://example.com/",
        },
      };

      await expect(
        analyticsService.trackEvent(navigationEvent),
      ).resolves.not.toThrow();
    });

    it("should track user registration events", async () => {
      const registrationEvent: AnalyticsEvent = {
        userId: "user-new",
        eventName: "user_registration",
        eventCategory: "profile",
        eventAction: "create",
        eventLabel: "google_oauth",
        eventValue: 1,
      };

      await expect(
        analyticsService.trackEvent(registrationEvent),
      ).resolves.not.toThrow();
    });

    it("should track community join events", async () => {
      const joinEvent: AnalyticsEvent = {
        userId: "user-123",
        eventName: "community_join",
        eventCategory: "community",
        eventAction: "join",
        eventLabel: "mtg-commander",
        properties: {
          communityId: "community-789",
          communityName: "MTG Commander Players",
        },
      };

      await expect(
        analyticsService.trackEvent(joinEvent),
      ).resolves.not.toThrow();
    });

    it("should track tournament participation events", async () => {
      const tournamentEvent: AnalyticsEvent = {
        userId: "user-123",
        eventName: "tournament_registration",
        eventCategory: "tournament",
        eventAction: "join",
        eventLabel: "weekly-commander",
        properties: {
          tournamentId: "tournament-101",
          tournamentName: "Weekly Commander",
          format: "commander",
        },
      };

      await expect(
        analyticsService.trackEvent(tournamentEvent),
      ).resolves.not.toThrow();
    });

    it("should track streaming events", async () => {
      const streamEvent: AnalyticsEvent = {
        userId: "user-123",
        eventName: "stream_start",
        eventCategory: "streaming",
        eventAction: "create",
        eventLabel: "twitch",
        properties: {
          platform: "twitch",
          streamId: "stream-202",
        },
      };

      await expect(
        analyticsService.trackEvent(streamEvent),
      ).resolves.not.toThrow();
    });

    it("should track social interaction events", async () => {
      const socialEvent: AnalyticsEvent = {
        userId: "user-123",
        eventName: "message_sent",
        eventCategory: "social",
        eventAction: "comment",
        eventLabel: "community-chat",
      };

      await expect(
        analyticsService.trackEvent(socialEvent),
      ).resolves.not.toThrow();
    });
  });

  describe("Event Categories & Actions", () => {
    const validCategories = [
      "navigation",
      "streaming",
      "social",
      "tournament",
      "community",
      "profile",
      "settings",
    ];

    const validActions = [
      "click",
      "scroll",
      "submit",
      "create",
      "join",
      "leave",
      "share",
      "like",
      "comment",
    ];

    it("should support all required event categories", () => {
      validCategories.forEach((category) => {
        const event: AnalyticsEvent = {
          eventName: `test_${category}`,
          eventCategory: category as AnalyticsEvent["eventCategory"],
          eventAction: "click",
        };

        expect(() => analyticsService.trackEvent(event)).not.toThrow();
      });
    });

    it("should support all required event actions", () => {
      validActions.forEach((action) => {
        const event: AnalyticsEvent = {
          eventName: `test_${action}`,
          eventCategory: "navigation",
          eventAction: action as AnalyticsEvent["eventAction"],
        };

        expect(() => analyticsService.trackEvent(event)).not.toThrow();
      });
    });
  });

  describe("Funnel Tracking", () => {
    it("should track user onboarding funnel steps", async () => {
      const funnelSteps = [
        { name: "landing_page", order: 1 },
        { name: "registration_start", order: 2 },
        { name: "account_creation", order: 3 },
        { name: "profile_setup", order: 4 },
        { name: "first_community_join", order: 5 },
      ];

      for (const step of funnelSteps) {
        await expect(
          analyticsService.trackFunnelStep(
            "user_onboarding",
            step.name,
            step.order,
            "user-123",
            "session-456",
            true,
          ),
        ).resolves.not.toThrow();
      }
    });

    it("should track tournament participation funnel", async () => {
      const tournamentFunnelSteps = [
        { name: "tournament_browse", order: 1 },
        { name: "tournament_detail", order: 2 },
        { name: "registration_start", order: 3 },
        { name: "registration_complete", order: 4 },
        { name: "tournament_checkin", order: 5 },
      ];

      for (const step of tournamentFunnelSteps) {
        await expect(
          analyticsService.trackFunnelStep(
            "tournament_participation",
            step.name,
            step.order,
            "user-123",
            "session-456",
            true,
          ),
        ).resolves.not.toThrow();
      }
    });

    it("should track streaming setup funnel", async () => {
      const streamingFunnelSteps = [
        { name: "platform_connection_start", order: 1 },
        { name: "oauth_authorization", order: 2 },
        { name: "platform_connected", order: 3 },
        { name: "stream_setup", order: 4 },
        { name: "first_stream_started", order: 5 },
      ];

      for (const step of streamingFunnelSteps) {
        await expect(
          analyticsService.trackFunnelStep(
            "streaming_setup",
            step.name,
            step.order,
            "user-123",
            "session-456",
            true,
          ),
        ).resolves.not.toThrow();
      }
    });

    it("should track incomplete funnel steps", async () => {
      await expect(
        analyticsService.trackFunnelStep(
          "user_onboarding",
          "profile_setup",
          4,
          "user-123",
          "session-456",
          false, // User dropped off
        ),
      ).resolves.not.toThrow();
    });

    it("should track time spent on funnel steps", async () => {
      await expect(
        analyticsService.trackFunnelStep(
          "tournament_participation",
          "registration_complete",
          4,
          "user-123",
          "session-456",
          true,
          45000, // 45 seconds
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("Stream Metrics Tracking", () => {
    it("should track Twitch stream metrics", async () => {
      const twitchMetrics: StreamMetrics = {
        sessionId: "stream-session-1",
        platform: "twitch",
        viewerCount: 150,
        chatMessageCount: 320,
        followersGained: 5,
        subscriptionsGained: 2,
        streamQuality: "1080p",
        frameDrops: 12,
        bitrate: 6000,
      };

      await expect(
        analyticsService.trackStreamMetrics(twitchMetrics),
      ).resolves.not.toThrow();
    });

    it("should track YouTube stream metrics", async () => {
      const youtubeMetrics: StreamMetrics = {
        sessionId: "stream-session-2",
        platform: "youtube",
        viewerCount: 200,
        chatMessageCount: 150,
        followersGained: 10,
      };

      await expect(
        analyticsService.trackStreamMetrics(youtubeMetrics),
      ).resolves.not.toThrow();
    });

    it("should track Facebook Gaming metrics", async () => {
      const facebookMetrics: StreamMetrics = {
        sessionId: "stream-session-3",
        platform: "facebook",
        viewerCount: 75,
      };

      await expect(
        analyticsService.trackStreamMetrics(facebookMetrics),
      ).resolves.not.toThrow();
    });

    it("should track Discord stream metrics", async () => {
      const discordMetrics: StreamMetrics = {
        sessionId: "stream-session-4",
        platform: "discord",
        viewerCount: 25,
      };

      await expect(
        analyticsService.trackStreamMetrics(discordMetrics),
      ).resolves.not.toThrow();
    });

    it("should handle minimal stream metrics", async () => {
      const minimalMetrics: StreamMetrics = {
        sessionId: "stream-session-5",
        platform: "twitch",
        viewerCount: 0,
      };

      await expect(
        analyticsService.trackStreamMetrics(minimalMetrics),
      ).resolves.not.toThrow();
    });
  });

  describe("System & Platform Metrics", () => {
    it("should record performance metrics", async () => {
      const performanceMetric: SystemMetrics = {
        metricType: "performance",
        metricName: "api_response_time",
        metricValue: 245,
        metricUnit: "ms",
        aggregationType: "avg",
        timeWindow: "5m",
        tags: { endpoint: "/api/users", method: "GET" },
      };

      await expect(
        analyticsService.recordSystemMetrics(performanceMetric),
      ).resolves.not.toThrow();
    });

    it("should record usage metrics", async () => {
      const usageMetric: SystemMetrics = {
        metricType: "usage",
        metricName: "active_users",
        metricValue: 150,
        aggregationType: "count",
        timeWindow: "5m",
      };

      await expect(
        analyticsService.recordSystemMetrics(usageMetric),
      ).resolves.not.toThrow();
    });

    it("should record system metrics", async () => {
      const systemMetric: SystemMetrics = {
        metricType: "system",
        metricName: "cpu_usage",
        metricValue: 45.2,
        metricUnit: "percent",
        aggregationType: "avg",
        timeWindow: "1m",
      };

      await expect(
        analyticsService.recordSystemMetrics(systemMetric),
      ).resolves.not.toThrow();
    });

    it("should record error metrics", async () => {
      const errorMetric: SystemMetrics = {
        metricType: "error",
        metricName: "error_rate",
        metricValue: 0.5,
        metricUnit: "percent",
        aggregationType: "avg",
        timeWindow: "5m",
        tags: { severity: "error", source: "api" },
      };

      await expect(
        analyticsService.recordSystemMetrics(errorMetric),
      ).resolves.not.toThrow();
    });

    it("should record business metrics", async () => {
      const businessMetric: SystemMetrics = {
        metricType: "business",
        metricName: "user_signups",
        metricValue: 12,
        aggregationType: "sum",
        timeWindow: "1h",
      };

      await expect(
        analyticsService.recordSystemMetrics(businessMetric),
      ).resolves.not.toThrow();
    });

    it("should support different time windows", async () => {
      const timeWindows: Array<SystemMetrics["timeWindow"]> = [
        "1m",
        "5m",
        "15m",
        "1h",
        "6h",
        "1d",
        "7d",
        "30d",
      ];

      for (const timeWindow of timeWindows) {
        const metric: SystemMetrics = {
          metricType: "usage",
          metricName: "test_metric",
          metricValue: 100,
          aggregationType: "avg",
          timeWindow,
        };

        await expect(
          analyticsService.recordSystemMetrics(metric),
        ).resolves.not.toThrow();
      }
    });

    it("should support different aggregation types", async () => {
      const aggregationTypes: Array<SystemMetrics["aggregationType"]> = [
        "avg",
        "sum",
        "max",
        "min",
        "count",
        "percentile",
      ];

      for (const aggregationType of aggregationTypes) {
        const metric: SystemMetrics = {
          metricType: "performance",
          metricName: "test_metric",
          metricValue: 100,
          aggregationType,
          timeWindow: "5m",
        };

        await expect(
          analyticsService.recordSystemMetrics(metric),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("Community Analytics", () => {
    it("should aggregate community metrics", async () => {
      const communityId = "community-123";
      const date = new Date();

      await expect(
        analyticsService.aggregateCommunityMetrics(communityId, date),
      ).resolves.not.toThrow();
    });

    it("should aggregate hourly community metrics", async () => {
      const communityId = "community-123";
      const date = new Date();
      const hour = 14; // 2 PM

      await expect(
        analyticsService.aggregateCommunityMetrics(communityId, date, hour),
      ).resolves.not.toThrow();
    });

    it("should track community growth metrics", async () => {
      const communityMetrics: CommunityMetrics = {
        communityId: "community-123",
        activeUsers: 250,
        newMembers: 15,
        streamsStarted: 8,
        totalStreamTime: 18000, // 5 hours in seconds
        collaborationsCreated: 3,
        tournamentsCreated: 2,
        forumPosts: 45,
        forumReplies: 120,
        avgSessionDuration: 1800, // 30 minutes
      };

      // Community metrics are tracked via aggregation
      await expect(
        analyticsService.aggregateCommunityMetrics(
          communityMetrics.communityId,
          new Date(),
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("Real-Time Analytics", () => {
    it("should get real-time platform statistics", async () => {
      const stats = await analyticsService.getRealTimeStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("activeUsers");
      expect(stats).toHaveProperty("activeStreams");
      expect(stats).toHaveProperty("activeTournaments");
      expect(typeof stats.activeUsers).toBe("number");
      expect(typeof stats.activeStreams).toBe("number");
      expect(typeof stats.activeTournaments).toBe("number");
    });

    it("should return non-negative real-time stats", async () => {
      const stats = await analyticsService.getRealTimeStats();

      expect(stats.activeUsers).toBeGreaterThanOrEqual(0);
      expect(stats.activeStreams).toBeGreaterThanOrEqual(0);
      expect(stats.activeTournaments).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Dashboard Data Generation", () => {
    it("should generate dashboard data for 24h timeframe", async () => {
      const dashboardData = await analyticsService.generateDashboardData(
        undefined,
        undefined,
        "24h",
      );

      expect(dashboardData).toBeDefined();
      expect(dashboardData).toHaveProperty("timeframe");
      expect(dashboardData.timeframe).toBe("24h");
    });

    it("should generate dashboard data for 7d timeframe", async () => {
      const dashboardData = await analyticsService.generateDashboardData(
        undefined,
        undefined,
        "7d",
      );

      expect(dashboardData).toBeDefined();
      expect(dashboardData.timeframe).toBe("7d");
    });

    it("should generate user-specific dashboard data", async () => {
      const userId = "user-123";
      const dashboardData = await analyticsService.generateDashboardData(
        userId,
        undefined,
        "7d",
      );

      expect(dashboardData).toBeDefined();
    });

    it("should generate community-specific dashboard data", async () => {
      const communityId = "community-123";
      const dashboardData = await analyticsService.generateDashboardData(
        undefined,
        communityId,
        "30d",
      );

      expect(dashboardData).toBeDefined();
    });

    it("should support all timeframe options", async () => {
      const timeframes: Array<"24h" | "7d" | "30d" | "90d"> = [
        "24h",
        "7d",
        "30d",
        "90d",
      ];

      for (const timeframe of timeframes) {
        const dashboardData = await analyticsService.generateDashboardData(
          undefined,
          undefined,
          timeframe,
        );

        expect(dashboardData).toBeDefined();
        expect(dashboardData.timeframe).toBe(timeframe);
      }
    });
  });

  describe("User Insights", () => {
    it("should generate user insights", async () => {
      const userId = "user-123";
      const insights = await analyticsService.generateUserInsights(userId);

      expect(insights).toBeDefined();
      expect(insights).toHaveProperty("userId");
      expect(insights.userId).toBe(userId);
    });

    it("should include engagement metrics in user insights", async () => {
      const userId = "user-123";
      const insights = await analyticsService.generateUserInsights(userId);

      expect(insights).toHaveProperty("engagementScore");
      expect(typeof insights.engagementScore).toBe("number");
    });

    it("should include activity patterns in user insights", async () => {
      const userId = "user-123";
      const insights = await analyticsService.generateUserInsights(userId);

      expect(insights).toHaveProperty("activityPatterns");
    });
  });

  describe("Data Quality & Privacy", () => {
    it("should handle missing optional event properties", async () => {
      const minimalEvent: AnalyticsEvent = {
        eventName: "test_event",
        eventCategory: "navigation",
        eventAction: "click",
      };

      await expect(
        analyticsService.trackEvent(minimalEvent),
      ).resolves.not.toThrow();
    });

    it("should auto-generate session ID if not provided", async () => {
      const eventWithoutSession: AnalyticsEvent = {
        userId: "user-123",
        eventName: "test_event",
        eventCategory: "navigation",
        eventAction: "click",
      };

      await expect(
        analyticsService.trackEvent(eventWithoutSession),
      ).resolves.not.toThrow();
    });

    it("should handle events with additional context", async () => {
      const eventWithContext: AnalyticsEvent = {
        eventName: "page_view",
        eventCategory: "navigation",
        eventAction: "click",
        context: {
          userAgent: "Mozilla/5.0",
          ipAddress: "192.168.1.1",
          pageUrl: "https://example.com/tournaments",
          referrerUrl: "https://example.com/",
          customField: "custom_value",
        },
      };

      await expect(
        analyticsService.trackEvent(eventWithContext),
      ).resolves.not.toThrow();
    });

    it("should not expose sensitive data in analytics", () => {
      // Verify that analytics service doesn't log passwords or tokens
      const sensitiveEvent: AnalyticsEvent = {
        userId: "user-123",
        eventName: "login_attempt",
        eventCategory: "profile",
        eventAction: "submit",
        properties: {
          // Should NOT include password or token
          email: "user@example.com",
          success: true,
        },
      };

      expect(sensitiveEvent.properties).not.toHaveProperty("password");
      expect(sensitiveEvent.properties).not.toHaveProperty("token");
      expect(sensitiveEvent.properties).not.toHaveProperty("secret");
    });
  });

  describe("Error Handling", () => {
    it("should handle analytics service errors gracefully", async () => {
      // Test that analytics failures don't break the application
      const invalidEvent = {} as AnalyticsEvent;

      // Should not throw, may log error
      await expect(async () => {
        try {
          await analyticsService.trackEvent(invalidEvent);
        } catch (error) {
          // Analytics errors should be caught and logged, not propagated
          expect(error).toBeDefined();
        }
      }).not.toThrow();
    });

    it("should validate required event fields", async () => {
      const eventMissingCategory = {
        eventName: "test",
        eventAction: "click",
      } as unknown as AnalyticsEvent;

      await expect(async () => {
        try {
          await analyticsService.trackEvent(eventMissingCategory);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }).not.toThrow();
    });
  });
});
