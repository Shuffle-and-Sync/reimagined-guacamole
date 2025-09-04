<script lang="ts">
	import { onMount } from 'svelte';
	import CommunityCard from '$lib/components/CommunityCard.svelte';
	import FeatureCard from '$lib/components/FeatureCard.svelte';

	// TCG Communities data
	const communities = [
		{
			id: 'scry-gather',
			icon: '🔥',
			name: 'Scry & Gather',
			game: 'Magic: The Gathering'
		},
		{
			id: 'pokestream-hub',
			icon: '⚡',
			name: 'PokeStream Hub',
			game: 'Pokemon TCG'
		},
		{
			id: 'duelcraft',
			icon: '👁️',
			name: 'Duelcraft',
			game: 'Yu-Gi-Oh!'
		},
		{
			id: 'decksong',
			icon: '👑',
			name: 'Decksong',
			game: 'Disney Lorcana'
		},
		{
			id: 'deckmaster',
			icon: '♟️',
			name: 'Deckmaster',
			game: 'Strategic Games'
		},
		{
			id: 'bladeforge',
			icon: '⚔️',
			name: 'Bladeforge',
			game: 'Combat Cards'
		}
	];

	// Deck Builder Tools features
	const features = [
		{
			icon: 'fas fa-layer-group',
			title: 'Deck Sync',
			description: 'Coordinate multi-streamer pod matches, synchronize your deck reveals, and create epic collaborative gameplay that keeps viewers on the edge of their seats.'
		},
		{
			icon: 'fas fa-trophy',
			title: 'Tournament Commander',
			description: 'Host legendary tournaments with automatic bracket generation, real-time match tracking, and viewer prediction games that boost engagement.'
		},
		{
			icon: 'fas fa-chart-bar',
			title: 'Meta Analytics',
			description: 'Track your deck performance, analyze viewer favorite moments, and discover which strategies and card interactions drive the most excitement.'
		},
		{
			icon: 'fas fa-handshake',
			title: 'Planeswalker Network',
			description: 'Connect with fellow TCG content creators, find perfect collaboration partners, and build your streaming guild across all card game formats.'
		}
	];

	function handleLogin() {
		// Redirect to Express API login endpoint
		window.location.href = '/api/login';
	}

	function showDemo() {
		alert('🎮 Demo coming soon! Join us to be first to experience the platform.');
	}
</script>

<svelte:head>
	<title>Shuffle & Sync - TCG Streaming Coordination Platform</title>
	<meta name="description" content="Draw your perfect hand with fellow TCG streamers! Coordinate deck battles, build your streaming strategy, and create legendary gameplay moments together." />
</svelte:head>

<div class="container">
	<!-- Navigation -->
	<nav class="nav">
		<a href="/" class="logo-nav">
			Shuffle <span class="amp-symbol">&</span> Sync
		</a>
	</nav>
	
	<!-- Hero Section -->
	<header class="header">
		<div class="hero-badge">
			<i class="fas fa-cards-blank" style="margin-right: 0.5rem;"></i>
			Trading Card Game Streamers Unite
		</div>
		
		<h1 class="hero-title">Shuffle & Sync</h1>
		<p class="hero-subtitle">
			Draw your perfect hand with fellow TCG streamers! Coordinate deck battles, build your streaming strategy, and create legendary gameplay moments together.
		</p>
		
		<div class="cta-buttons">
			<button class="btn btn-primary" on:click={handleLogin}>
				<i class="fas fa-hand-sparkles"></i> Draw Your Hand
			</button>
			<button class="btn btn-secondary" on:click={showDemo}>
				<i class="fas fa-play"></i> See the Deck
			</button>
		</div>
	</header>
	
	<!-- TCG Communities Section -->
	<section class="communities-section">
		<h2 class="section-title">🃏 TCG Communities</h2>
		<p class="section-subtitle">
			Join your deck archetype and connect with streamers in your favorite card realms
		</p>
		<div class="communities-grid">
			{#each communities as community (community.id)}
				<CommunityCard {community} />
			{/each}
		</div>
	</section>
	
	<!-- Features Section -->
	<section class="features-section">
		<h2 class="section-title">🎯 Deck Builder Tools</h2>
		<p class="section-subtitle">
			Master your streaming strategy with powerful TCG coordination features
		</p>
		<div class="features-grid">
			{#each features as feature}
				<FeatureCard {feature} />
			{/each}
		</div>
	</section>
</div>

<style>
	/* Additional page-specific styles if needed */
</style>