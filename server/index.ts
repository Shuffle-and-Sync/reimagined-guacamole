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

  // Serve fun gaming-focused Shuffle & Sync landing page
  console.log("🎮 Serving fun gaming-focused Shuffle & Sync landing page");
  app.use("*", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shuffle & Sync - TCG Streaming Coordination Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #8B5DFF 0%, #FF6B9D 50%, #FFB85C 100%);
            background-attachment: fixed;
            min-height: 100vh;
            color: white;
            line-height: 1.6;
        }
        
        /* Fun gaming background */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(255, 107, 157, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(139, 93, 255, 0.1) 0%, transparent 50%);
            z-index: 0;
        }
        
        .container {
            position: relative;
            z-index: 10;
            max-width: 1200px;
            margin: 0 auto;
            padding: 1.5rem;
        }
        
        /* Gaming Navigation */
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 0;
            margin-bottom: 1rem;
        }
        
        .logo-nav {
            font-family: 'Poppins', sans-serif;
            font-size: 1.8rem;
            font-weight: 800;
            color: white;
            text-decoration: none;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .logo-nav .amp-symbol {
            color: #FFB85C;
            margin: 0 0.2rem;
            font-size: 2rem;
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 2rem 0 4rem 0;
        }
        
        /* Fun gaming hero section */
        .hero-badge {
            display: inline-block;
            background: linear-gradient(45deg, #FF6B9D, #8B5DFF);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 25px;
            padding: 0.6rem 1.8rem;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 2rem;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
            font-family: 'Poppins', sans-serif;
        }
        
        .hero-title {
            font-family: 'Poppins', sans-serif;
            font-size: 4.2rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, #ffffff 0%, #FFB85C 50%, #FF6B9D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .hero-subtitle {
            font-size: 1.3rem;
            margin-bottom: 3rem;
            opacity: 0.95;
            font-weight: 500;
            max-width: 650px;
            margin-left: auto;
            margin-right: auto;
        }
        
        /* Gaming CTA buttons */
        .cta-buttons {
            display: flex;
            gap: 1.2rem;
            justify-content: center;
            margin-bottom: 4rem;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 1.1rem 2.5rem;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            font-family: 'Poppins', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #FF6B9D, #8B5DFF);
            color: white;
            box-shadow: 0 6px 20px rgba(255, 107, 157, 0.4);
        }
        
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(255, 107, 157, 0.6);
        }
        
        .btn-secondary {
            background: rgba(255,255,255,0.15);
            color: white;
            border: 2px solid rgba(255,255,255,0.4);
            backdrop-filter: blur(15px);
        }
        
        .btn-secondary:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-3px);
            border-color: rgba(255,255,255,0.6);
        }
        
        /* Gaming Communities Section */
        .communities-section {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 3rem;
            margin: 4rem 0;
            border: 2px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .communities-title {
            text-align: center;
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #FFB85C, #FF6B9D);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .communities-subtitle {
            text-align: center;
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 500;
        }
        
        .communities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .community-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
            color: white;
            border-radius: 16px;
            padding: 2.5rem 2rem;
            text-align: center;
            border: 2px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
            cursor: pointer;
            backdrop-filter: blur(15px);
            position: relative;
            overflow: hidden;
        }
        
        .community-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: rotate(45deg);
            transition: all 0.6s ease;
            opacity: 0;
        }
        
        .community-card:hover::before {
            opacity: 1;
            transform: rotate(45deg) translate(50%, 50%);
        }
        
        .community-card:hover {
            transform: translateY(-8px);
            background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
            border-color: #FFB85C;
            box-shadow: 0 15px 40px rgba(255, 184, 92, 0.2);
        }
        
        .community-icon {
            font-size: 3rem;
            margin-bottom: 1.2rem;
            display: block;
            position: relative;
            z-index: 2;
        }
        
        .community-name {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            font-family: 'Poppins', sans-serif;
            position: relative;
            z-index: 2;
        }
        
        .community-game {
            opacity: 0.85;
            font-size: 1rem;
            font-weight: 500;
            position: relative;
            z-index: 2;
        }
        
        /* Gaming Features */
        .features-section {
            margin: 5rem 0;
            text-align: center;
        }
        
        .features-title {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #8B5DFF, #FF6B9D);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .features-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 500;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .feature-card {
            text-align: center;
            padding: 2.5rem 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 16px;
            border: 2px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
            backdrop-filter: blur(15px);
        }
        
        .feature-card:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-5px);
            border-color: rgba(255, 184, 92, 0.5);
            box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
            color: #FFB85C;
        }
        
        .feature-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            font-family: 'Poppins', sans-serif;
        }
        
        .feature-desc {
            opacity: 0.9;
            line-height: 1.6;
            font-size: 1.05rem;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .nav { padding: 1rem 0; margin-bottom: 1rem; }
            .logo-nav { font-size: 1.5rem; }
            .header { padding: 1.5rem 0 3rem 0; }
            .hero-title { font-size: 3.2rem; line-height: 1.1; }
            .hero-subtitle { font-size: 1.15rem; }
            .cta-buttons { flex-direction: column; gap: 1rem; align-items: center; }
            .btn { width: 100%; justify-content: center; max-width: 320px; padding: 1.2rem 2rem; }
            .communities-section { padding: 2rem 1.5rem; margin: 3rem 0; }
            .communities-title, .features-title { font-size: 2.2rem; }
            .communities-grid, .features-grid { grid-template-columns: 1fr; gap: 1.5rem; }
            .features-section { margin: 3rem 0; }
            .feature-card { padding: 2rem 1.5rem; }
            .community-card { padding: 2rem 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Navigation -->
        <nav class="nav">
            <a href="/" class="logo-nav">
                Shuffle <span class="amp-symbol">&</span> Sync
            </a>
        </nav>
        
        <header class="header">
            <div class="hero-badge">
                <i class="fas fa-gamepad" style="margin-right: 0.5rem;"></i>
                Epic TCG Streaming Platform
            </div>
            
            <h1 class="hero-title">Shuffle & Sync</h1>
            <p class="hero-subtitle">Unite with fellow TCG streamers, coordinate epic battles, and build legendary gaming communities that viewers love to watch!</p>
            
            <div class="cta-buttons">
                <a href="/api/login" class="btn btn-primary" data-testid="button-get-started">
                    <i class="fas fa-rocket"></i>
                    Join the Fun
                </a>
                <button class="btn btn-secondary" onclick="showDemo()" data-testid="button-watch-demo">
                    <i class="fas fa-play"></i>
                    See It Live
                </button>
            </div>
        </header>
        
        <section class="communities-section">
            <h2 class="communities-title">🎮 Game Communities</h2>
            <p class="communities-subtitle">Join streamers and players across all your favorite trading card games</p>
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
            <h2 class="features-title">🚀 Epic Features</h2>
            <p class="features-subtitle">Everything you need to level up your TCG streaming game</p>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-video"></i></div>
                    <h3 class="feature-title">Stream Squad</h3>
                    <p class="feature-desc">Team up with other streamers, coordinate epic multi-player battles, and create unforgettable collaborative content your viewers will love.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-trophy"></i></div>
                    <h3 class="feature-title">Tournament Mode</h3>
                    <p class="feature-desc">Host awesome tournaments with automatic brackets, live scoring, and viewer participation features that make every match exciting.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
                    <h3 class="feature-title">Growth Tracker</h3>
                    <p class="feature-desc">See your community grow with fun analytics that show viewer engagement, popular moments, and which games drive the most excitement.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-users"></i></div>
                    <h3 class="feature-title">Creator Hub</h3>
                    <p class="feature-desc">Connect with amazing TCG streamers, discover collaboration opportunities, and build lasting friendships in the gaming community.</p>
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

