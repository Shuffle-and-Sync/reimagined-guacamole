import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.apiRequest(req.method, path, res.statusCode, duration, capturedJsonResponse);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Server error: ${message}`, err, { status, url: _req.url, method: _req.method });
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    try {
      console.log("🔧 Attempting Vite setup with timeout...");
      
      // Set up a timeout for Vite initialization
      const viteTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Vite setup timeout')), 15000);
      });
      
      await Promise.race([
        setupVite(app, server),
        viteTimeout
      ]);
      
      console.log("✅ Vite setup completed successfully");
    } catch (error) {
      console.warn("⚠️ Vite setup failed or timed out, falling back to basic static serving");
      
      // Fallback to basic static serving without the full Vite build
      app.use("*", (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Shuffle & Sync - TCG Streaming Platform</title>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
              <div id="root">
                <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                  <h1>🎮 Shuffle & Sync</h1>
                  <p>TCG Streaming Coordination Platform</p>
                  <p>Server is running, but frontend development mode is temporarily disabled.</p>
                  <p>The API endpoints are available for testing.</p>
                </div>
              </div>
            </body>
          </html>
        `);
      });
    }
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
    log(`serving on port ${port}`);
  });
})();
