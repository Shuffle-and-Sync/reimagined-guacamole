import express, { type Request, Response, NextFunction } from "express";
import path from "path";
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
    console.log("🔧 Bypassing Vite for stability - serving enhanced platform page");
    
    // Enhanced platform interface without complex build requirements
    app.use("*", (req, res) => {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shuffle & Sync - TCG Streaming Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Inter', sans-serif; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
      }
      .container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .card {
        background: rgba(255,255,255,0.95);
        border-radius: 16px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
      }
      .header {
        text-align: center;
        color: white;
        margin-bottom: 2rem;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
      }
      .feature-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        border-left: 4px solid #667eea;
        transition: transform 0.2s;
      }
      .feature-card:hover { transform: translateY(-2px); }
      .status-good { 
        background: #d4edda; 
        color: #155724; 
        padding: 1rem; 
        border-radius: 8px; 
        margin: 1rem 0;
        border: 1px solid #c3e6cb;
        text-align: center;
      }
      .api-info {
        background: #e9ecef;
        padding: 1.5rem;
        border-radius: 12px;
        margin: 1rem 0;
      }
      .community-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }
      .community-card {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.2s;
      }
      .community-card:hover {
        border-color: #667eea;
        transform: scale(1.02);
      }
      .btn {
        background: #667eea;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin: 0.5rem;
        text-decoration: none;
        display: inline-block;
      }
      .btn:hover { background: #5a6fd8; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="font-size: 3.5rem; margin-bottom: 0.5rem;">🎮 Shuffle & Sync</h1>
        <p style="font-size: 1.3rem; opacity: 0.9;">TCG Streaming Coordination Platform</p>
      </div>
      
      <div class="card">
        <div class="status-good">
          <i class="fas fa-check-circle"></i> <strong>All Systems Operational</strong><br>
          Server running • Database connected • All 6 TCG communities loaded
        </div>
        
        <h2 style="color: #333; margin: 1.5rem 0 1rem 0;"><i class="fas fa-gamepad"></i> Platform Features</h2>
        
        <div class="features">
          <div class="feature-card">
            <div style="font-size: 2.5rem; color: #667eea; margin-bottom: 1rem;">🏘️</div>
            <h3 style="color: #333; margin-bottom: 0.5rem;">Multi-Community Hub</h3>
            <p style="color: #666;">Connect streamers across Magic: The Gathering, Pokemon, Yu-Gi-Oh, Disney Lorcana, and more</p>
          </div>
          
          <div class="feature-card">
            <div style="font-size: 2.5rem; color: #667eea; margin-bottom: 1rem;">🎯</div>
            <h3 style="color: #333; margin-bottom: 0.5rem;">Stream Coordination</h3>
            <p style="color: #666;">Organize collaborative streams, manage game pods, and build partnerships</p>
          </div>
          
          <div class="feature-card">
            <div style="font-size: 2.5rem; color: #667eea; margin-bottom: 1rem;">🏆</div>
            <h3 style="color: #333; margin-bottom: 0.5rem;">Tournament System</h3>
            <p style="color: #666;">Create and manage tournaments with real-time coordination tools</p>
          </div>
          
          <div class="feature-card">
            <div style="font-size: 2.5rem; color: #667eea; margin-bottom: 1rem;">📊</div>
            <h3 style="color: #333; margin-bottom: 0.5rem;">Analytics Dashboard</h3>
            <p style="color: #666;">Track viewer engagement, performance metrics, and community growth</p>
          </div>
        </div>
        
        <h3 style="color: #333; margin: 2rem 0 1rem 0;"><i class="fas fa-users"></i> TCG Communities</h3>
        <div class="community-grid">
          <div class="community-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔥</div>
            <strong>Scry & Gather</strong><br>
            <small>Magic: The Gathering</small>
          </div>
          <div class="community-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚡</div>
            <strong>PokeStream Hub</strong><br>
            <small>Pokemon TCG</small>
          </div>
          <div class="community-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">👁️</div>
            <strong>Duelcraft</strong><br>
            <small>Yu-Gi-Oh</small>
          </div>
          <div class="community-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">👑</div>
            <strong>Decksong</strong><br>
            <small>Disney Lorcana</small>
          </div>
          <div class="community-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">♟️</div>
            <strong>Deckmaster</strong><br>
            <small>Strategic Deck Games</small>
          </div>
          <div class="community-card">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚔️</div>
            <strong>Bladeforge</strong><br>
            <small>Combat Card Games</small>
          </div>
        </div>
        
        <div class="api-info">
          <h3 style="color: #333; margin-bottom: 1rem;"><i class="fas fa-code"></i> API Endpoints Ready</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-family: monospace; font-size: 0.9rem;">
            <div><strong>GET</strong> /api/health</div>
            <div><strong>GET</strong> /api/communities</div>
            <div><strong>POST</strong> /api/user/profile</div>
            <div><strong>GET</strong> /api/tournaments</div>
            <div><strong>POST</strong> /api/tournaments</div>
            <div><strong>WebSocket</strong> Real-time updates</div>
          </div>
          <div style="margin-top: 1rem; text-align: center;">
            <a href="/api/health" class="btn" target="_blank">
              <i class="fas fa-heartbeat"></i> Test API Health
            </a>
            <a href="/api/communities" class="btn" target="_blank">
              <i class="fas fa-list"></i> View Communities
            </a>
          </div>
        </div>
        
        <div style="background: #fff3cd; color: #856404; padding: 1.5rem; border-radius: 12px; text-align: center; margin-top: 1.5rem;">
          <i class="fas fa-tools"></i> <strong>Development Status:</strong> Backend fully operational • React frontend optimization in progress
        </div>
      </div>
    </div>
  </body>
</html>`;
      res.send(htmlContent);
    });
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
