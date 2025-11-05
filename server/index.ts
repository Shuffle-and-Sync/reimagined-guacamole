// Load environment variables from .env.local for development only
import { existsSync } from "fs";
import { resolve } from "path";
import cors from "cors";
import { config } from "dotenv";
// CRITICAL: Initialize Sentry BEFORE importing any other modules
// This ensures error tracking captures all errors including initialization errors
import { sql } from "drizzle-orm";
import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db, initializeDatabase } from "@shared/database-unified";
import { toLoggableError } from "@shared/utils/type-guards";
import adminRoutes from "./admin/admin.routes";
import { getAuthUserId } from "./auth";
import {
  generateEmailVerificationJWT,
  verifyEmailVerificationJWT,
  TOKEN_EXPIRY,
} from "./auth/tokens";
import {
  createCorsConfig,
  createDevCorsConfig,
  validateCorsConfig,
} from "./config/cors.config";
import { sendEmailVerificationEmail } from "./email-service";
import {
  validateAndLogEnvironment,
  getEnvironmentStatus,
} from "./env-validation";
import {
  communitiesRoutes,
  userCommunitiesRouter,
  themePreferencesRouter,
} from "./features/communities/communities.routes";
import {
  eventsRoutes,
  userEventsRouter,
  calendarEventsRouter,
  eventReminderRoutes,
  eventStatusRoutes,
} from "./features/events/events.routes";
import { gamesRoutes } from "./features/games/games.routes";
import {
  notificationsRoutes,
  messagesRouter,
  conversationsRouter,
} from "./features/messaging/messaging.routes";
import { tournamentsRoutes } from "./features/tournaments/tournaments.routes";
import {
  usersRoutes,
  friendsRouter,
  friendRequestsRouter,
  matchmakingRouter,
} from "./features/users/users.routes";
import { errors as standardizedErrors } from "./lib/error-response";
import { logger } from "./logger";
import { memoryMonitor } from "./monitoring/memory";
import { authRateLimit } from "./rate-limiting";
import infrastructureTestsRouter from "./routes/infrastructure-tests";
import monitoringRouter from "./routes/monitoring";
import notificationPreferencesRouter from "./routes/notification-preferences";
import webhooksRouter from "./routes/webhooks";
import {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  flushSentry,
} from "./services/error-tracking.service";
import { monitoringService } from "./services/monitoring-service";
import {
  startTimer,
  endTimer,
  setupGracefulShutdown,
  logMemoryConfiguration,
  warmupCriticalPaths,
} from "./startup-optimization";
import { serveStatic, log } from "./static-server";
// Import feature-based routes
// Note: authRoutes reserved for future feature-based auth routing
// Import shared middleware
// Note: errorHandler, requestLogger, corsHandler reserved for enhanced middleware setup
import { storage } from "./storage";
import { auditSecurityConfiguration } from "./utils/security.utils";
import {
  validateEmailSchema,
  validateRequest,
  securityHeaders,
} from "./validation";
// Import Auth.js configuration and webhook routes
// Note: ExpressAuth reserved for direct Auth.js integration
// LAZY: Import auth routes after database initialization to avoid accessing db before it's ready
// import authRoutesFixed from "./auth/auth.routes";
// Only load .env.local in development or if it exists
// Use a more defensive approach for path resolution
const cwd = process.cwd();
if (cwd && process.env.NODE_ENV !== "production") {
  const envPath = resolve(cwd, ".env.local");
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}
initializeSentry();

const app = express();

// Trust proxy for correct x-forwarded-* headers (required for Auth.js host validation)
// Use "1" to trust only the first proxy (safer than "true" for rate limiting)
app.set("trust proxy", 1);

// CRITICAL: Add Sentry request and tracing handlers FIRST
// This ensures all requests are tracked for error monitoring and performance
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Basic middleware - body parsers MUST come before Auth.js routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Configuration - apply before security headers and routes
// Validate CORS configuration on startup
try {
  validateCorsConfig();
  const corsConfig =
    process.env.NODE_ENV === "development"
      ? createDevCorsConfig()
      : createCorsConfig();
  app.use(cors(corsConfig));
  logger.info("CORS middleware configured", {
    environment: process.env.NODE_ENV,
  });
} catch (error) {
  logger.error("Failed to configure CORS", { error });
  if (process.env.NODE_ENV === "production") {
    throw error;
  }
}

// Handle CORS errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    logger.warn("CORS error", {
      origin: req.headers.origin,
      path: req.path,
      method: req.method,
      userAgent: req.headers["user-agent"],
    });

    const corsError = standardizedErrors.operationNotAllowed("CORS", {
      origin: req.headers.origin,
    });

    return res.status(corsError.statusCode).json({
      error: {
        code: corsError.code,
        message: "Origin not allowed",
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: req.headers["x-request-id"] || "unknown",
      },
    });
  }

  next(err);
});

// Apply security headers (including CSP) before other routes
app.use(securityHeaders);

// Track initialization state for health checks
let initializationStatus = {
  status: "initializing" as "initializing" | "ready" | "degraded",
  startupTime: new Date(),
  env: false,
  security: false,
  database: false,
  routes: false,
};

// CRITICAL: Set up a basic health check IMMEDIATELY before any async initialization
// This ensures Cloud Run sees the container as healthy while initialization proceeds
app.get("/api/health", async (_req, res) => {
  const uptime = Date.now() - initializationStatus.startupTime.getTime();
  const envStatus = getEnvironmentStatus();

  // Check database connectivity - but don't fail health check if DB is unavailable
  let dbStatus = "unknown";
  if (initializationStatus.database) {
    try {
      if (process.env.DATABASE_URL) {
        await db
          .select({ count: sql`COUNT(*)` })
          .from(sql`(SELECT 1)`)
          .limit(1);
        dbStatus = "connected";
      } else {
        dbStatus = "not_configured";
      }
    } catch (error) {
      dbStatus = "disconnected";
      logger.warn("Database health check failed", error);
    }
  } else {
    dbStatus = "initializing";
  }

  // For Cloud Run compatibility, always return 200 OK if server is running
  // Even during initialization or with degraded services, the container is "healthy" for TCP probe
  const overallStatus =
    initializationStatus.status === "initializing" ? "initializing" : "ok";

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime / 1000), // seconds
    initialization: initializationStatus.status,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      valid: envStatus.valid,
      requiredVars: envStatus.requiredCount,
      missingRequired: envStatus.missingRequired,
      missingRecommended: envStatus.missingRecommended,
    },
    services: {
      database: dbStatus,
      port: process.env.PORT || "default",
    },
  });
});

// Create HTTP server immediately
const { createServer } = await import("http");
const server = createServer(app);

// Initialize Socket.io for real-time features (video, game state, etc.)
const { initializeSocketIO } = await import("./services/socket-io.service");
initializeSocketIO(server);

// CRITICAL: Start listening on PORT immediately BEFORE initialization
// This allows Cloud Run to detect the container as healthy while initialization proceeds in background
const port = parseInt(
  process.env.PORT ??
    (app.get("env") === "development"
      ? "5000"
      : (() => {
          throw new Error(
            "PORT environment variable must be set in production",
          );
        })()),
  10,
);

server.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    logger.info(`Server listening on port ${port} - starting initialization`, {
      port,
      host: "0.0.0.0",
      environment: process.env.NODE_ENV,
    });
    log(`serving on port ${port}`);
  },
);

// Run initialization asynchronously AFTER server starts listening
(async () => {
  // Log memory configuration recommendations
  logMemoryConfiguration();

  startTimer("total-startup");

  // Validate environment variables early in startup
  startTimer("env-validation");
  try {
    validateAndLogEnvironment();
    endTimer("env-validation");
    initializationStatus.env = true;
  } catch (error) {
    endTimer("env-validation");
    logger.error(
      "Environment validation failed during startup",
      toLoggableError(error),
    );
    initializationStatus.status = "degraded";
    if (process.env.NODE_ENV === "production") {
      logger.error("Environment validation failed - cannot continue");
      process.exit(1);
    }
  }

  // Run security audit
  startTimer("security-audit");
  try {
    const securityAudit = auditSecurityConfiguration();
    endTimer("security-audit");

    if (!securityAudit.passed) {
      logger.warn("Security audit found issues", {
        issues: securityAudit.issues,
      });
      initializationStatus.security = false;
      if (process.env.NODE_ENV === "production") {
        logger.error("Security audit failed in production - stopping server", {
          issues: securityAudit.issues,
        });
        process.exit(1);
      }
    } else {
      logger.info("Security audit passed");
      initializationStatus.security = true;
    }
  } catch (error) {
    endTimer("security-audit");
    logger.error(
      "Security audit failed during startup",
      toLoggableError(error),
    );
    initializationStatus.status = "degraded";
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  // Initialize database on server startup
  startTimer("database-init");
  try {
    await initializeDatabase();
    endTimer("database-init");
    logger.info("Database initialized successfully");
    initializationStatus.database = true;
  } catch (error) {
    endTimer("database-init");
    logger.error("Failed to initialize database", toLoggableError(error));
    initializationStatus.database = false;
    initializationStatus.status = "degraded";
    if (process.env.NODE_ENV === "production") {
      logger.warn(
        "Continuing startup with database unavailable - some endpoints will be degraded",
      );
    } else {
      process.exit(1);
    }
  }

  // Warm up critical paths for faster initial requests
  await warmupCriticalPaths();

  // Set up Auth.js routes AFTER database initialization
  // This ensures db is ready when DrizzleAdapter is accessed
  // CRITICAL: Use "/api/auth/*" pattern to properly handle all Auth.js sub-routes
  const { default: authRoutesFixed } = await import("./auth/auth.routes");
  app.use("/api/auth/*", authRoutesFixed);

  // Register feature-based routes (skip /api/auth since it's handled by authRouter)
  // app.use('/api/auth', authRoutes); // DISABLED - conflicts with Auth.js
  app.use("/api/communities", communitiesRoutes);
  app.use("/api/user/communities", userCommunitiesRouter);
  app.use("/api/user/theme-preferences", themePreferencesRouter);
  app.use("/api/events", eventsRoutes);
  app.use("/api/events", eventStatusRoutes);
  app.use("/api", gamesRoutes);
  app.use("/api/user/events", userEventsRouter);
  app.use("/api/calendar/events", calendarEventsRouter);
  app.use("/api/users/reminder-settings", eventReminderRoutes);
  app.use("/api/user", usersRoutes);
  app.use("/api/friends", friendsRouter);
  app.use("/api/friend-requests", friendRequestsRouter);
  app.use("/api/matchmaking", matchmakingRouter);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/messages", messagesRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/tournaments", tournamentsRoutes);

  // Register webhook routes
  app.use("/api/webhooks", webhooksRouter);

  // Register notification preferences routes
  app.use("/api/notification-preferences", notificationPreferencesRouter);

  // Register monitoring and alerting routes
  app.use("/api/monitoring", monitoringRouter);

  // Register infrastructure testing routes
  app.use("/api/tests", infrastructureTestsRouter);

  // Register admin routes
  app.use("/api/admin", adminRoutes);

  // Register static assets middleware for CDN-optimized serving
  // This middleware serves files from /static with proper cache headers
  const { staticAssetsMiddleware } = await import(
    "./middleware/static-assets.middleware"
  );
  app.use(staticAssetsMiddleware());

  // Email verification endpoints (moved from routes.ts to avoid Auth.js conflicts)
  app.post(
    "/api/email/send-verification-email",
    authRateLimit,
    validateRequest(validateEmailSchema),
    async (req, res): Promise<void> => {
      try {
        const { email } = req.body;

        if (!email) {
          res.status(400).json({ message: "Email is required" });
          return;
        }

        // Check if user exists
        const user = await storage.getUserByEmail(email);

        if (!user) {
          // Don't reveal if email exists to prevent enumeration attacks
          res.json({
            message:
              "If an account with that email exists, a verification email has been sent.",
          });
          return;
        }

        // Check if email is already verified - but don't reveal this to prevent enumeration
        if (user.isEmailVerified) {
          res.json({
            message:
              "If an account with that email exists, a verification email has been sent.",
          });
          return;
        }

        // Invalidate any existing verification tokens for this user
        await storage.invalidateUserEmailVerificationTokens(user.id);

        // Generate JWT token for email verification
        const verificationToken = await generateEmailVerificationJWT(
          user.id,
          email,
          TOKEN_EXPIRY.EMAIL_VERIFICATION,
        );

        // Store token in database
        const expiresAt = new Date(
          Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000,
        );
        await storage.createEmailVerificationToken({
          userId: user.id,
          email,
          token: verificationToken,
          expiresAt,
        });

        // Send verification email with trusted base URL
        const baseUrl =
          process.env.AUTH_URL ||
          process.env.PUBLIC_WEB_URL ||
          "https://shuffleandsync.org";
        await sendEmailVerificationEmail(
          email,
          verificationToken,
          baseUrl,
          user.firstName || undefined,
        );

        res.json({
          message:
            "If an account with that email exists, a verification email has been sent.",
        });
      } catch (error) {
        logger.error(
          "Failed to send verification email",
          toLoggableError(error),
        );
        res.status(500).json({ message: "Failed to send verification email" });
        return;
      }
    },
  );

  app.get("/api/email/verify-email", async (req, res): Promise<void> => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        res.status(400).json({ message: "Verification token is required" });
        return;
      }

      // Verify JWT token
      const jwtResult = await verifyEmailVerificationJWT(token);

      if (!jwtResult.valid) {
        res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
        return;
      }

      // Check token in database
      const dbToken = await storage.getEmailVerificationToken(token);

      if (!dbToken) {
        res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
        return;
      }

      // Mark token as used
      await storage.markEmailVerificationTokenAsUsed(token);

      // Update user's email verification status
      await storage.updateUser(dbToken.userId, {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });

      res.json({
        message: "Email verified successfully",
        redirectUrl: "/dashboard",
      });
    } catch (error) {
      logger.error("Failed to verify email", toLoggableError(error));
      res.status(500).json({ message: "Failed to verify email" });
      return;
    }
  });

  app.post(
    "/api/email/resend-verification-email",
    authRateLimit,
    async (req, res): Promise<void> => {
      try {
        // Get user from session or request body
        let userId;
        try {
          userId = getAuthUserId(req);
        } catch {
          // No session, use email from body
        }

        const { email } = req.body;

        if (!userId && !email) {
          res
            .status(400)
            .json({ message: "User session or email is required" });
          return;
        }

        let user;
        if (userId) {
          user = await storage.getUser(userId);
        } else if (email) {
          user = await storage.getUserByEmail(email);
        }

        if (!user) {
          // Don't reveal if user exists to prevent enumeration attacks
          res.json({
            message:
              "If an account exists, a verification email has been sent.",
          });
          return;
        }

        // Check if email is already verified - but don't reveal this to prevent enumeration
        if (user.isEmailVerified) {
          res.json({
            message:
              "If an account exists, a verification email has been sent.",
          });
          return;
        }

        // Check for existing unexpired token
        const existingToken = await storage.getEmailVerificationTokenByUserId(
          user.id,
        );
        if (existingToken) {
          res.status(429).json({
            message:
              "A verification email was already sent recently. Please check your email or wait before requesting another.",
          });
          return;
        }

        // Validate user email exists
        if (!user.email) {
          res.status(400).json({ message: "User email not found" });
          return;
        }

        // Invalidate any existing verification tokens for this user
        await storage.invalidateUserEmailVerificationTokens(user.id);

        // Generate new JWT token
        const verificationToken = await generateEmailVerificationJWT(
          user.id,
          user.email,
          TOKEN_EXPIRY.EMAIL_VERIFICATION,
        );

        // Store token in database
        const expiresAt = new Date(
          Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000,
        );
        await storage.createEmailVerificationToken({
          userId: user.id,
          email: user.email,
          token: verificationToken,
          expiresAt,
        });

        // Send verification email with trusted base URL
        const baseUrl =
          process.env.AUTH_URL ||
          process.env.PUBLIC_WEB_URL ||
          "https://shuffleandsync.org";
        await sendEmailVerificationEmail(
          user.email,
          verificationToken,
          baseUrl,
          user.firstName || undefined,
        );

        res.json({
          message: "If an account exists, a verification email has been sent.",
        });
      } catch (error) {
        logger.error(
          "Failed to resend verification email",
          toLoggableError(error),
        );
        res
          .status(500)
          .json({ message: "Failed to resend verification email" });
        return;
      }
    },
  );

  // Email change endpoints (Phase 2)
  app.post(
    "/api/email/initiate-email-change",
    authRateLimit,
    async (req, res): Promise<void> => {
      try {
        // Require authenticated user
        let userId;
        try {
          userId = getAuthUserId(req);
        } catch {
          res.status(401).json({ message: "Authentication required" });
          return;
        }

        // Validate request body with Zod
        const emailChangeSchema = z.object({
          newEmail: z.string().email("Please enter a valid email address"),
        });

        const validation = emailChangeSchema.safeParse(req.body);
        if (!validation.success) {
          res.status(400).json({
            message:
              validation.error.errors[0]?.message || "Invalid email address",
          });
          return;
        }

        const { newEmail } = validation.data;

        // Get current user
        const user = await storage.getUser(userId);
        if (!user || !user.email) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        // Check if new email is same as current
        if (user.email === newEmail) {
          res.status(400).json({
            message: "New email address must be different from current email",
          });
          return;
        }

        // Check if new email is already taken by another user
        const existingUser = await storage.getUserByEmail(newEmail);
        if (existingUser && existingUser.id !== userId) {
          res.status(409).json({
            message: "Email address is already in use by another account",
          });
          return;
        }

        // Check for existing pending email change request
        const existingRequest = await storage.getUserEmailChangeRequest(userId);
        if (existingRequest) {
          res.status(429).json({
            message:
              "An email change request is already pending. Please complete or cancel the existing request first.",
          });
          return;
        }

        // Create email change request
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const emailChangeRequest = await storage.createEmailChangeRequest({
          userId,
          currentEmail: user.email,
          newEmail,
          status: "pending",
          expiresAt,
        });

        // Generate JWT token for email change verification
        const verificationToken = await generateEmailVerificationJWT(
          userId,
          newEmail,
          TOKEN_EXPIRY.EMAIL_VERIFICATION,
        );

        // Store email change token
        const tokenExpiresAt = new Date(
          Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000,
        );
        await storage.createEmailChangeToken({
          requestId: emailChangeRequest.id,
          token: verificationToken,
          type: "new_email", // This is for verifying the new email
          expiresAt: tokenExpiresAt,
        });

        // Send verification email to new email address
        const baseUrl =
          process.env.AUTH_URL ||
          process.env.PUBLIC_WEB_URL ||
          "https://shuffleandsync.org";
        await sendEmailVerificationEmail(
          newEmail,
          verificationToken,
          baseUrl,
          user.firstName || undefined,
        );

        res.json({
          message:
            "Email change verification sent to your new email address. Please check your inbox and click the verification link.",
          expiresAt: expiresAt.toISOString(),
        });
      } catch (error) {
        logger.error("Failed to initiate email change", toLoggableError(error));
        res.status(500).json({ message: "Failed to initiate email change" });
        return;
      }
    },
  );

  app.get(
    "/api/email/confirm-email-change",
    authRateLimit,
    async (req, res): Promise<void> => {
      try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
          res
            .status(400)
            .json({ message: "Email change verification token is required" });
          return;
        }

        // Verify JWT token
        const jwtResult = await verifyEmailVerificationJWT(token);

        if (!jwtResult.valid) {
          res
            .status(400)
            .json({ message: "Invalid or expired verification token" });
          return;
        }

        // Check token in database
        const dbToken = await storage.getEmailChangeToken(token);

        if (!dbToken) {
          res
            .status(400)
            .json({ message: "Invalid or expired verification token" });
          return;
        }

        // Get the email change request
        const emailChangeRequest = await storage.getEmailChangeRequest(
          dbToken.requestId,
        );

        if (!emailChangeRequest || emailChangeRequest.status !== "pending") {
          res
            .status(400)
            .json({ message: "Invalid or expired email change request" });
          return;
        }

        // Mark token as used
        await storage.markEmailChangeTokenAsUsed(token);

        // Update email change request status
        await storage.updateEmailChangeRequest(emailChangeRequest.id, {
          status: "verified",
        });

        // Update user's email address
        await storage.updateUser(emailChangeRequest.userId, {
          email: emailChangeRequest.newEmail,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        });

        res.json({
          message: "Email address updated successfully",
          redirectUrl: "/dashboard",
        });
      } catch (error) {
        logger.error("Failed to confirm email change", toLoggableError(error));
        res.status(500).json({ message: "Failed to confirm email change" });
        return;
      }
    },
  );

  app.post(
    "/api/email/cancel-email-change",
    authRateLimit,
    async (req, res): Promise<void> => {
      try {
        // Require authenticated user
        let userId;
        try {
          userId = getAuthUserId(req);
        } catch {
          res.status(401).json({ message: "Authentication required" });
          return;
        }

        // Cancel any pending email change request
        await storage.cancelEmailChangeRequest(userId);

        res.json({ message: "Email change request cancelled successfully" });
      } catch (error) {
        logger.error("Failed to cancel email change", toLoggableError(error));
        res.status(500).json({ message: "Failed to cancel email change" });
      }
    },
  );

  // CRITICAL: Add Sentry error handler BEFORE other error handlers
  // This ensures all errors are captured by Sentry
  app.use(sentryErrorHandler());

  // Basic error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // CRITICAL: Check process.env.NODE_ENV directly (not app.get("env")) for reliability
  // Only load vite in explicit development mode to avoid module errors in production
  if (process.env.NODE_ENV === "development") {
    // Use dynamic import with runtime path resolution to avoid bundling vite in production
    try {
      const viteModule = await import(`./vite.js`);
      await viteModule.setupVite(app, server);
    } catch (error) {
      console.error("Failed to load vite module:", error);
      // Fallback to static serving if vite module fails to load
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  // Mark routes as initialized
  initializationStatus.routes = true;
  initializationStatus.status = "ready";
  endTimer("total-startup");
  logger.info("Server initialization complete", {
    status: initializationStatus.status,
  });

  // Setup graceful shutdown handlers with server and database references
  const { closeDatabaseConnections } = await import("@shared/database-unified");
  setupGracefulShutdown(server, { drizzle: db, closeDatabaseConnections });

  // Add Sentry flush to shutdown process
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, flushing Sentry events");
    await flushSentry(2000);
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT received, flushing Sentry events");
    await flushSentry(2000);
  });

  // Start monitoring service after server is running
  try {
    monitoringService.start();
    logger.info("Monitoring service started");
  } catch (error) {
    logger.warn("Failed to start monitoring service", error);
  }

  // Start event reminder job
  try {
    const { scheduleEventReminderJob } = await import(
      "./jobs/event-reminder.job"
    );
    await scheduleEventReminderJob();
    logger.info("Event reminder job scheduled");
  } catch (error) {
    logger.warn("Failed to schedule event reminder job", error);
  }

  // Start memory monitoring and integrate with alerting
  try {
    // Register memory alert handler to integrate with monitoring service
    memoryMonitor.onAlert((level, metrics) => {
      logger.info("Memory alert triggered", { level, metrics });
      // The alert will be logged by the memory monitor itself
      // Additional integration can be added here if needed
    });

    memoryMonitor.start();
    logger.info("Memory monitoring started", {
      config: memoryMonitor.getStatus().config,
    });
  } catch (error) {
    logger.warn("Failed to start memory monitoring", error);
  }
})().catch((error) => {
  logger.error(
    "Fatal error during server initialization",
    toLoggableError(error),
  );
  process.exit(1);
});
