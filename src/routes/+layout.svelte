<script lang="ts">
        import '../app.css';
        import { page } from '$app/stores';
        import { onMount } from 'svelte';
        import { user, isAuthenticated, isLoading, authStore } from '$lib/stores/auth';
        
        let mobileMenuOpen = false;
        let userDropdownOpen = false;
        
        // Navigation items (only shown when authenticated)
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
                userDropdownOpen = false;
        }
        
        function toggleMobileMenu() {
                mobileMenuOpen = !mobileMenuOpen;
        }
        
        function toggleUserDropdown() {
                userDropdownOpen = !userDropdownOpen;
        }
        
        function handleLogin() {
                authStore.login();
        }
        
        function handleRegister() {
                authStore.register();
        }
        
        async function handleLogout() {
                await authStore.logout();
        }
        
        function getUserInitials() {
                if (!$user) return 'U';
                const first = $user.firstName?.[0] || '';
                const last = $user.lastName?.[0] || '';
                return first + last || $user.email?.[0]?.toUpperCase() || 'U';
        }
        
        // Initialize authentication on mount
        onMount(() => {
                authStore.checkAuth();
        });
</script>

<!-- Global Navigation -->
<nav class="main-nav">
        <div class="nav-container">
                <!-- Logo -->
                <a href="/" class="nav-logo">
                        <span class="logo-text">Shuffle <span class="amp-symbol">&</span> Sync</span>
                </a>
                
                <!-- Desktop Navigation - Only show if authenticated -->
                {#if $isAuthenticated}
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
                {/if}
                
                <!-- User Menu or Auth Buttons -->
                <div class="nav-user-section">
                        {#if $isLoading}
                                <div class="loading-indicator">
                                        <i class="fas fa-spinner fa-spin"></i>
                                </div>
                        {:else if $isAuthenticated && $user}
                                <!-- Authenticated User Menu -->
                                <div class="user-menu">
                                        <button class="user-avatar-btn" on:click={toggleUserDropdown}>
                                                <div class="user-avatar">
                                                        {#if $user.profileImageUrl}
                                                                <img src="{$user.profileImageUrl}" alt="Profile" />
                                                        {:else}
                                                                <span class="user-initials">{getUserInitials()}</span>
                                                        {/if}
                                                </div>
                                                <span class="user-name">{$user.firstName || $user.username || 'User'}</span>
                                                <i class="fas fa-chevron-down"></i>
                                        </button>
                                        
                                        {#if userDropdownOpen}
                                                <div class="user-dropdown">
                                                        <a href="/profile" class="dropdown-item">
                                                                <i class="fas fa-user"></i>
                                                                Profile
                                                        </a>
                                                        <a href="/settings" class="dropdown-item">
                                                                <i class="fas fa-cog"></i>
                                                                Settings
                                                        </a>
                                                        <button class="dropdown-item logout-btn" on:click={handleLogout}>
                                                                <i class="fas fa-sign-out-alt"></i>
                                                                Sign Out
                                                        </button>
                                                </div>
                                        {/if}
                                </div>
                        {:else}
                                <!-- Unauthenticated Auth Buttons -->
                                <div class="auth-buttons">
                                        <button class="auth-btn login-btn" on:click={handleLogin}>
                                                <i class="fas fa-sign-in-alt"></i>
                                                Sign In
                                        </button>
                                        <button class="auth-btn register-btn" on:click={handleRegister}>
                                                <i class="fas fa-user-plus"></i>
                                                Join Guild
                                        </button>
                                </div>
                        {/if}
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
                                {#if $isAuthenticated && $user}
                                        <!-- User info in mobile menu -->
                                        <div class="mobile-user-info">
                                                <div class="mobile-user-avatar">
                                                        {#if $user.profileImageUrl}
                                                                <img src="{$user.profileImageUrl}" alt="Profile" />
                                                        {:else}
                                                                <span class="user-initials">{getUserInitials()}</span>
                                                        {/if}
                                                </div>
                                                <div class="mobile-user-details">
                                                        <span class="mobile-user-name">{$user.firstName || $user.username || 'User'}</span>
                                                        <span class="mobile-user-email">{$user.email}</span>
                                                </div>
                                        </div>
                                        
                                        <!-- Navigation items for authenticated users -->
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
                                        
                                        <!-- Profile and logout -->
                                        <a href="/profile" class="mobile-nav-link">
                                                <i class="fas fa-user"></i>
                                                <div class="mobile-nav-text">
                                                        <span class="mobile-nav-label">Profile</span>
                                                        <span class="mobile-nav-desc">View and edit your profile</span>
                                                </div>
                                        </a>
                                        
                                        <button class="mobile-nav-link logout-btn" on:click={handleLogout}>
                                                <i class="fas fa-sign-out-alt"></i>
                                                <div class="mobile-nav-text">
                                                        <span class="mobile-nav-label">Sign Out</span>
                                                        <span class="mobile-nav-desc">Log out of your account</span>
                                                </div>
                                        </button>
                                {:else}
                                        <!-- Login/register for unauthenticated users -->
                                        <div class="mobile-auth-section">
                                                <button class="mobile-auth-btn login-btn" on:click={handleLogin}>
                                                        <i class="fas fa-sign-in-alt"></i>
                                                        <div class="mobile-nav-text">
                                                                <span class="mobile-nav-label">Sign In</span>
                                                                <span class="mobile-nav-desc">Access your account</span>
                                                        </div>
                                                </button>
                                                <button class="mobile-auth-btn register-btn" on:click={handleRegister}>
                                                        <i class="fas fa-user-plus"></i>
                                                        <div class="mobile-nav-text">
                                                                <span class="mobile-nav-label">Join Guild</span>
                                                                <span class="mobile-nav-desc">Create your TCG account</span>
                                                        </div>
                                                </button>
                                        </div>
                                {/if}
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
        
        /* User Section */
        .nav-user-section {
                display: flex;
                align-items: center;
                gap: 1rem;
        }
        
        .loading-indicator {
                color: rgba(255, 255, 255, 0.8);
                font-size: 1.2rem;
        }
        
        /* Auth Buttons */
        .auth-buttons {
                display: flex;
                align-items: center;
                gap: 0.75rem;
        }
        
        .auth-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 1rem;
                border-radius: 8px;
                border: none;
                font-weight: 600;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
        }
        
        .login-btn {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .login-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
        }
        
        .register-btn {
                background: linear-gradient(135deg, #2DD4BF, #06B6D4);
                color: white;
                box-shadow: 0 2px 8px rgba(45, 212, 191, 0.3);
        }
        
        .register-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(45, 212, 191, 0.4);
        }
        
        /* User Menu */
        .user-menu {
                position: relative;
        }
        
        .user-avatar-btn {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
        }
        
        .user-avatar-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-1px);
        }
        
        .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #4C63D2, #7C3AED);
                border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
        }
        
        .user-initials {
                font-weight: 700;
                font-size: 0.8rem;
                color: white;
        }
        
        .user-name {
                font-weight: 600;
                font-size: 0.9rem;
        }
        
        .user-dropdown {
                position: absolute;
                top: calc(100% + 0.5rem);
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(0, 0, 0, 0.1);
                min-width: 180px;
                z-index: 1001;
                animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
                from {
                        opacity: 0;
                        transform: translateY(-5px);
                }
                to {
                        opacity: 1;
                        transform: translateY(0);
                }
        }
        
        .dropdown-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                color: #374151;
                text-decoration: none;
                font-weight: 500;
                border: none;
                background: none;
                width: 100%;
                cursor: pointer;
                transition: background-color 0.2s ease;
        }
        
        .dropdown-item:hover {
                background: #F3F4F6;
        }
        
        .dropdown-item i {
                width: 16px;
                color: #6B7280;
        }
        
        .logout-btn {
                color: #EF4444 !important;
                border-top: 1px solid #E5E7EB;
        }
        
        .logout-btn:hover {
                background: #FEF2F2 !important;
        }
        
        /* Mobile User Info */
        .mobile-user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                margin-bottom: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .mobile-user-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #4C63D2, #7C3AED);
                border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .mobile-user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
        }
        
        .mobile-user-avatar .user-initials {
                font-size: 1rem;
        }
        
        .mobile-user-details {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
        }
        
        .mobile-user-name {
                color: white;
                font-weight: 600;
                font-size: 1rem;
        }
        
        .mobile-user-email {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.85rem;
        }
        
        /* Mobile Auth Section */
        .mobile-auth-section {
                padding: 1rem 0;
        }
        
        .mobile-auth-btn {
                display: flex;
                align-items: center;
                gap: 1rem;
                width: 100%;
                padding: 1rem;
                border-radius: 10px;
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: none;
                cursor: pointer;
                margin-bottom: 0.5rem;
        }
        
        .mobile-auth-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-1px);
                border-color: rgba(255, 255, 255, 0.2);
        }
        
        .mobile-auth-btn.register-btn {
                background: linear-gradient(135deg, #2DD4BF, #06B6D4);
                border-color: rgba(45, 212, 191, 0.4);
        }
        
        .mobile-auth-btn.register-btn:hover {
                background: linear-gradient(135deg, #0ED7B5, #0891B2);
        }
        
        .mobile-auth-btn i {
                font-size: 1.2rem;
                width: 24px;
                text-align: center;
                color: #2DD4BF;
        }
        
        .mobile-auth-btn.register-btn i {
                color: white;
        }
        
        .mobile-nav-link.logout-btn {
                background: none;
                cursor: pointer;
                border: none;
                text-align: left;
        }
        
        .mobile-nav-link.logout-btn i {
                color: #EF4444;
        }
        
        .mobile-nav-link.logout-btn:hover {
                background: rgba(239, 68, 68, 0.1);
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