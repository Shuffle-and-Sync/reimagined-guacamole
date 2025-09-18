import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./logger";

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

// Import Auth.js routes
import authRouter from "./auth/auth.routes";

const app = express();

// Trust proxy for correct x-forwarded-* headers (required for Auth.js host validation)
app.set('trust proxy', true);

// Basic middleware - body parsers MUST come before Auth.js routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up Auth.js routes AFTER body parsers so req.body is populated
app.use(authRouter);

// Apply security headers (including CSP) before other routes
app.use(securityHeaders);

(async () => {

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

  // Health check route (keep this simple route here)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server started successfully`, { port, host: "0.0.0.0", environment: process.env.NODE_ENV });
    log(`serving on port ${port}`); // Keep Vite's log for development
  });
})();
