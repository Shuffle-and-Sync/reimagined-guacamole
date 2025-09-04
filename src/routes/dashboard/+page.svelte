<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import { selectedCommunity } from '$lib/stores/community';
	
	onMount(() => {
		// Check authentication status when page loads
		authStore.checkAuth();
	});
</script>

<svelte:head>
	<title>Dashboard - Shuffle & Sync</title>
	<meta name="description" content="Your TCG streaming dashboard - coordinate matches and connect with fellow streamers" />
</svelte:head>

<div class="container">
	<!-- Navigation -->
	<nav class="nav">
		<a href="/" class="logo-nav">
			Shuffle <span class="amp-symbol">&</span> Sync
		</a>
		{#if $isAuthenticated}
			<div class="nav-links">
				<a href="/game-room" class="nav-link">Game Rooms</a>
				<a href="/tournaments" class="nav-link">Tournaments</a>
				<a href="/profile" class="nav-link">Profile</a>
				<button on:click={authStore.logout} class="btn btn-secondary btn-sm">Logout</button>
			</div>
		{/if}
	</nav>

	<main>
		{#if $isAuthenticated && $user}
			<header class="dashboard-header">
				<h1 class="hero-title">Welcome, {$user.firstName || $user.username || 'Planeswalker'}!</h1>
				<p class="hero-subtitle">
					Ready to coordinate some epic TCG streams? Choose your realm and start building your deck.
				</p>
				
				{#if $selectedCommunity}
					<div class="community-badge">
						<i class={$selectedCommunity.iconClass}></i>
						{$selectedCommunity.displayName}
					</div>
				{/if}
			</header>

			<section class="dashboard-content">
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<div class="card-icon">
							<i class="fas fa-layer-group"></i>
						</div>
						<h3>Active Game Pods</h3>
						<p>Join ongoing TCG streaming sessions or create your own pod for collaborative gameplay.</p>
						<a href="/game-room" class="btn btn-primary btn-sm">Join Game Pod</a>
					</div>

					<div class="dashboard-card">
						<div class="card-icon">
							<i class="fas fa-trophy"></i>
						</div>
						<h3>Tournaments</h3>
						<p>Participate in tournaments or host your own competitive events with bracket management.</p>
						<a href="/tournaments" class="btn btn-primary btn-sm">View Tournaments</a>
					</div>

					<div class="dashboard-card">
						<div class="card-icon">
							<i class="fas fa-calendar-alt"></i>
						</div>
						<h3>Event Calendar</h3>
						<p>Schedule collaborative streams, mark tournament dates, and coordinate with your community.</p>
						<a href="/calendar" class="btn btn-primary btn-sm">View Calendar</a>
					</div>

					<div class="dashboard-card">
						<div class="card-icon">
							<i class="fas fa-users"></i>
						</div>
						<h3>Planeswalker Network</h3>
						<p>Connect with fellow streamers, build your network, and discover collaboration opportunities.</p>
						<a href="/social" class="btn btn-primary btn-sm">Find Streamers</a>
					</div>
				</div>
			</section>
		{:else}
			<div class="auth-required">
				<h2 class="section-title">🎯 Draw Your Hand First</h2>
				<p>You need to log in to access your TCG streaming dashboard.</p>
				<button on:click={authStore.login} class="btn btn-primary">
					<i class="fas fa-hand-sparkles"></i> Draw Your Hand
				</button>
			</div>
		{/if}
	</main>
</div>

<style>
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

	.btn-sm {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.community-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(45deg, #2DD4BF, #10B981);
		border: 2px solid rgba(255, 255, 255, 0.25);
		border-radius: 20px;
		padding: 0.6rem 1.8rem;
		font-size: 0.95rem;
		font-weight: 600;
		margin-top: 1rem;
		box-shadow: 0 4px 15px rgba(45, 212, 191, 0.25);
		font-family: 'Nunito', sans-serif;
	}

	.dashboard-content {
		max-width: 1000px;
		margin: 0 auto;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
	}

	.dashboard-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		color: white;
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.dashboard-card:hover {
		transform: translateY(-4px);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
		border-color: rgba(45, 212, 191, 0.4);
		box-shadow: 0 12px 35px rgba(45, 212, 191, 0.15);
	}

	.card-icon {
		font-size: 2.5rem;
		color: #2DD4BF;
		margin-bottom: 1rem;
		filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
	}

	.dashboard-card h3 {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 0.8rem;
	}

	.dashboard-card p {
		opacity: 0.9;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.auth-required {
		text-align: center;
		padding: 4rem 2rem;
	}

	@media (max-width: 768px) {
		.nav {
			flex-direction: column;
			gap: 1rem;
		}

		.nav-links {
			flex-wrap: wrap;
			justify-content: center;
		}

		.dashboard-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>