// Load environment variables from .env.local for development
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), '.env.local') });

import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./logger";
import { initializePrisma } from "@shared/database";
import { validateAndLogEnvironment, getEnvironmentStatus } from "./env-validation";
import { startTimer, endTimer, setupGracefulShutdown, logMemoryConfiguration, warmupCriticalPaths } from "./startup-optimization";
import { sql } from "drizzle-orm";

// Import feature-based routes
import { authRoutes } from "./features/auth/auth.routes";
import { communitiesRoutes, userCommunitiesRouter, themePreferencesRouter } from "./features/communities/communities.routes";
import { eventsRoutes, userEventsRouter, calendarEventsRouter } from "./features/events/events.routes";
import { usersRoutes, friendsRouter, friendRequestsRouter, matchmakingRouter } from "./features/users/users.routes";
import { notificationsRoutes, messagesRouter, conversationsRouter } from "./features/messaging/messaging.routes";
import { tournamentsRoutes } from "./features/tournaments/tournaments.routes";
import { gamesRoutes } from "./features/games/games.routes";

// Import shared middleware
import { errorHandler, requestLogger, corsHandler } from "./shared/middleware";
import { securityHeaders } from "./validation";

// Import Auth.js configuration and webhook routes
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./auth/auth.config";
import authRoutesFixed from "./auth/auth.routes";
import webhooksRouter from "./routes/webhooks";
import notificationPreferencesRouter from "./routes/notification-preferences";
import monitoringRouter from "./routes/monitoring";
import infrastructureTestsRouter from "./routes/infrastructure-tests";
import adminRoutes from "./admin/admin.routes";
import { monitoringService } from "./services/monitoring-service";

// Import email verification route dependencies
import { validateEmailSchema, validateRequest } from "./validation";
import { authRateLimit } from "./rate-limiting";
import { sendEmailVerificationEmail } from "./email-service";
import { generateEmailVerificationJWT, verifyEmailVerificationJWT, TOKEN_EXPIRY } from "./auth/tokens";
import { storage } from "./storage";
import { getAuthUserId } from "./auth";
import { z } from "zod";

const app = express();

// Trust proxy for correct x-forwarded-* headers (required for Auth.js host validation)
// Use "1" to trust only the first proxy (safer than "true" for rate limiting)
app.set('trust proxy', 1);

// Basic middleware - body parsers MUST come before Auth.js routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up Auth.js routes AFTER body parsers so req.body is populated  
// AUTH_URL and AUTH_TRUST_HOST environment variables handle domain configuration
// CRITICAL FIX: Use the corrected auth routes instead of direct ExpressAuth mounting
app.use("/api/auth", authRoutesFixed);

// Apply security headers (including CSP) before other routes
app.use(securityHeaders);

(async () => {
  // Log memory configuration recommendations
  logMemoryConfiguration();
  
  startTimer('total-startup');
  
  // Validate environment variables early in startup
  startTimer('env-validation');
  try {
    validateAndLogEnvironment();
    endTimer('env-validation');
  } catch (error) {
    endTimer('env-validation');
    logger.error('Environment validation failed during startup', error);
    process.exit(1);
  }

  // Initialize Prisma on server startup
  startTimer('database-init');
  try {
    await initializePrisma();
    endTimer('database-init');
    logger.info('Prisma client initialized successfully');
  } catch (error) {
    endTimer('database-init');
    logger.error('Failed to initialize Prisma client', error);
    process.exit(1);
  }

  // Warm up critical paths for faster initial requests
  await warmupCriticalPaths();

  // Register feature-based routes (skip /api/auth since it's handled by authRouter)
  // app.use('/api/auth', authRoutes); // DISABLED - conflicts with Auth.js
  app.use('/api/communities', communitiesRoutes);
  app.use('/api/user/communities', userCommunitiesRouter);
  app.use('/api/user/theme-preferences', themePreferencesRouter);
  app.use('/api/events', eventsRoutes);
  app.use('/api', gamesRoutes);
  app.use('/api/user/events', userEventsRouter);
  app.use('/api/calendar/events', calendarEventsRouter);
  app.use('/api/user', usersRoutes);
  app.use('/api/friends', friendsRouter);
  app.use('/api/friend-requests', friendRequestsRouter);
  app.use('/api/matchmaking', matchmakingRouter);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/messages', messagesRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/tournaments', tournamentsRoutes);
  
  // Register webhook routes  
  app.use('/api/webhooks', webhooksRouter);
  
  // Register notification preferences routes
  app.use('/api/notification-preferences', notificationPreferencesRouter);
  
  // Register monitoring and alerting routes
  app.use('/api/monitoring', monitoringRouter);
  
  // Register infrastructure testing routes
  app.use('/api/tests', infrastructureTestsRouter);

  // Register admin routes
  app.use('/api/admin', adminRoutes);

  // Email verification endpoints (moved from routes.ts to avoid Auth.js conflicts)
  app.post('/api/email/send-verification-email', authRateLimit, validateRequest(validateEmailSchema), async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists to prevent enumeration attacks
        return res.json({ message: "If an account with that email exists, a verification email has been sent." });
      }

      // Check if email is already verified - but don't reveal this to prevent enumeration
      if (user.isEmailVerified) {
        return res.json({ message: "If an account with that email exists, a verification email has been sent." });
      }

      // Invalidate any existing verification tokens for this user
      await storage.invalidateUserEmailVerificationTokens(user.id);
      
      // Generate JWT token for email verification
      const verificationToken = await generateEmailVerificationJWT(
        user.id, 
        email, 
        TOKEN_EXPIRY.EMAIL_VERIFICATION
      );
      
      // Store token in database
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000);
      await storage.createEmailVerificationToken({
        userId: user.id,
        email,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email with trusted base URL
      const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
      await sendEmailVerificationEmail(email, verificationToken, baseUrl, user.firstName || undefined);

      res.json({ message: "If an account with that email exists, a verification email has been sent." });
    } catch (error) {
      logger.error("Failed to send verification email", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  app.get('/api/email/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Verify JWT token
      const jwtResult = await verifyEmailVerificationJWT(token);
      
      if (!jwtResult.valid) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check token in database
      const dbToken = await storage.getEmailVerificationToken(token);
      
      if (!dbToken) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
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
        redirectUrl: "/dashboard" 
      });
    } catch (error) {
      logger.error("Failed to verify email", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post('/api/email/resend-verification-email', authRateLimit, async (req, res) => {
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
        return res.status(400).json({ message: "User session or email is required" });
      }

      let user;
      if (userId) {
        user = await storage.getUser(userId);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      }
      
      if (!user) {
        // Don't reveal if user exists to prevent enumeration attacks
        return res.json({ message: "If an account exists, a verification email has been sent." });
      }

      // Check if email is already verified - but don't reveal this to prevent enumeration
      if (user.isEmailVerified) {
        return res.json({ message: "If an account exists, a verification email has been sent." });
      }

      // Check for existing unexpired token
      const existingToken = await storage.getEmailVerificationTokenByUserId(user.id);
      if (existingToken) {
        return res.status(429).json({ 
          message: "A verification email was already sent recently. Please check your email or wait before requesting another." 
        });
      }

      // Invalidate any existing verification tokens for this user
      await storage.invalidateUserEmailVerificationTokens(user.id);
      
      // Generate new JWT token
      const verificationToken = await generateEmailVerificationJWT(
        user.id, 
        user.email!, 
        TOKEN_EXPIRY.EMAIL_VERIFICATION
      );
      
      // Store token in database
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000);
      await storage.createEmailVerificationToken({
        userId: user.id,
        email: user.email!,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email with trusted base URL
      const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
      await sendEmailVerificationEmail(user.email!, verificationToken, baseUrl, user.firstName || undefined);

      res.json({ message: "If an account exists, a verification email has been sent." });
    } catch (error) {
      logger.error("Failed to resend verification email", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Email change endpoints (Phase 2)
  app.post('/api/email/initiate-email-change', authRateLimit, async (req, res) => {
    try {
      // Require authenticated user
      let userId;
      try {
        userId = getAuthUserId(req);
      } catch (authError) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate request body with Zod
      const emailChangeSchema = z.object({
        newEmail: z.string().email("Please enter a valid email address"),
      });
      
      const validation = emailChangeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: validation.error.errors[0]?.message || "Invalid email address" 
        });
      }
      
      const { newEmail } = validation.data;

      // Get current user
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if new email is same as current
      if (user.email === newEmail) {
        return res.status(400).json({ message: "New email address must be different from current email" });
      }

      // Check if new email is already taken by another user
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "Email address is already in use by another account" });
      }

      // Check for existing pending email change request
      const existingRequest = await storage.getUserEmailChangeRequest(userId);
      if (existingRequest) {
        return res.status(429).json({ 
          message: "An email change request is already pending. Please complete or cancel the existing request first." 
        });
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
        TOKEN_EXPIRY.EMAIL_VERIFICATION
      );
      
      // Store email change token
      const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000);
      await storage.createEmailChangeToken({
        emailChangeRequestId: emailChangeRequest.id,
        userId,
        newEmail,
        token: verificationToken,
        expiresAt: tokenExpiresAt,
      });

      // Send verification email to new email address
      const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
      await sendEmailVerificationEmail(newEmail, verificationToken, baseUrl, user.firstName || undefined);

      res.json({ 
        message: "Email change verification sent to your new email address. Please check your inbox and click the verification link.",
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      logger.error("Failed to initiate email change", error);
      res.status(500).json({ message: "Failed to initiate email change" });
    }
  });

  app.get('/api/email/confirm-email-change', authRateLimit, async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Email change verification token is required" });
      }

      // Verify JWT token
      const jwtResult = await verifyEmailVerificationJWT(token);
      
      if (!jwtResult.valid) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check token in database
      const dbToken = await storage.getEmailChangeToken(token);
      
      if (!dbToken) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Get the email change request
      const emailChangeRequest = await storage.getEmailChangeRequest(dbToken.emailChangeRequestId);
      
      if (!emailChangeRequest || emailChangeRequest.status !== "pending") {
        return res.status(400).json({ message: "Invalid or expired email change request" });
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
        redirectUrl: "/dashboard" 
      });
    } catch (error) {
      logger.error("Failed to confirm email change", error);
      res.status(500).json({ message: "Failed to confirm email change" });
    }
  });

  app.post('/api/email/cancel-email-change', authRateLimit, async (req, res) => {
    try {
      // Require authenticated user
      let userId;
      try {
        userId = getAuthUserId(req);
      } catch (authError) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Cancel any pending email change request
      await storage.cancelEmailChangeRequest(userId);

      res.json({ message: "Email change request cancelled successfully" });
    } catch (error) {
      logger.error("Failed to cancel email change", error);
      res.status(500).json({ message: "Failed to cancel email change" });
    }
  });

  // Enhanced health check route with environment status and database connectivity
  const startupTime = new Date();
  app.get('/api/health', async (_req, res) => {
    const envStatus = getEnvironmentStatus();
    const uptime = Date.now() - startupTime.getTime();
    
    // Check database connectivity
    let dbStatus = 'connected';
    try {
      const { db } = await import("@shared/database");
      // Simple connectivity check using raw SQL
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      dbStatus = 'disconnected';
      logger.warn('Database health check failed', error);
    }
    
    const overallStatus = envStatus.valid && dbStatus === 'connected' ? 'ok' : 'degraded';
    
    res.json({ 
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000), // seconds
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        valid: envStatus.valid,
        requiredVars: envStatus.requiredCount,
        missingRequired: envStatus.missingRequired,
        missingRecommended: envStatus.missingRecommended
      },
      services: {
        database: dbStatus,
        port: process.env.PORT || 'default',
      }
    });
  });

  // Create server for the remaining setup
  const { createServer } = await import('http');
  const server = createServer(app);

  // Basic error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Cloud Run and other platforms set PORT. In production, require PORT to be set.
  // In development, default to 5000 for local testing.
  const port = parseInt(
    process.env.PORT ?? 
    (app.get('env') === 'development' ? '5000' : (() => {
      throw new Error("PORT environment variable must be set in production");
    })())
  , 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    endTimer('total-startup');
    logger.info(`Server started successfully`, { port, host: "0.0.0.0", environment: process.env.NODE_ENV });
    log(`serving on port ${port}`); // Keep Vite's log for development
    
    // Setup graceful shutdown handlers with server and database references
    const { db, prisma } = await import("@shared/database");
    setupGracefulShutdown(server, { drizzle: db, prisma });
    
    // Start monitoring service after server is running
    try {
      monitoringService.start();
      logger.info('Monitoring service started');
    } catch (error) {
      logger.error('Failed to start monitoring service', error);
    }
  });
})();
