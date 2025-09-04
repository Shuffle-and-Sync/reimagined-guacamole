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

  // For development: redirect to SvelteKit dev server for frontend routes
  app.use("*", (req, res) => {
    const path = req.path;
    
    // If this looks like a frontend route (not API), show development message
    if (!path.startsWith('/api/')) {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shuffle & Sync - TCG Streaming Coordination Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #4C63D2 0%, #7C3AED 35%, #2DD4BF 70%, #10B981 100%);
            background-attachment: fixed;
            min-height: 100vh;
            color: white;
            line-height: 1.6;
        }
        
        /* TCG Card-inspired background */
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: 
                radial-gradient(circle at 20% 30%, rgba(45, 212, 191, 0.15) 0%, transparent 60%),
                radial-gradient(circle at 80% 70%, rgba(124, 58, 237, 0.12) 0%, transparent 60%),
                radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
            background-size: 400px 400px, 350px 350px, 300px 300px;
            z-index: 0;
        }
        
        .container {
            position: relative; z-index: 10;
            max-width: 1200px; margin: 0 auto; padding: 1.5rem;
        }
        
        .nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1.5rem 0; margin-bottom: 1rem;
        }
        
        .logo-nav {
            font-family: 'Nunito', sans-serif; font-size: 1.8rem; font-weight: 800;
            color: white; text-decoration: none; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .logo-nav .amp-symbol { color: #2DD4BF; margin: 0 0.2rem; font-size: 2rem; }
        
        .header { text-align: center; padding: 2rem 0 4rem 0; }
        
        .hero-badge {
            display: inline-block;
            background: linear-gradient(45deg, #2DD4BF, #10B981);
            border: 2px solid rgba(255,255,255,0.25); border-radius: 20px;
            padding: 0.6rem 1.8rem; font-size: 0.95rem; font-weight: 600;
            margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(45, 212, 191, 0.25);
            font-family: 'Nunito', sans-serif;
        }
        
        .hero-title {
            font-family: 'Nunito', sans-serif; font-size: 4.2rem; font-weight: 900;
            margin-bottom: 1.5rem; line-height: 1.1;
            background: linear-gradient(135deg, #ffffff 0%, #2DD4BF 40%, #7C3AED 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            -webkit-text-stroke: 2px rgba(255, 255, 255, 0.6);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .hero-subtitle {
            font-size: 1.3rem; margin-bottom: 3rem; opacity: 0.95; font-weight: 500;
            max-width: 700px; margin-left: auto; margin-right: auto;
        }
        
        .cta-buttons {
            display: flex; gap: 1.2rem; justify-content: center; margin-bottom: 4rem; flex-wrap: wrap;
        }
        
        .btn {
            padding: 1rem 2.5rem; border: none; border-radius: 10px;
            font-weight: 700; font-size: 1.1rem; cursor: pointer;
            transition: all 0.3s ease; text-decoration: none;
            display: inline-flex; align-items: center; gap: 0.6rem;
            font-family: 'Nunito', sans-serif;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #10B981, #2DD4BF);
            color: white; box-shadow: 0 5px 15px rgba(16, 185, 129, 0.35);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px); box-shadow: 0 7px 20px rgba(16, 185, 129, 0.45);
        }
        
        .btn-secondary {
            background: rgba(255,255,255,0.12); color: white;
            border: 2px solid rgba(255,255,255,0.3); backdrop-filter: blur(15px);
        }
        
        .btn-secondary:hover {
            background: rgba(255,255,255,0.2); transform: translateY(-2px);
            border-color: rgba(45, 212, 191, 0.5);
        }
        
        .communities-section {
            background: rgba(255,255,255,0.08); border-radius: 18px;
            padding: 3rem; margin: 4rem 0;
            border: 1px solid rgba(255,255,255,0.15);
            backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .communities-title {
            text-align: center; font-size: 2.8rem; font-weight: 800;
            margin-bottom: 1rem; font-family: 'Nunito', sans-serif;
            background: linear-gradient(135deg, #2DD4BF, #7C3AED);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            -webkit-text-stroke: 2px rgba(255, 255, 255, 0.6);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .communities-subtitle {
            text-align: center; font-size: 1.2rem; opacity: 0.9;
            margin-bottom: 3rem; max-width: 650px;
            margin-left: auto; margin-right: auto; font-weight: 500;
        }
        
        .communities-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem; margin-top: 2rem;
        }
        
        .community-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
            color: white; border-radius: 14px; padding: 2.5rem 2rem;
            text-align: center; border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease; cursor: pointer;
            backdrop-filter: blur(15px); box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .community-card:hover {
            transform: translateY(-6px);
            background: linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08));
            border-color: rgba(45, 212, 191, 0.4);
            box-shadow: 0 12px 35px rgba(45, 212, 191, 0.15);
        }
        
        .community-icon {
            font-size: 3rem; margin-bottom: 1.2rem; display: block;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
        }
        
        .community-name {
            font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;
            font-family: 'Nunito', sans-serif;
        }
        
        .community-game { opacity: 0.85; font-size: 1rem; font-weight: 500; }
        
        .features-section { margin: 5rem 0; text-align: center; }
        
        .features-title {
            font-size: 2.8rem; font-weight: 800; margin-bottom: 1rem;
            font-family: 'Nunito', sans-serif;
            background: linear-gradient(135deg, #4C63D2, #2DD4BF);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            -webkit-text-stroke: 2px rgba(255, 255, 255, 0.6);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .features-subtitle {
            font-size: 1.2rem; opacity: 0.9; margin-bottom: 3rem;
            max-width: 650px; margin-left: auto; margin-right: auto; font-weight: 500;
        }
        
        .features-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;
        }
        
        .feature-card {
            text-align: center; padding: 2.5rem 2rem;
            background: rgba(255,255,255,0.08); border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.15); transition: all 0.3s ease;
            backdrop-filter: blur(15px); box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .feature-card:hover {
            background: rgba(255,255,255,0.12); transform: translateY(-4px);
            border-color: rgba(45, 212, 191, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }
        
        .feature-icon {
            font-size: 2.8rem; margin-bottom: 1.5rem; color: #2DD4BF;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
        }
        
        .feature-title {
            font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;
            font-family: 'Nunito', sans-serif;
        }
        
        .feature-desc {
            opacity: 0.9; line-height: 1.6; font-size: 1.05rem; font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .hero-title { font-size: 3.2rem; }
            .hero-subtitle { font-size: 1.15rem; }
            .communities-title, .features-title { font-size: 2.2rem; }
            .communities-grid, .features-grid { grid-template-columns: 1fr; gap: 1.5rem; }
            .btn { width: 100%; max-width: 320px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <nav class="nav">
            <a href="/" class="logo-nav">Shuffle <span class="amp-symbol">&</span> Sync</a>
        </nav>
        
        <header class="header">
            <div class="hero-badge">
                <i class="fas fa-cards-blank" style="margin-right: 0.5rem;"></i>
                Trading Card Game Streamers Unite
            </div>
            
            <h1 class="hero-title">Shuffle & Sync</h1>
            <p class="hero-subtitle">Draw your perfect hand with fellow TCG streamers! Coordinate deck battles, build your streaming strategy, and create legendary gameplay moments together.</p>
            
            <div class="cta-buttons">
                <a href="/api/login" class="btn btn-primary">
                    <i class="fas fa-hand-sparkles"></i> Draw Your Hand
                </a>
                <button class="btn btn-secondary" onclick="alert('🎮 Demo coming soon! Join us to be first to experience the platform.')">
                    <i class="fas fa-play"></i> See the Deck
                </button>
            </div>
        </header>
        
        <section class="communities-section">
            <h2 class="communities-title">🃏 TCG Communities</h2>
            <p class="communities-subtitle">Join your deck archetype and connect with streamers in your favorite card realms</p>
            <div class="communities-grid">
                <div class="community-card" onclick="alert('🔥 Scry & Gather community! Magic awaits.')">
                    <div class="community-icon">🔥</div>
                    <div class="community-name">Scry & Gather</div>
                    <div class="community-game">Magic: The Gathering</div>
                </div>
                <div class="community-card" onclick="alert('⚡ PokeStream Hub! Gotta catch em all.')">
                    <div class="community-icon">⚡</div>
                    <div class="community-name">PokeStream Hub</div>
                    <div class="community-game">Pokemon TCG</div>
                </div>
                <div class="community-card" onclick="alert('👁️ Duelcraft community! Time to duel.')">
                    <div class="community-icon">👁️</div>
                    <div class="community-name">Duelcraft</div>
                    <div class="community-game">Yu-Gi-Oh!</div>
                </div>
                <div class="community-card" onclick="alert('👑 Decksong community! Disney magic awaits.')">
                    <div class="community-icon">👑</div>
                    <div class="community-name">Decksong</div>
                    <div class="community-game">Disney Lorcana</div>
                </div>
                <div class="community-card" onclick="alert('♟️ Deckmaster community! Strategic mastery.')">
                    <div class="community-icon">♟️</div>
                    <div class="community-name">Deckmaster</div>
                    <div class="community-game">Strategic Games</div>
                </div>
                <div class="community-card" onclick="alert('⚔️ Bladeforge community! Combat ready.')">
                    <div class="community-icon">⚔️</div>
                    <div class="community-name">Bladeforge</div>
                    <div class="community-game">Combat Cards</div>
                </div>
            </div>
        </section>
        
        <section class="features-section">
            <h2 class="features-title">🎯 Deck Builder Tools</h2>
            <p class="features-subtitle">Master your streaming strategy with powerful TCG coordination features</p>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-layer-group"></i></div>
                    <h3 class="feature-title">Deck Sync</h3>
                    <p class="feature-desc">Coordinate multi-streamer pod matches, synchronize your deck reveals, and create epic collaborative gameplay that keeps viewers on the edge of their seats.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-trophy"></i></div>
                    <h3 class="feature-title">Tournament Commander</h3>
                    <p class="feature-desc">Host legendary tournaments with automatic bracket generation, real-time match tracking, and viewer prediction games that boost engagement.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-users"></i></div>
                    <h3 class="feature-title">Community Hub</h3>
                    <p class="feature-desc">Build thriving communities around your favorite card games with forums, events, and collaborative discussions that bring players together.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-handshake"></i></div>
                    <h3 class="feature-title">Creator Network</h3>
                    <p class="feature-desc">Connect with fellow TCG content creators, find perfect collaboration partners, and build your streaming guild across all card game formats.</p>
                </div>
            </div>
        </section>
    </div>
</body>
</html>
    `);
    }
  });

  console.log("🃏 Serving beautiful TCG-themed Shuffle & Sync landing page");

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
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

