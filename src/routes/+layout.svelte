<script lang="ts">
        import '../app.css';
        import { page } from '$app/stores';
        import { onMount } from 'svelte';
        
        let mobileMenuOpen = false;
        
        // Navigation items
        const navItems = [
                { href: '/', icon: 'fas fa-home', label: 'Home', description: 'Platform overview' },
                { href: '/dashboard', icon: 'fas fa-th-large', label: 'Dashboard', description: 'Your personal hub' },
                { href: '/tournaments', icon: 'fas fa-trophy', label: 'Tournaments', description: 'Competitive play' },
                { href: '/matchmaking', icon: 'fas fa-crosshairs', label: 'Matchmaking', description: 'Find opponents' },
                { href: '/messages', icon: 'fas fa-comments', label: 'Messages', description: 'Direct messaging' },
                { href: '/social', icon: 'fas fa-share-alt', label: 'Social', description: 'Content sharing' },
                { href: '/forums', icon: 'fas fa-users', label: 'Forums', description: 'Community discussions' },
                { href: '/calendar', icon: 'fas fa-calendar', label: 'Calendar', description: 'Events & scheduling' },
                { href: '/game-room', icon: 'fas fa-gamepad', label: 'Game Room', description: 'Live gameplay' },
                { href: '/profile', icon: 'fas fa-user', label: 'Profile', description: 'Your gaming profile' },
                { href: '/settings', icon: 'fas fa-cog', label: 'Settings', description: 'Account preferences' }
        ];
        
        // Check if current page matches path
        function isActive(href: string): boolean {
                if (href === '/') return $page.url.pathname === '/';
                return $page.url.pathname.startsWith(href);
        }
        
        // Close mobile menu when navigating
        $: if ($page.url) {
                mobileMenuOpen = false;
        }
        
        function toggleMobileMenu() {
                mobileMenuOpen = !mobileMenuOpen;
        }
</script>

<!-- Global Navigation -->
<nav class="main-nav">
        <div class="nav-container">
                <!-- Logo -->
                <a href="/" class="nav-logo">
                        <span class="logo-text">Shuffle <span class="amp-symbol">&</span> Sync</span>
                </a>
                
                <!-- Desktop Navigation -->
                <div class="nav-links-desktop">
                        {#each navItems as item}
                                <a 
                                        href={item.href} 
                                        class="nav-link"
                                        class:active={isActive(item.href)}
                                        title={item.description}
                                >
                                        <i class="{item.icon}"></i>
                                        <span>{item.label}</span>
                                </a>
                        {/each}
                </div>
                
                <!-- Mobile Menu Toggle -->
                <button class="mobile-menu-toggle" on:click={toggleMobileMenu}>
                        <i class={mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                </button>
        </div>
        
        <!-- Mobile Navigation Menu -->
        {#if mobileMenuOpen}
                <div class="mobile-nav-menu">
                        <div class="mobile-nav-content">
                                {#each navItems as item}
                                        <a 
                                                href={item.href} 
                                                class="mobile-nav-link"
                                                class:active={isActive(item.href)}
                                        >
                                                <i class="{item.icon}"></i>
                                                <div class="mobile-nav-text">
                                                        <span class="mobile-nav-label">{item.label}</span>
                                                        <span class="mobile-nav-desc">{item.description}</span>
                                                </div>
                                        </a>
                                {/each}
                        </div>
                </div>
        {/if}
</nav>

<!-- Page Content -->
<main class="page-content" class:mobile-menu-open={mobileMenuOpen}>
        <slot />
</main>

<style>
        /* Main Navigation */
        .main-nav {
                position: sticky;
                top: 0;
                z-index: 1000;
                background: linear-gradient(135deg, rgba(76, 99, 210, 0.95), rgba(124, 58, 237, 0.95));
                backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nav-container {
                max-width: 1400px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 1.5rem;
                height: 70px;
        }
        
        /* Logo */
        .nav-logo {
                text-decoration: none;
                color: white;
                font-family: 'Nunito', sans-serif;
                font-weight: 800;
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .amp-symbol {
                color: #2DD4BF;
                font-size: 1.8rem;
                margin: 0 0.2rem;
        }
        
        /* Desktop Navigation */
        .nav-links-desktop {
                display: flex;
                align-items: center;
                gap: 0.5rem;
        }
        
        .nav-link {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 1rem;
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                font-weight: 500;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                position: relative;
        }
        
        .nav-link:hover {
                background: rgba(255, 255, 255, 0.15);
                color: white;
                transform: translateY(-1px);
        }
        
        .nav-link.active {
                background: rgba(45, 212, 191, 0.3);
                color: white;
                box-shadow: 0 2px 8px rgba(45, 212, 191, 0.2);
        }
        
        .nav-link i {
                font-size: 1rem;
                width: 16px;
                text-align: center;
        }
        
        /* Mobile Menu Toggle */
        .mobile-menu-toggle {
                display: none;
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 6px;
                transition: background-color 0.3s ease;
        }
        
        .mobile-menu-toggle:hover {
                background: rgba(255, 255, 255, 0.15);
        }
        
        /* Mobile Navigation Menu */
        .mobile-nav-menu {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, rgba(76, 99, 210, 0.98), rgba(124, 58, 237, 0.98));
                backdrop-filter: blur(25px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 80vh;
                overflow-y: auto;
        }
        
        .mobile-nav-content {
                padding: 1rem;
                display: grid;
                gap: 0.5rem;
        }
        
        .mobile-nav-link {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-radius: 10px;
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-nav-link:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-1px);
                border-color: rgba(255, 255, 255, 0.2);
        }
        
        .mobile-nav-link.active {
                background: rgba(45, 212, 191, 0.3);
                border-color: rgba(45, 212, 191, 0.4);
                color: white;
        }
        
        .mobile-nav-link i {
                font-size: 1.2rem;
                width: 24px;
                text-align: center;
                color: #2DD4BF;
        }
        
        .mobile-nav-text {
                flex: 1;
        }
        
        .mobile-nav-label {
                display: block;
                font-weight: 600;
                font-size: 1rem;
                margin-bottom: 0.2rem;
        }
        
        .mobile-nav-desc {
                display: block;
                font-size: 0.85rem;
                opacity: 0.8;
                font-weight: 400;
        }
        
        /* Page Content */
        .page-content {
                min-height: calc(100vh - 70px);
                transition: filter 0.3s ease;
        }
        
        .page-content.mobile-menu-open {
                filter: blur(2px);
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
                .nav-links-desktop {
                        gap: 0.3rem;
                }
                
                .nav-link {
                        padding: 0.5rem 0.8rem;
                        font-size: 0.85rem;
                }
                
                .nav-link span {
                        display: none;
                }
                
                .nav-link i {
                        font-size: 1.1rem;
                }
        }
        
        @media (max-width: 768px) {
                .nav-container {
                        padding: 0 1rem;
                        height: 60px;
                }
                
                .nav-logo {
                        font-size: 1.3rem;
                }
                
                .amp-symbol {
                        font-size: 1.5rem;
                }
                
                .nav-links-desktop {
                        display: none;
                }
                
                .mobile-menu-toggle {
                        display: block;
                }
                
                .page-content {
                        min-height: calc(100vh - 60px);
                }
        }
        
        /* Smooth scrolling */
        :global(html) {
                scroll-behavior: smooth;
        }
        
        /* Hide mobile menu when clicking outside */
        .mobile-nav-menu {
                animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
                from {
                        opacity: 0;
                        transform: translateY(-10px);
                }
                to {
                        opacity: 1;
                        transform: translateY(0);
                }
        }
</style>