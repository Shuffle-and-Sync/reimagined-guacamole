<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import PlatformCard from '$lib/components/PlatformCard.svelte';
	import SocialPostComposer from '$lib/components/SocialPostComposer.svelte';
	import ScheduledPosts from '$lib/components/ScheduledPosts.svelte';
	import SocialAnalytics from '$lib/components/SocialAnalytics.svelte';

	// Social media platforms data
	let platforms = [
		{
			id: 'twitch',
			name: 'Twitch',
			icon: 'fab fa-twitch',
			color: '#9146FF',
			connected: true,
			username: 'streamlord_tcg',
			followers: '12.5K',
			lastPost: '2 hours ago',
			engagement: '8.4%'
		},
		{
			id: 'youtube',
			name: 'YouTube',
			icon: 'fab fa-youtube', 
			color: '#FF0000',
			connected: true,
			username: 'StreamLord TCG',
			followers: '8.2K',
			lastPost: '1 day ago',
			engagement: '12.1%'
		},
		{
			id: 'twitter',
			name: 'Twitter/X',
			icon: 'fab fa-x-twitter',
			color: '#000000',
			connected: false,
			username: null,
			followers: null,
			lastPost: null,
			engagement: null
		},
		{
			id: 'instagram',
			name: 'Instagram',
			icon: 'fab fa-instagram',
			color: '#E4405F',
			connected: true,
			username: '@streamlord_tcg',
			followers: '5.8K',
			lastPost: '6 hours ago',
			engagement: '6.2%'
		},
		{
			id: 'tiktok',
			name: 'TikTok',
			icon: 'fab fa-tiktok',
			color: '#000000',
			connected: false,
			username: null,
			followers: null,
			lastPost: null,
			engagement: null
		},
		{
			id: 'discord',
			name: 'Discord',
			icon: 'fab fa-discord',
			color: '#5865F2',
			connected: true,
			username: 'StreamLord#1337',
			followers: '2.1K',
			lastPost: '30 mins ago',
			engagement: '15.3%'
		}
	];

	// Mock scheduled posts data
	let scheduledPosts = [
		{
			id: '1',
			content: '🃏 Starting a Commander pod stream in 30 minutes! Who wants to see some spicy deck tech? #MTG #Commander #StreamLord',
			platforms: ['twitch', 'youtube', 'instagram'],
			scheduledFor: new Date('2024-12-08T18:30:00'),
			status: 'scheduled',
			engagement: null
		},
		{
			id: '2',
			content: '🏆 Tournament highlights from last nights Pokemon Draft Championship! Some insane plays here. Link in bio! #Pokemon #TCG #Tournament',
			platforms: ['youtube', 'instagram', 'tiktok'],
			scheduledFor: new Date('2024-12-08T12:00:00'),
			status: 'published',
			engagement: { likes: 342, shares: 89, comments: 45 }
		},
		{
			id: '3',
			content: 'Drop your favorite TCG memory in the comments! Building community one card at a time 🎮✨',
			platforms: ['discord', 'twitter'],
			scheduledFor: new Date('2024-12-09T15:00:00'),
			status: 'draft',
			engagement: null
		}
	];

	// Content templates for TCG streaming
	let contentTemplates = [
		{
			id: 'stream_starting',
			name: 'Stream Starting',
			content: '🎮 Going live now with {game}! Join me for some {format} action. Link in bio! #{hashtags}',
			platforms: ['twitch', 'youtube', 'discord'],
			category: 'streaming'
		},
		{
			id: 'tournament_announcement', 
			name: 'Tournament Announcement',
			content: '🏆 {tournament_name} starts {date}! {spots} spots remaining. Prize pool: {prizes} Register now! #{hashtags}',
			platforms: ['twitter', 'instagram', 'discord'],
			category: 'tournament'
		},
		{
			id: 'deck_tech',
			name: 'Deck Tech',
			content: '🃏 New {format} deck tech featuring {archetype}! What do you think of this spicy list? Full breakdown: {link} #{hashtags}',
			platforms: ['youtube', 'instagram', 'twitter'],
			category: 'content'
		},
		{
			id: 'community_engagement',
			name: 'Community Question',
			content: '💭 Question for the TCG community: {question} Drop your thoughts below! #{hashtags}',
			platforms: ['twitter', 'instagram', 'discord'],
			category: 'engagement'
		}
	];

	let currentView = 'overview'; // overview, compose, schedule, analytics
	let showConnectModal = false;
	let selectedPlatform = null;

	onMount(() => {
		authStore.checkAuth();
	});

	function connectPlatform(platformId: string) {
		selectedPlatform = platforms.find(p => p.id === platformId);
		showConnectModal = true;
	}

	function disconnectPlatform(platformId: string) {
		const platform = platforms.find(p => p.id === platformId);
		if (platform) {
			platform.connected = false;
			platform.username = null;
			platform.followers = null;
			platform.lastPost = null;
			platform.engagement = null;
			alert(`❌ Disconnected from ${platform.name}. Your content will no longer post there.`);
		}
	}

	function handleOAuthConnect() {
		if (selectedPlatform) {
			alert(`🔗 Connecting to ${selectedPlatform.name}... In a real app, this would start OAuth flow.`);
			showConnectModal = false;
			
			// Mock successful connection
			selectedPlatform.connected = true;
			selectedPlatform.username = `tcg_streamer_${selectedPlatform.id}`;
			selectedPlatform.followers = Math.floor(Math.random() * 10000) + 'K';
			selectedPlatform.lastPost = 'Just connected';
			selectedPlatform.engagement = (Math.random() * 15 + 5).toFixed(1) + '%';
		}
	}

	function useTemplate(template) {
		currentView = 'compose';
		// In real app: populate composer with template content
		alert(`📝 Template "${template.name}" loaded into composer!`);
	}

	// Analytics data
	let analyticsData = {
		totalFollowers: 28600,
		totalReach: 142500,
		totalEngagement: 9.2,
		topPlatform: 'YouTube',
		recentGrowth: '+12.4%',
		bestPerformingPost: 'Commander pod highlights',
		platformBreakdown: [
			{ platform: 'Twitch', followers: 12500, engagement: 8.4, growth: '+8.2%' },
			{ platform: 'YouTube', followers: 8200, engagement: 12.1, growth: '+15.1%' },
			{ platform: 'Instagram', followers: 5800, engagement: 6.2, growth: '+5.8%' },
			{ platform: 'Discord', followers: 2100, engagement: 15.3, growth: '+18.9%' }
		]
	};
</script>

<svelte:head>
	<title>Social Media Hub - Shuffle & Sync</title>
	<meta name="description" content="Manage your TCG streaming social media presence across all platforms" />
</svelte:head>

<div class="container">
	<!-- Navigation -->
	<nav class="nav">
		<a href="/" class="logo-nav">
			Shuffle <span class="amp-symbol">&</span> Sync
		</a>
		{#if $isAuthenticated}
			<div class="nav-links">
				<a href="/dashboard" class="nav-link">Dashboard</a>
				<a href="/tournaments" class="nav-link">Tournaments</a>
				<a href="/game-room" class="nav-link">Game Rooms</a>
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		<header class="page-header">
			<h1 class="hero-title">📱 Social Media Hub</h1>
			<p class="hero-subtitle">
				Coordinate your TCG streaming content across all platforms with intelligent scheduling and analytics
			</p>
		</header>

		<!-- View Navigation -->
		<div class="view-tabs">
			<button 
				class="view-tab"
				class:active={currentView === 'overview'}
				on:click={() => currentView = 'overview'}
			>
				<i class="fas fa-home"></i> Overview
			</button>
			<button 
				class="view-tab"
				class:active={currentView === 'compose'}
				on:click={() => currentView = 'compose'}
			>
				<i class="fas fa-pen"></i> Compose
			</button>
			<button 
				class="view-tab"
				class:active={currentView === 'schedule'}
				on:click={() => currentView = 'schedule'}
			>
				<i class="fas fa-calendar"></i> Scheduled
			</button>
			<button 
				class="view-tab"
				class:active={currentView === 'analytics'}
				on:click={() => currentView = 'analytics'}
			>
				<i class="fas fa-chart-line"></i> Analytics
			</button>
		</div>

		<!-- Overview View -->
		{#if currentView === 'overview'}
			<section class="overview-section">
				<!-- Platform Connections -->
				<div class="section-header">
					<h2 class="section-title">🔗 Platform Connections</h2>
					<p class="section-subtitle">Connect and manage your social media accounts</p>
				</div>

				<div class="platforms-grid">
					{#each platforms as platform}
						<PlatformCard 
							{platform}
							onConnect={connectPlatform}
							onDisconnect={disconnectPlatform}
						/>
					{/each}
				</div>

				<!-- Quick Stats -->
				<div class="quick-stats">
					<h2 class="section-title">📊 Quick Stats</h2>
					<div class="stats-grid">
						<div class="stat-card">
							<div class="stat-icon">👥</div>
							<div class="stat-info">
								<div class="stat-value">{analyticsData.totalFollowers.toLocaleString()}</div>
								<div class="stat-label">Total Followers</div>
							</div>
						</div>
						<div class="stat-card">
							<div class="stat-icon">👁️</div>
							<div class="stat-info">
								<div class="stat-value">{analyticsData.totalReach.toLocaleString()}</div>
								<div class="stat-label">Monthly Reach</div>
							</div>
						</div>
						<div class="stat-card">
							<div class="stat-icon">❤️</div>
							<div class="stat-info">
								<div class="stat-value">{analyticsData.totalEngagement}%</div>
								<div class="stat-label">Avg Engagement</div>
							</div>
						</div>
						<div class="stat-card">
							<div class="stat-icon">📈</div>
							<div class="stat-info">
								<div class="stat-value">{analyticsData.recentGrowth}</div>
								<div class="stat-label">30-Day Growth</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Content Templates -->
				<div class="templates-section">
					<h2 class="section-title">📝 Content Templates</h2>
					<p class="section-subtitle">Pre-built templates for common TCG streaming content</p>
					
					<div class="templates-grid">
						{#each contentTemplates as template}
							<div class="template-card">
								<div class="template-header">
									<h3 class="template-name">{template.name}</h3>
									<span class="template-category">{template.category}</span>
								</div>
								<div class="template-content">{template.content}</div>
								<div class="template-platforms">
									{#each template.platforms as platformId}
										{@const platform = platforms.find(p => p.id === platformId)}
										{#if platform}
											<i class={platform.icon} style="color: {platform.color};" title={platform.name}></i>
										{/if}
									{/each}
								</div>
								<button class="btn btn-primary btn-sm" on:click={() => useTemplate(template)}>
									Use Template
								</button>
							</div>
						{/each}
					</div>
				</div>
			</section>
		
		<!-- Compose View -->
		{:else if currentView === 'compose'}
			<SocialPostComposer {platforms} />

		<!-- Scheduled Posts View -->
		{:else if currentView === 'schedule'}
			<ScheduledPosts posts={scheduledPosts} {platforms} />

		<!-- Analytics View -->
		{:else if currentView === 'analytics'}
			<SocialAnalytics data={analyticsData} />
		{/if}
	</main>
</div>

<!-- Platform Connection Modal -->
{#if showConnectModal && selectedPlatform}
	<div class="modal-overlay" on:click={() => showConnectModal = false}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h2 class="modal-title">
					<i class={selectedPlatform.icon} style="color: {selectedPlatform.color};"></i>
					Connect to {selectedPlatform.name}
				</h2>
			</div>
			
			<div class="modal-content">
				<p>Connect your {selectedPlatform.name} account to:</p>
				<ul class="benefits-list">
					<li>✅ Post content directly from Shuffle & Sync</li>
					<li>✅ Schedule posts in advance</li>
					<li>✅ Track engagement and analytics</li>
					<li>✅ Cross-post to multiple platforms</li>
					<li>✅ Use platform-optimized templates</li>
				</ul>
				
				<div class="oauth-info">
					<i class="fas fa-shield-alt"></i>
					<p>We use secure OAuth authentication. We never store your password.</p>
				</div>
			</div>
			
			<div class="modal-actions">
				<button class="btn btn-secondary" on:click={() => showConnectModal = false}>
					Cancel
				</button>
				<button class="btn btn-primary" on:click={handleOAuthConnect}>
					<i class="fas fa-link"></i> Connect Account
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Navigation */
	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-link {
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.nav-link:hover {
		color: #2DD4BF;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	/* View Tabs */
	.view-tabs {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 3rem;
		flex-wrap: wrap;
	}

	.view-tab {
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.view-tab:hover {
		background: rgba(255, 255, 255, 0.12);
		color: white;
	}

	.view-tab.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		box-shadow: 0 4px 15px rgba(45, 212, 191, 0.25);
	}

	/* Overview Section */
	.overview-section {
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.section-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.8rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: #2DD4BF;
	}

	.section-subtitle {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
	}

	.platforms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 4rem;
	}

	/* Quick Stats */
	.quick-stats {
		margin-bottom: 4rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-icon {
		font-size: 2rem;
		filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		font-family: 'Nunito', sans-serif;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Templates */
	.templates-section {
		margin-bottom: 4rem;
	}

	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.template-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.template-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(45, 212, 191, 0.15);
	}

	.template-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.template-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: white;
	}

	.template-category {
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 500;
		background: linear-gradient(45deg, #2DD4BF, #10B981);
		color: white;
	}

	.template-content {
		margin-bottom: 1rem;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		font-style: italic;
	}

	.template-platforms {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.btn-sm {
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
	}

	.modal {
		background: linear-gradient(135deg, #4C63D2 0%, #7C3AED 35%, #2DD4BF 70%);
		border-radius: 18px;
		width: 100%;
		max-width: 500px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		color: white;
	}

	.modal-header {
		padding: 2rem 2rem 1rem 2rem;
		text-align: center;
	}

	.modal-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.modal-content {
		padding: 0 2rem 1rem 2rem;
	}

	.benefits-list {
		list-style: none;
		padding: 1rem 0;
		margin: 1rem 0;
	}

	.benefits-list li {
		padding: 0.3rem 0;
		color: rgba(255, 255, 255, 0.9);
	}

	.oauth-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		padding: 1rem 2rem 2rem 2rem;
		justify-content: flex-end;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.nav {
			flex-direction: column;
			gap: 1rem;
		}

		.nav-links {
			flex-wrap: wrap;
			justify-content: center;
		}

		.platforms-grid,
		.stats-grid,
		.templates-grid {
			grid-template-columns: 1fr;
		}

		.view-tabs {
			flex-direction: column;
			align-items: center;
		}

		.template-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>