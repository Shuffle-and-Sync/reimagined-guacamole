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

  // Serve clean chibi-inspired Shuffle & Sync landing page
  console.log("🎮 Serving clean chibi-inspired Shuffle & Sync landing page");
  app.use("*", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shuffle & Sync - TCG Streaming Coordination Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #5B6BCF;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%);
            min-height: 100vh;
            color: white;
            position: relative;
        }
        
        /* Subtle background pattern */
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 60px 60px, 40px 40px;
            opacity: 0.5;
            z-index: 0;
        }
        
        .container {
            position: relative;
            z-index: 10;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 3rem 0 4rem 0;
        }
        
        /* Chibi Card Characters */
        .mascot-section {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin: 3rem 0;
        }
        
        .mascot-card {
            position: relative;
            width: 120px;
            height: 160px;
            border-radius: 15px;
            border: 4px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .mascot-left {
            background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
            transform: rotate(-5deg);
        }
        
        .mascot-right {
            background: linear-gradient(135deg, #a78bfa, #c4b5fd);
            transform: rotate(5deg);
        }
        
        .live-banner {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #fbbf24, #f59e0b);
            color: white;
            padding: 0.3rem 1rem;
            border-radius: 20px;
            font-family: 'Fredoka', sans-serif;
            font-weight: 600;
            font-size: 0.8rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        
        .high-five {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            z-index: 5;
        }
        
        /* Main Logo Text */
        .hero-title {
            font-family: 'Fredoka', sans-serif;
            font-size: 4.5rem;
            font-weight: 700;
            margin: 2rem 0 1rem 0;
            color: #FBD38D;
            text-shadow: 
                4px 4px 0px #2D3748,
                4px 4px 10px rgba(0,0,0,0.5);
            letter-spacing: -2px;
        }
        
        .hero-subtitle {
            font-size: 1.3rem;
            margin-bottom: 3rem;
            opacity: 0.95;
            font-weight: 500;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.6;
        }
        
        /* Simple CTA buttons */
        .cta-buttons {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            margin-bottom: 4rem;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 1rem 2.5rem;
            border: none;
            border-radius: 25px;
            font-weight: 600;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: 'Fredoka', sans-serif;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #38a169, #48bb78);
            color: white;
            box-shadow: 0 4px 15px rgba(56, 161, 105, 0.4);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(56, 161, 105, 0.6);
        }
        
        .btn-secondary {
            background: rgba(255,255,255,0.9);
            color: #2D3748;
            border: 2px solid white;
        }
        
        .btn-secondary:hover {
            background: white;
            transform: translateY(-2px);
        }
        
        /* Communities Section */
        .communities-section {
            background: rgba(255,255,255,0.15);
            border-radius: 20px;
            padding: 2.5rem;
            margin: 3rem 0;
            border: 3px solid rgba(255,255,255,0.2);
        }
        
        .communities-title {
            text-align: center;
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 2rem;
            color: #FBD38D;
            font-family: 'Fredoka', sans-serif;
        }
        
        .communities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .community-card {
            background: white;
            color: #2D3748;
            border-radius: 15px;
            padding: 1.5rem;
            text-align: center;
            border: 3px solid rgba(255,255,255,0.8);
            transition: all 0.2s ease;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .community-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            border-color: #FBD38D;
        }
        
        .community-icon {
            font-size: 2.5rem;
            margin-bottom: 0.8rem;
            display: block;
        }
        
        .community-name {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.3rem;
            font-family: 'Fredoka', sans-serif;
        }
        
        .community-game {
            opacity: 0.7;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        /* Features */
        .features-section {
            margin: 3rem 0;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
        }
        
        .feature-card {
            text-align: center;
            padding: 1.5rem;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .feature-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.8rem;
            font-family: 'Fredoka', sans-serif;
        }
        
        .feature-desc {
            opacity: 0.9;
            line-height: 1.5;
            font-size: 0.95rem;
        }
        
        @media (max-width: 768px) {
            .hero-title { font-size: 3rem; letter-spacing: -1px; }
            .hero-subtitle { font-size: 1.1rem; }
            .cta-buttons { flex-direction: column; align-items: center; }
            .mascot-section { gap: 1rem; }
            .mascot-card { width: 100px; height: 130px; font-size: 3rem; }
            .high-five { font-size: 1.5rem; }
            .communities-grid { grid-template-columns: 1fr; }
            .features-grid { grid-template-columns: 1fr; }
            .container { padding: 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <!-- Chibi Card Mascots -->
            <div class="mascot-section">
                <div class="mascot-card mascot-left">
                    <div class="live-banner">LIVE</div>
                    😊
                </div>
                <div class="high-five">✨🙌✨</div>
                <div class="mascot-card mascot-right">
                    <div class="live-banner">LIVE</div>
                    😎
                </div>
            </div>
            
            <h1 class="hero-title">Shuffle & Sync</h1>
            <p class="hero-subtitle">Unite TCG streamers, coordinate epic battles, and build legendary gaming communities together!</p>
            
            <div class="cta-buttons">
                <a href="/api/login" class="btn btn-primary" data-testid="button-get-started">
                    <i class="fas fa-rocket"></i>
                    Get Started Free
                </a>
                <button class="btn btn-secondary" onclick="showDemo()" data-testid="button-watch-demo">
                    <i class="fas fa-play"></i>
                    Watch Demo
                </button>
            </div>
        </header>
        
        <section class="communities-section">
            <h2 class="communities-title">
                <i class="fas fa-users" style="color: #fbbf24; margin-right: 0.5rem;"></i>
                TCG Communities
            </h2>
            <div class="communities-grid">
                <div class="community-card" onclick="selectCommunity('mtg')" data-testid="card-community-mtg">
                    <div class="community-icon">🔥</div>
                    <div class="community-name">Scry & Gather</div>
                    <div class="community-game">Magic: The Gathering</div>
                </div>
                <div class="community-card" onclick="selectCommunity('pokemon')" data-testid="card-community-pokemon">
                    <div class="community-icon">⚡</div>
                    <div class="community-name">PokeStream Hub</div>
                    <div class="community-game">Pokemon TCG</div>
                </div>
                <div class="community-card" onclick="selectCommunity('yugioh')" data-testid="card-community-yugioh">
                    <div class="community-icon">👁️</div>
                    <div class="community-name">Duelcraft</div>
                    <div class="community-game">Yu-Gi-Oh!</div>
                </div>
                <div class="community-card" onclick="selectCommunity('lorcana')" data-testid="card-community-lorcana">
                    <div class="community-icon">👑</div>
                    <div class="community-name">Decksong</div>
                    <div class="community-game">Disney Lorcana</div>
                </div>
                <div class="community-card" onclick="selectCommunity('strategic')" data-testid="card-community-strategic">
                    <div class="community-icon">♟️</div>
                    <div class="community-name">Deckmaster</div>
                    <div class="community-game">Strategic Games</div>
                </div>
                <div class="community-card" onclick="selectCommunity('combat')" data-testid="card-community-combat">
                    <div class="community-icon">⚔️</div>
                    <div class="community-name">Bladeforge</div>
                    <div class="community-game">Combat Cards</div>
                </div>
            </div>
        </section>
        
        <section class="features-section">
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <h3 class="feature-title">Stream Coordination</h3>
                    <p class="feature-desc">Organize collaborative streams, manage game pods, and coordinate epic TCG battles with real-time tools.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🏆</div>
                    <h3 class="feature-title">Tournament System</h3>
                    <p class="feature-desc">Create and manage tournaments with bracket generation, live scoring, and viewer engagement features.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3 class="feature-title">Community Analytics</h3>
                    <p class="feature-desc">Track viewer engagement, community growth, and streaming performance across all TCG platforms.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🤝</div>
                    <h3 class="feature-title">Creator Network</h3>
                    <p class="feature-desc">Connect with fellow TCG streamers, build partnerships, and grow your community together.</p>
                </div>
            </div>
        </section>
    </div>
    
    <script>
        function handleGetStarted() {
            window.location.href = '/api/login';
        }
        
        function showDemo() {
            alert('🎮 Demo coming soon! Join us to be first to experience the platform.');
        }
        
        function selectCommunity(community) {
            console.log('Selected community:', community);
            // Future: This will transform the entire platform theme
            // For MTG: Transform to "Scry & Gather" with dark navy/red/green theme
            alert(\`✨ \${community.toUpperCase()} community selected! Community-specific theming coming soon.\`);
        }
    </script>
</body>
</html>
    `);
  });

  
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

