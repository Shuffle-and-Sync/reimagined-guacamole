import { Router } from "express";
import { z } from "zod";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { logger } from "../logger";
import { cacheMiddleware, cacheConfigs } from "../middleware/cache-middleware";
import {
  errorHandlingMiddleware,
  errors,
} from "../middleware/error-handling.middleware";
import { generalRateLimit } from "../rate-limiting";
import { analyticsService } from "../services/analytics-service";
import { streamingCoordinator } from "../services/streaming-coordinator.service";
import { storage } from "../storage";
import { validateRequest } from "../validation";

const { asyncHandler } = errorHandlingMiddleware;
const { AuthorizationError } = errors;

const router = Router();

// Apply authentication to all analytics routes
router.use(isAuthenticated);

// Apply rate limiting to all analytics routes
router.use(generalRateLimit);

// Admin check utility
const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const user = await storage.getUser(userId);
    // In production, implement proper role-based access control
    return user?.email === "admin@shuffleandsync.com";
  } catch {
    return false;
  }
};

/**
 * Track user activity events
 * POST /api/analytics/events
 */
const eventTrackingSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventName: z.string().min(1, "Event name is required"),
  eventCategory: z.enum([
    "navigation",
    "streaming",
    "social",
    "tournament",
    "community",
    "profile",
    "settings",
  ]),
  eventAction: z.enum([
    "click",
    "scroll",
    "submit",
    "create",
    "join",
    "leave",
    "share",
    "like",
    "comment",
  ]),
  eventLabel: z.string().optional(),
  eventValue: z.number().optional(),
  properties: z.record(z.any()).optional(),
  context: z
    .object({
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
      pageUrl: z.string().optional(),
      referrerUrl: z.string().optional(),
    })
    .optional(),
});

router.post(
  "/events",
  validateRequest(eventTrackingSchema),
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const eventData = req.body;

    // Ensure userId matches authenticated user if provided
    if (
      eventData.userId &&
      eventData.userId !== getAuthUserId(authenticatedReq)
    ) {
      throw new AuthorizationError("Cannot track events for other users");
    }

    // Auto-set userId to authenticated user if not provided
    if (!eventData.userId) {
      eventData.userId = getAuthUserId(authenticatedReq);
    }

    await analyticsService.trackEvent(eventData);

    return res.json({
      success: true,
      message: "Event tracked successfully",
    });
  }),
);

/**
 * Track funnel progression
 * POST /api/analytics/funnel
 */
router.post("/funnel", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    const funnelSchema = z.object({
      funnelName: z.string(),
      stepName: z.string(),
      stepOrder: z.number().int().min(1),
      userId: z.string(),
      sessionId: z.string(),
      completed: z.boolean().default(true),
      timeSpent: z.number().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const funnelData = funnelSchema.parse(req.body);

    // Ensure userId matches authenticated user
    if (funnelData.userId !== getAuthUserId(authenticatedReq)) {
      return res
        .status(403)
        .json({ success: false, error: "Cannot track funnel for other users" });
    }

    await analyticsService.trackFunnelStep(
      funnelData.funnelName,
      funnelData.stepName,
      funnelData.stepOrder,
      funnelData.userId,
      funnelData.sessionId,
      funnelData.completed,
      funnelData.timeSpent,
      funnelData.metadata,
    );

    return res.json({
      success: true,
      message: "Funnel step tracked successfully",
    });
  } catch (error) {
    logger.error("Failed to track funnel step", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to track funnel step",
    });
  }
});

/**
 * Track streaming metrics
 * POST /api/analytics/stream-metrics
 */
router.post("/stream-metrics", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    const streamMetricsSchema = z.object({
      sessionId: z.string(),
      platform: z.enum(["twitch", "youtube", "facebook", "discord"]),
      viewerCount: z.number().int().min(0),
      chatMessageCount: z.number().int().min(0).optional(),
      followersGained: z.number().int().min(0).optional(),
      subscriptionsGained: z.number().int().min(0).optional(),
      streamQuality: z.string().optional(),
      frameDrops: z.number().int().min(0).optional(),
      bitrate: z.number().int().min(0).optional(),
    });

    const metricsData = streamMetricsSchema.parse(req.body);

    // Validate sessionId ownership - users can only submit metrics for their own streaming sessions
    const authUserId = getAuthUserId(authenticatedReq);
    const userSessions =
      await streamingCoordinator.getUserStreamSessions(authUserId);
    const hasSessionAccess = userSessions.some(
      (session) => session.id === metricsData.sessionId,
    );

    if (!hasSessionAccess && !(await isAdmin(authUserId))) {
      return res.status(403).json({
        success: false,
        error: "Cannot submit metrics for streaming sessions you do not own",
      });
    }

    await analyticsService.trackStreamMetrics(metricsData);

    return res.json({
      success: true,
      message: "Stream metrics tracked successfully",
    });
  } catch (error) {
    logger.error("Failed to track stream metrics", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to track stream metrics",
    });
  }
});

/**
 * Record system metrics (admin only)
 * POST /api/analytics/system-metrics
 */
router.post("/system-metrics", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    const systemMetricsSchema = z.object({
      metricType: z.enum([
        "performance",
        "usage",
        "system",
        "error",
        "business",
      ]),
      metricName: z.string(),
      metricValue: z.number(),
      metricUnit: z.string().optional(),
      aggregationType: z.enum([
        "avg",
        "sum",
        "max",
        "min",
        "count",
        "percentile",
      ]),
      timeWindow: z.enum(["1m", "5m", "15m", "1h", "6h", "1d", "7d", "30d"]),
      tags: z.record(z.string()).optional(),
    });

    const metricsData = systemMetricsSchema.parse(req.body);

    await analyticsService.recordSystemMetrics(metricsData);

    return res.json({
      success: true,
      message: "System metrics recorded successfully",
    });
  } catch (error) {
    logger.error("Failed to record system metrics", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to record system metrics",
    });
  }
});

/**
 * Aggregate community metrics (admin only)
 * POST /api/analytics/community-metrics
 */
router.post("/community-metrics", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    const communityMetricsSchema = z.object({
      communityId: z.string(),
      date: z.coerce.date(),
      hour: z.number().int().min(0).max(23).optional(),
    });

    const { communityId, date, hour } = communityMetricsSchema.parse(req.body);

    await analyticsService.aggregateCommunityMetrics(communityId, date, hour);

    return res.json({
      success: true,
      message: "Community metrics aggregated successfully",
    });
  } catch (error) {
    logger.error("Failed to aggregate community metrics", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to aggregate community metrics",
    });
  }
});

/**
 * Get real-time platform statistics
 * GET /api/analytics/realtime-stats
 */
router.get(
  "/realtime-stats",
  cacheMiddleware(cacheConfigs.shortCache),
  async (_req: _req, res) => {
    try {
      const stats = await analyticsService.getRealTimeStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      logger.error("Failed to get real-time stats", { error });
      return res
        .status(500)
        .json({ success: false, error: "Failed to get real-time stats" });
    }
  },
);

/**
 * Generate dashboard data
 * GET /api/analytics/dashboard?timeframe=7d&userId=xxx&communityId=xxx
 */
router.get(
  "/dashboard",
  cacheMiddleware(cacheConfigs.analyticsCache),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;

    try {
      const querySchema = z.object({
        timeframe: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
        userId: z.string().optional(),
        communityId: z.string().optional(),
      });

      const { timeframe, userId, communityId } = querySchema.parse(req.query);

      // If userId provided, ensure user can only access their own data unless admin
      if (userId) {
        const authUserId = getAuthUserId(authenticatedReq);
        if (userId !== authUserId && !(await isAdmin(authUserId))) {
          return res.status(403).json({
            success: false,
            error: "Cannot access other users dashboard data",
          });
        }
      }

      const dashboardData = await analyticsService.generateDashboardData(
        userId,
        communityId,
        timeframe,
      );

      return res.json({ success: true, data: dashboardData });
    } catch (error) {
      logger.error("Failed to generate dashboard data", {
        error,
        query: req.query,
      });
      return res.status(400).json({
        success: false,
        error:
          error instanceof z.ZodError
            ? error.errors
            : "Failed to generate dashboard data",
      });
    }
  },
);

/**
 * Get user activity analytics
 * GET /api/analytics/user-activity/:userId?days=30
 */
router.get("/user-activity/:userId", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    const paramsSchema = z.object({
      userId: z.string(),
    });

    const querySchema = z.object({
      days: z.coerce.number().int().min(1).max(365).default(30),
    });

    const { userId } = paramsSchema.parse(req.params);
    const { days } = querySchema.parse(req.query);

    // Users can only access their own analytics unless admin
    const authUserId = getAuthUserId(authenticatedReq);
    if (userId !== authUserId && !(await isAdmin(authUserId))) {
      return res
        .status(403)
        .json({ success: false, error: "Cannot access other users analytics" });
    }

    const activityData = await storage.getUserActivityAnalytics(userId, days);

    return res.json({ success: true, data: activityData });
  } catch (error) {
    logger.error("Failed to get user activity analytics", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to get user activity analytics",
    });
  }
});

/**
 * Get community analytics
 * GET /api/analytics/community/:communityId?startDate=xxx&endDate=xxx
 */
router.get("/community/:communityId", async (req, res) => {
  try {
    const paramsSchema = z.object({
      communityId: z.string(),
    });

    const querySchema = z.object({
      startDate: z.coerce.date().default(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
      }),
      endDate: z.coerce.date().default(() => new Date()),
    });

    const { communityId } = paramsSchema.parse(req.params);
    const { startDate, endDate } = querySchema.parse(req.query);

    const communityData = await storage.getCommunityAnalytics(
      communityId,
      startDate,
      endDate,
    );

    return res.json({ success: true, data: communityData });
  } catch (error) {
    logger.error("Failed to get community analytics", {
      error,
      params: req.params,
      query: req.query,
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to get community analytics",
    });
  }
});

/**
 * Get platform metrics
 * GET /api/analytics/platform-metrics?metricType=xxx&timeWindow=xxx&startDate=xxx&endDate=xxx
 */
router.get("/platform-metrics", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const authUserId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(authUserId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    const querySchema = z.object({
      metricType: z
        .enum(["performance", "usage", "system", "error", "business"])
        .optional(),
      timeWindow: z
        .enum(["1m", "5m", "15m", "1h", "6h", "1d", "7d", "30d"])
        .optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    });

    const { metricType, timeWindow, startDate, endDate } = querySchema.parse(
      req.query,
    );

    const platformData = await storage.getPlatformMetrics(
      metricType,
      timeWindow,
      startDate,
      endDate,
    );

    return res.json({ success: true, data: platformData });
  } catch (error) {
    logger.error("Failed to get platform metrics", { error, query: req.query });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to get platform metrics",
    });
  }
});

/**
 * Get event tracking data
 * GET /api/analytics/events?eventName=xxx&userId=xxx&startDate=xxx&endDate=xxx
 */
router.get("/events", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint for viewing all events
    const authUserId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(authUserId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const querySchema = z.object({
      eventName: z.string().optional(),
      userId: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    });

    const { eventName, userId, startDate, endDate } = querySchema.parse(
      req.query,
    );

    const eventData = await storage.getEventTracking(
      eventName,
      userId,
      startDate,
      endDate,
    );

    return res.json({ success: true, data: eventData });
  } catch (error) {
    logger.error("Failed to get event tracking data", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to get event tracking data",
    });
  }
});

/**
 * Get conversion funnel data
 * GET /api/analytics/funnel/:funnelName?startDate=xxx&endDate=xxx
 */
router.get("/funnel/:funnelName", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const authUserId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(authUserId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    const paramsSchema = z.object({
      funnelName: z.string(),
    });

    const querySchema = z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    });

    const { funnelName } = paramsSchema.parse(req.params);
    const { startDate, endDate } = querySchema.parse(req.query);

    const funnelData = await storage.getConversionFunnelData(
      funnelName,
      startDate,
      endDate,
    );

    return res.json({ success: true, data: funnelData });
  } catch (error) {
    logger.error("Failed to get conversion funnel data", {
      error,
      params: req.params,
      query: req.query,
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to get conversion funnel data",
    });
  }
});

/**
 * Get user insights and behavioral analysis
 * GET /api/analytics/user-insights/:userId
 */
router.get("/user-insights/:userId", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    const paramsSchema = z.object({
      userId: z.string(),
    });

    const { userId } = paramsSchema.parse(req.params);

    // Users can only access their own insights unless admin
    const authUserId = getAuthUserId(authenticatedReq);
    if (userId !== authUserId && !(await isAdmin(authUserId))) {
      return res
        .status(403)
        .json({ success: false, error: "Cannot access other users insights" });
    }

    const insights = await analyticsService.generateUserInsights(userId);

    return res.json({ success: true, data: insights });
  } catch (error) {
    logger.error("Failed to get user insights", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(400).json({
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors
          : "Failed to get user insights",
    });
  }
});

/**
 * Health check endpoint for analytics service
 * GET /api/analytics/health
 */
router.get("/health", async (_req: _req, res) => {
  try {
    // Test database connectivity and analytics service health
    const testMetrics = await storage.getPlatformMetrics("system", "1m");

    return res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      systemCheck: {
        database: "connected",
        analyticsService: "operational",
        lastMetricCount: testMetrics.length,
      },
    });
  } catch (error) {
    logger.error("Analytics health check failed", { error });
    return res.status(500).json({
      success: false,
      status: "unhealthy",
      error: "Analytics service health check failed",
    });
  }
});

export default router;
