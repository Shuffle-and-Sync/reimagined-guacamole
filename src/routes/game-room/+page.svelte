<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createGameRoomStore } from '$lib/stores/websocket';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';

	// Mock data for demonstration
	let activeRooms = [
		{
			id: '1',
			name: 'Commander Pod - Casual Fun',
			gameFormat: 'Commander',
			powerLevel: 6,
			currentPlayers: 3,
			maxPlayers: 4,
			host: 'MagicMike_Streams',
			community: 'Magic: The Gathering',
			status: 'waiting'
		},
		{
			id: '2', 
			name: 'Pokemon Draft Battle',
			gameFormat: 'Draft',
			powerLevel: 7,
			currentPlayers: 2,
			maxPlayers: 4,
			host: 'PikachuPower_YT',
			community: 'Pokemon TCG',
			status: 'active'
		},
		{
			id: '3',
			name: 'Yu-Gi-Oh Duel Masters',
			gameFormat: 'Traditional',
			powerLevel: 8,
			currentPlayers: 2,
			maxPlayers: 2,
			host: 'DuelKing_2024',
			community: 'Yu-Gi-Oh!',
			status: 'active'
		}
	];

	onMount(() => {
		authStore.checkAuth();
	});

	function joinRoom(roomId: string) {
		// In a real app, this would connect to the specific game room
		alert(`🎮 Joining game room ${roomId}! Real-time WebSocket integration ready.`);
	}

	function createRoom() {
		alert('🃏 Create Room feature coming soon! Will integrate with your Express backend.');
	}
</script>

<svelte:head>
	<title>Game Rooms - Shuffle & Sync</title>
	<meta name="description" content="Join active TCG streaming game rooms and coordinate multi-player sessions" />
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
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		<header class="page-header">
			<h1 class="hero-title">🎮 Game Rooms</h1>
			<p class="hero-subtitle">
				Join active streaming pods or create your own collaborative TCG sessions
			</p>
			
			<div class="cta-buttons">
				<button class="btn btn-primary" on:click={createRoom}>
					<i class="fas fa-plus"></i> Create Game Pod
				</button>
			</div>
		</header>

		<section class="rooms-section">
			<h2 class="section-title">🃏 Active Game Pods</h2>
			
			<div class="rooms-grid">
				{#each activeRooms as room (room.id)}
					<div class="room-card">
						<div class="room-header">
							<h3 class="room-name">{room.name}</h3>
							<span class="room-status status-{room.status}">
								{room.status === 'waiting' ? '⏳ Waiting' : '🎮 Active'}
							</span>
						</div>
						
						<div class="room-details">
							<div class="room-meta">
								<span class="meta-item">
									<i class="fas fa-gamepad"></i>
									{room.gameFormat}
								</span>
								<span class="meta-item">
									<i class="fas fa-star"></i>
									Power {room.powerLevel}/10
								</span>
								<span class="meta-item">
									<i class="fas fa-users"></i>
									{room.currentPlayers}/{room.maxPlayers}
								</span>
							</div>
							
							<div class="room-community">
								<i class="fas fa-cards-blank"></i>
								{room.community}
							</div>
							
							<div class="room-host">
								<i class="fas fa-crown"></i>
								Hosted by <strong>{room.host}</strong>
							</div>
						</div>
						
						<div class="room-actions">
							<button 
								class="btn btn-primary btn-sm"
								on:click={() => joinRoom(room.id)}
								disabled={room.currentPlayers >= room.maxPlayers}
							>
								{#if room.currentPlayers >= room.maxPlayers}
									<i class="fas fa-lock"></i> Full
								{:else}
									<i class="fas fa-hand-sparkles"></i> Join Pod
								{/if}
							</button>
							
							{#if room.currentPlayers < room.maxPlayers}
								<button class="btn btn-secondary btn-sm">
									<i class="fas fa-eye"></i> Spectate
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			
			{#if activeRooms.length === 0}
				<div class="empty-state">
					<h3>🎯 No Active Game Pods</h3>
					<p>Be the first to create a streaming pod for your TCG community!</p>
					<button class="btn btn-primary" on:click={createRoom}>
						<i class="fas fa-plus"></i> Create First Pod
					</button>
				</div>
			{/if}
		</section>
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

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.rooms-section {
		max-width: 1000px;
		margin: 0 auto;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}

	.room-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		color: white;
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.room-card:hover {
		transform: translateY(-4px);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
		border-color: rgba(45, 212, 191, 0.4);
		box-shadow: 0 12px 35px rgba(45, 212, 191, 0.15);
	}

	.room-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.room-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0;
		flex: 1;
	}

	.room-status {
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-waiting {
		background: linear-gradient(45deg, #F59E0B, #D97706);
	}

	.status-active {
		background: linear-gradient(45deg, #10B981, #059669);
	}

	.room-details {
		margin-bottom: 1.5rem;
	}

	.room-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 0.8rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.room-community, .room-host {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		opacity: 0.9;
	}

	.room-actions {
		display: flex;
		gap: 1rem;
	}

	.btn-sm {
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
		flex: 1;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 18px;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.empty-state h3 {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
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

		.rooms-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.room-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.room-meta {
			flex-direction: column;
			gap: 0.5rem;
		}

		.room-actions {
			flex-direction: column;
		}
	}
</style>