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

  // Serve redesigned Shuffle & Sync landing page
  console.log("🎮 Serving redesigned Shuffle & Sync landing page");
  app.use("*", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shuffle & Sync - TCG Streaming Coordination Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #a855f7 50%, #c084fc 75%, #e879f9 100%);
            min-height: 100vh;
            color: white;
            overflow-x: hidden;
        }
        
        /* Animated background elements */
        .bg-animation {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }
        
        .floating-card {
            position: absolute;
            width: 60px;
            height: 80px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            animation: float 8s ease-in-out infinite;
        }
        
        .floating-card:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
        .floating-card:nth-child(2) { top: 70%; left: 20%; animation-delay: 2s; }
        .floating-card:nth-child(3) { top: 40%; right: 15%; animation-delay: 4s; }
        .floating-card:nth-child(4) { bottom: 30%; right: 25%; animation-delay: 1s; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(-2deg); }
            50% { transform: translateY(-30px) rotate(2deg); }
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
            padding: 4rem 0;
        }
        
        /* Logo */
        .logo-container {
            margin: 2rem 0;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .logo {
            background: linear-gradient(45deg, #f59e0b, #fbbf24, #f59e0b);
            border-radius: 20px;
            padding: 2rem 3rem;
            box-shadow: 0 10px 40px rgba(245, 158, 11, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .logo::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
        }
        
        @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%); }
            50% { transform: translateX(100%) translateY(100%); }
            100% { transform: translateX(-100%) translateY(-100%); }
        }
        
        .logo-text {
            font-size: 3.5rem;
            font-weight: 900;
            color: white;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
        }
        
        .amp-symbol {
            font-size: 4rem;
            margin: 0 0.3rem;
            color: #1f2937;
            filter: drop-shadow(2px 2px 4px rgba(255,255,255,0.5));
        }
        
        /* Main content */
        .hero-title {
            font-size: 4.5rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, #fbbf24, #f59e0b, #fbbf24);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero-subtitle {
            font-size: 1.6rem;
            margin-bottom: 3rem;
            opacity: 0.9;
            font-weight: 500;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .cta-buttons {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            margin-bottom: 5rem;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 1.2rem 3rem;
            border: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.7rem;
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .btn:hover::before {
            left: 100%;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #10b981, #059669);
            color: white;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
        }
        
        .btn-secondary {
            background: rgba(255,255,255,0.15);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            backdrop-filter: blur(15px);
        }
        
        .btn-secondary:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-3px);
        }
        
        /* Communities Grid */
        .communities-section {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 3rem;
            margin: 3rem 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .communities-title {
            text-align: center;
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 2rem;
        }
        
        .communities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .community-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .community-card:hover {
            transform: translateY(-8px);
            background: rgba(255,255,255,0.2);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .community-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .community-name {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .community-game {
            opacity: 0.8;
            font-size: 1rem;
        }
        
        /* Features */
        .features-section {
            margin: 4rem 0;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }
        
        .feature-card {
            text-align: center;
            padding: 2rem;
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .feature-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .feature-desc {
            opacity: 0.8;
            line-height: 1.6;
        }
        
        @media (max-width: 768px) {
            .hero-title { font-size: 2.5rem; }
            .hero-subtitle { font-size: 1.2rem; }
            .cta-buttons { flex-direction: column; align-items: center; }
            .hexagonal-logo { width: 150px; height: 150px; }
            .logo-content { font-size: 2rem; }
            .amp-symbol { font-size: 3rem; }
        }
    </style>
</head>
<body>
    <div class="bg-animation">
        <div class="floating-card"></div>
        <div class="floating-card"></div>
        <div class="floating-card"></div>
        <div class="floating-card"></div>
    </div>
    
    <div class="container">
        <header class="header">
            <div class="logo-container">
                <div class="logo">
                    <div class="logo-text">
                        S <span class="amp-symbol">&</span> S
                    </div>
                </div>
            </div>
            
            <h1 class="hero-title">Shuffle & Sync</h1>
            <p class="hero-subtitle">The ultimate platform for TCG streamers to coordinate epic gameplay, build communities, and create unforgettable streaming experiences together.</p>
            
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
        
        // Add some interactive sparkle effects
        function createSparkle() {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'absolute';
            sparkle.style.width = '4px';
            sparkle.style.height = '4px';
            sparkle.style.background = '#fbbf24';
            sparkle.style.borderRadius = '50%';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.left = Math.random() * window.innerWidth + 'px';
            sparkle.style.top = Math.random() * window.innerHeight + 'px';
            sparkle.style.animation = 'sparkle 2s ease-out forwards';
            document.body.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 2000);
        }
        
        const sparkleStyle = document.createElement('style');
        sparkleStyle.textContent = \`
            @keyframes sparkle {
                0% { opacity: 1; transform: scale(0); }
                50% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(0); }
            }
        \`;
        document.head.appendChild(sparkleStyle);
        
        // Create sparkles every few seconds
        setInterval(createSparkle, 3000);
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

