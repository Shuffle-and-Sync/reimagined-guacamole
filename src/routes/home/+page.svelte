<script lang="ts">
        import { onMount } from 'svelte';
        import { browser } from '$app/environment';
        
        let showSuccessMessage = false;
        
        onMount(() => {
                if (browser) {
                        // Check for success message in URL
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('registered') === 'true') {
                                showSuccessMessage = true;
                                // Clean up URL without success message
                                window.history.replaceState({}, '', '/home');
                        }
                }
        });
</script>

<svelte:head>
        <title>Gaming Hub - Shuffle & Sync</title>
        <meta name="description" content="Welcome to your TCG streaming coordination hub" />
</svelte:head>

<div class="home-page">
        <!-- Navigation -->
        <nav class="nav">
                <div class="logo-nav">
                        🃏 Shuffle <span class="amp-symbol">&</span> Sync
                </div>
                <div class="nav-actions">
                        <a href="/api/auth/logout" class="btn btn-logout">
                                <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                </div>
        </nav>

        <!-- Success Banner -->
        {#if showSuccessMessage}
                <div class="success-banner">
                        <i class="fas fa-check-circle"></i>
                        Welcome to Shuffle & Sync! Your account has been created successfully.
                </div>
        {/if}

        <!-- Hero Section -->
        <div class="hero">
                <h1 class="hero-title">Welcome to Your Gaming Hub!</h1>
                <p class="hero-subtitle">
                        You're now connected to the ultimate TCG streaming coordination platform. 
                        Let's build something amazing together.
                </p>
        </div>

        <!-- Features Grid -->
        <div class="features">
                <div class="feature-card">
                        <div class="feature-icon">🎮</div>
                        <h3 class="feature-title">Game Coordination</h3>
                        <p class="feature-desc">Schedule and coordinate multiplayer TCG matches with streamers worldwide. Real-time sync makes collaboration seamless.</p>
                </div>
                
                <div class="feature-card">
                        <div class="feature-icon">👥</div>
                        <h3 class="feature-title">Community Hub</h3>
                        <p class="feature-desc">Join specialized communities for MTG, Pokemon, Yu-Gi-Oh, Lorcana, and more. Connect with creators who share your passion.</p>
                </div>
                
                <div class="feature-card">
                        <div class="feature-icon">🏆</div>
                        <h3 class="feature-title">Tournaments</h3>
                        <p class="feature-desc">Participate in community tournaments and showcase your skills. Build brackets, manage matches, and celebrate victories.</p>
                </div>
                
                <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3 class="feature-title">Social Integration</h3>
                        <p class="feature-desc">Cross-post content and engage across all your social platforms. Automate your social media strategy for maximum reach.</p>
                </div>
                
                <div class="feature-card">
                        <div class="feature-icon">💬</div>
                        <h3 class="feature-title">Real-time Messaging</h3>
                        <p class="feature-desc">Connect instantly with other creators and coordinate live streams. Build lasting partnerships through direct communication.</p>
                </div>
                
                <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3 class="feature-title">Analytics & Insights</h3>
                        <p class="feature-desc">Track your streaming performance and community engagement. Make data-driven decisions to grow your audience.</p>
                </div>
        </div>
</div>

<style>
        .home-page {
                min-height: 100vh;
                background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 25%, #8B5CF6 75%, #A855F7 100%);
                color: white;
        }
        
        .nav {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255,255,255,0.2);
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
        }
        
        .logo-nav {
                font-family: 'Nunito', sans-serif;
                font-size: 1.5rem;
                font-weight: 800;
                background: linear-gradient(45deg, #fff, #e0e7ff);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
        }
        
        .amp-symbol {
                color: #2DD4BF;
                font-size: 1.7rem;
                margin: 0 0.3rem;
        }
        
        .btn-logout {
                background: rgba(239, 68, 68, 0.8);
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-weight: 500;
                text-decoration: none;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
        }
        
        .btn-logout:hover {
                background: rgba(239, 68, 68, 1);
                transform: translateY(-1px);
        }
        
        .success-banner {
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.5);
                padding: 1rem 2rem;
                text-align: center;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
        }
        
        .hero {
                text-align: center;
                padding: 4rem 2rem;
                max-width: 1200px;
                margin: 0 auto;
        }
        
        .hero-title {
                font-size: 3rem;
                font-weight: 900;
                margin-bottom: 1rem;
                font-family: 'Nunito', sans-serif;
                background: linear-gradient(45deg, #fff, #e0e7ff, #ddd6fe);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: pulse 2s infinite;
        }
        
        .hero-subtitle {
                font-size: 1.25rem;
                opacity: 0.9;
                margin-bottom: 3rem;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
                line-height: 1.6;
        }
        
        .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
        }
        
        .feature-card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.2);
                padding: 2rem;
                text-align: center;
                transition: all 0.3s ease;
        }
        
        .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        .feature-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                opacity: 0.8;
        }
        
        .feature-title {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
                font-family: 'Nunito', sans-serif;
        }
        
        .feature-desc {
                opacity: 0.8;
                line-height: 1.6;
        }
        
        @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
        }
        
        @media (max-width: 768px) {
                .nav {
                        flex-direction: column;
                        gap: 1rem;
                }
                
                .hero-title {
                        font-size: 2rem;
                }
                
                .features {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                }
        }
</style>