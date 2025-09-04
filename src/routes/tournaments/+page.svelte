<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import { selectedCommunity } from '$lib/stores/community';
	import { createTournamentStore } from '$lib/stores/websocket';
	import TournamentCard from '$lib/components/TournamentCard.svelte';
	import TournamentBracket from '$lib/components/TournamentBracket.svelte';
	
	// Mock tournament data - will integrate with backend
	let tournaments = [
		{
			id: '1',
			name: 'Commander Masters Weekly',
			description: 'Weekly casual Commander tournament for streamers',
			gameFormat: 'Commander',
			communityId: 'scry-gather',
			community: 'Magic: The Gathering',
			organizerId: '1',
			organizer: 'MagicMike_Streams',
			maxParticipants: 16,
			currentParticipants: 12,
			status: 'upcoming',
			startDate: new Date('2024-12-08T18:00:00'),
			endDate: new Date('2024-12-08T23:00:00'),
			prizePool: '$200 + Stream Boost Package',
			rules: 'Power level 6-8, no infinite combos, 40 life starting'
		},
		{
			id: '2',
			name: 'Pokemon Draft Championship',
			description: 'Monthly championship with bracket streaming',
			gameFormat: 'Draft',
			communityId: 'pokestream-hub',
			community: 'Pokemon TCG',
			organizerId: '2',
			organizer: 'PikachuPower_YT',
			maxParticipants: 32,
			currentParticipants: 28,
			status: 'active',
			startDate: new Date('2024-12-07T15:00:00'),
			endDate: new Date('2024-12-07T21:00:00'),
			prizePool: 'Booster Box + Feature Stream',
			rules: 'Standard legal cards, best of 3 matches'
		},
		{
			id: '3',
			name: 'Yu-Gi-Oh! Duel Masters Cup',
			description: 'Elite tournament for advanced duelists',
			gameFormat: 'Traditional',
			communityId: 'duelcraft',
			community: 'Yu-Gi-Oh!',
			organizerId: '3',
			organizer: 'DuelKing_2024',
			maxParticipants: 8,
			currentParticipants: 8,
			status: 'completed',
			startDate: new Date('2024-12-01T14:00:00'),
			endDate: new Date('2024-12-01T18:00:00'),
			prizePool: '$500 + Championship Title',
			rules: 'Traditional format, side deck allowed'
		}
	];

	let selectedTournament = null;
	let showCreateModal = false;
	let filterStatus = 'all'; // all, upcoming, active, completed

	// Filter tournaments based on status
	$: filteredTournaments = tournaments.filter(tournament => {
		if (filterStatus === 'all') return true;
		return tournament.status === filterStatus;
	});

	onMount(() => {
		authStore.checkAuth();
	});

	function joinTournament(tournamentId: string) {
		const tournament = tournaments.find(t => t.id === tournamentId);
		if (tournament && tournament.currentParticipants < tournament.maxParticipants) {
			alert(`⚔️ Joined ${tournament.name}! Tournament coordination will use real-time WebSocket updates.`);
			// In real app: API call to join tournament + WebSocket notifications
		}
	}

	function viewBracket(tournamentId: string) {
		selectedTournament = tournaments.find(t => t.id === tournamentId);
	}

	function createTournament() {
		showCreateModal = true;
	}

	function handleCreateSubmit(event) {
		event.preventDefault();
		const formData = new FormData(event.target);
		
		// Extract form data
		const tournamentData = {
			name: formData.get('name'),
			description: formData.get('description'),
			gameFormat: formData.get('gameFormat'),
			maxParticipants: parseInt(formData.get('maxParticipants')),
			startDate: formData.get('startDate'),
			prizePool: formData.get('prizePool'),
			rules: formData.get('rules')
		};

		alert(`🏆 Tournament "${tournamentData.name}" created! Integration with backend coming next.`);
		showCreateModal = false;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'upcoming': return '#F59E0B';
			case 'active': return '#10B981'; 
			case 'completed': return '#6B7280';
			default: return '#6B7280';
		}
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'upcoming': return '⏳';
			case 'active': return '🎮';
			case 'completed': return '🏆';
			default: return '📅';
		}
	}
</script>

<svelte:head>
	<title>Tournaments - Shuffle & Sync</title>
	<meta name="description" content="Join TCG tournaments, manage brackets, and coordinate competitive streaming events" />
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
				<a href="/game-room" class="nav-link">Game Rooms</a>
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		{#if selectedTournament}
			<!-- Tournament Bracket View -->
			<div class="bracket-view">
				<div class="bracket-header">
					<button class="btn btn-secondary" on:click={() => selectedTournament = null}>
						<i class="fas fa-arrow-left"></i> Back to Tournaments
					</button>
					<h1 class="hero-title">{selectedTournament.name}</h1>
					<p class="tournament-meta">
						{selectedTournament.community} • {selectedTournament.gameFormat} • {selectedTournament.currentParticipants}/{selectedTournament.maxParticipants} Players
					</p>
				</div>
				
				<TournamentBracket tournamentId={selectedTournament.id} />
			</div>
		{:else}
			<!-- Tournament List View -->
			<header class="page-header">
				<h1 class="hero-title">🏆 Tournaments</h1>
				<p class="hero-subtitle">
					Compete in organized TCG tournaments with real-time bracket management and streaming coordination
				</p>
				
				<div class="cta-buttons">
					<button class="btn btn-primary" on:click={createTournament}>
						<i class="fas fa-plus"></i> Create Tournament
					</button>
				</div>
			</header>

			<!-- Tournament Filters -->
			<div class="tournament-filters">
				<div class="filter-tabs">
					<button 
						class="filter-tab"
						class:active={filterStatus === 'all'}
						on:click={() => filterStatus = 'all'}
					>
						All Tournaments
					</button>
					<button 
						class="filter-tab"
						class:active={filterStatus === 'upcoming'}
						on:click={() => filterStatus = 'upcoming'}
					>
						⏳ Upcoming
					</button>
					<button 
						class="filter-tab"
						class:active={filterStatus === 'active'}
						on:click={() => filterStatus = 'active'}
					>
						🎮 Active
					</button>
					<button 
						class="filter-tab"
						class:active={filterStatus === 'completed'}
						on:click={() => filterStatus = 'completed'}
					>
						🏆 Completed
					</button>
				</div>
			</div>

			<!-- Tournament Grid -->
			<section class="tournaments-section">
				<div class="tournaments-grid">
					{#each filteredTournaments as tournament (tournament.id)}
						<div class="tournament-card">
							<div class="tournament-header">
								<h3 class="tournament-name">{tournament.name}</h3>
								<span class="tournament-status" style="background-color: {getStatusColor(tournament.status)}">
									{getStatusIcon(tournament.status)} {tournament.status}
								</span>
							</div>
							
							<div class="tournament-details">
								<p class="tournament-description">{tournament.description}</p>
								
								<div class="tournament-meta-grid">
									<div class="meta-item">
										<i class="fas fa-cards-blank"></i>
										<span>{tournament.community}</span>
									</div>
									<div class="meta-item">
										<i class="fas fa-gamepad"></i>
										<span>{tournament.gameFormat}</span>
									</div>
									<div class="meta-item">
										<i class="fas fa-users"></i>
										<span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
									</div>
									<div class="meta-item">
										<i class="fas fa-trophy"></i>
										<span>{tournament.prizePool}</span>
									</div>
									<div class="meta-item">
										<i class="fas fa-calendar"></i>
										<span>{tournament.startDate.toLocaleDateString()}</span>
									</div>
									<div class="meta-item">
										<i class="fas fa-crown"></i>
										<span>{tournament.organizer}</span>
									</div>
								</div>
								
								{#if tournament.rules}
									<div class="tournament-rules">
										<i class="fas fa-scroll"></i>
										<span>{tournament.rules}</span>
									</div>
								{/if}
							</div>
							
							<div class="tournament-actions">
								{#if tournament.status === 'upcoming' && tournament.currentParticipants < tournament.maxParticipants}
									<button 
										class="btn btn-primary btn-sm"
										on:click={() => joinTournament(tournament.id)}
									>
										<i class="fas fa-sword"></i> Join Tournament
									</button>
								{:else if tournament.status === 'upcoming'}
									<button class="btn btn-secondary btn-sm" disabled>
										<i class="fas fa-lock"></i> Full
									</button>
								{/if}
								
								{#if tournament.status === 'active' || tournament.status === 'completed'}
									<button 
										class="btn btn-primary btn-sm"
										on:click={() => viewBracket(tournament.id)}
									>
										<i class="fas fa-sitemap"></i> View Bracket
									</button>
								{/if}
								
								<button class="btn btn-secondary btn-sm">
									<i class="fas fa-eye"></i> Watch Streams
								</button>
							</div>
						</div>
					{/each}
				</div>
				
				{#if filteredTournaments.length === 0}
					<div class="empty-state">
						<h3>🎯 No {filterStatus === 'all' ? '' : filterStatus} tournaments</h3>
						<p>Be the first to create a tournament for your TCG community!</p>
						<button class="btn btn-primary" on:click={createTournament}>
							<i class="fas fa-plus"></i> Create Tournament
						</button>
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>

<!-- Create Tournament Modal -->
{#if showCreateModal}
	<div class="modal-overlay" on:click={() => showCreateModal = false}>
		<div class="modal" on:click|stopPropagation>
			<form class="tournament-form" on:submit={handleCreateSubmit}>
				<h2 class="modal-title">🏆 Create Tournament</h2>
				
				<div class="form-group">
					<label for="name">Tournament Name</label>
					<input type="text" id="name" name="name" required 
						   placeholder="e.g., Weekly Commander Pod Championship" />
				</div>
				
				<div class="form-group">
					<label for="description">Description</label>
					<textarea id="description" name="description" rows="3"
							  placeholder="Describe your tournament format and goals"></textarea>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="gameFormat">Game Format</label>
						<select id="gameFormat" name="gameFormat" required>
							<option value="">Select Format</option>
							<option value="Commander">Commander</option>
							<option value="Standard">Standard</option>
							<option value="Modern">Modern</option>
							<option value="Draft">Draft</option>
							<option value="Sealed">Sealed</option>
							<option value="Traditional">Traditional</option>
							<option value="Custom">Custom</option>
						</select>
					</div>
					
					<div class="form-group">
						<label for="maxParticipants">Max Players</label>
						<select id="maxParticipants" name="maxParticipants" required>
							<option value="4">4 Players</option>
							<option value="8">8 Players</option>
							<option value="16">16 Players</option>
							<option value="32">32 Players</option>
							<option value="64">64 Players</option>
						</select>
					</div>
				</div>
				
				<div class="form-group">
					<label for="startDate">Start Date & Time</label>
					<input type="datetime-local" id="startDate" name="startDate" required />
				</div>
				
				<div class="form-group">
					<label for="prizePool">Prize Pool</label>
					<input type="text" id="prizePool" name="prizePool" 
						   placeholder="e.g., $200 + Stream Feature" />
				</div>
				
				<div class="form-group">
					<label for="rules">Tournament Rules</label>
					<textarea id="rules" name="rules" rows="3"
							  placeholder="Special rules, power level, banned cards, etc."></textarea>
				</div>
				
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" on:click={() => showCreateModal = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						<i class="fas fa-plus"></i> Create Tournament
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Navigation and Base Styles */
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

	/* Tournament Filters */
	.tournament-filters {
		max-width: 1000px;
		margin: 0 auto 2rem auto;
		padding: 0 1rem;
	}

	.filter-tabs {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.filter-tab {
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.filter-tab:hover {
		background: rgba(255, 255, 255, 0.12);
		color: white;
	}

	.filter-tab.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		box-shadow: 0 4px 15px rgba(45, 212, 191, 0.25);
	}

	/* Tournament Grid */
	.tournaments-section {
		max-width: 1200px;
		margin: 0 auto;
	}

	.tournaments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
	}

	.tournament-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		color: white;
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.tournament-card:hover {
		transform: translateY(-4px);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
		border-color: rgba(45, 212, 191, 0.4);
		box-shadow: 0 12px 35px rgba(45, 212, 191, 0.15);
	}

	.tournament-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.tournament-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0;
		flex: 1;
	}

	.tournament-status {
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
		color: white;
	}

	.tournament-description {
		margin-bottom: 1.5rem;
		opacity: 0.9;
		line-height: 1.6;
	}

	.tournament-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.8rem;
		margin-bottom: 1rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.tournament-rules {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.tournament-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn-sm {
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
		flex: 1;
		min-width: 120px;
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
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.tournament-form {
		padding: 2.5rem;
		color: white;
	}

	.modal-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.8rem;
		font-weight: 800;
		margin-bottom: 2rem;
		text-align: center;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 0.9rem;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #2DD4BF;
		box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	/* Bracket View */
	.bracket-view {
		max-width: 1400px;
		margin: 0 auto;
	}

	.bracket-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.tournament-meta {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.1rem;
		margin-top: 1rem;
	}

	/* Empty State */
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

		.tournaments-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.tournament-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.tournament-meta-grid {
			grid-template-columns: 1fr;
		}

		.tournament-actions {
			flex-direction: column;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>