<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createTournamentStore } from '$lib/stores/websocket';

	export let tournamentId: string;

	let tournamentStore = createTournamentStore(tournamentId);
	let bracket = [];
	let participants = [];
	let currentRound = 0;
	let status = 'upcoming';

	// Mock bracket data for demonstration
	let mockBracket = [
		// Round 1 (Quarterfinals)
		{
			id: '1',
			round: 1,
			position: 1,
			player1: { id: '1', name: 'MagicMike_Streams', seed: 1 },
			player2: { id: '8', name: 'CardCaster_Pro', seed: 8 },
			winner: { id: '1', name: 'MagicMike_Streams' },
			status: 'completed'
		},
		{
			id: '2', 
			round: 1,
			position: 2,
			player1: { id: '4', name: 'DeckMaster_YT', seed: 4 },
			player2: { id: '5', name: 'StreamSorcerer', seed: 5 },
			winner: { id: '4', name: 'DeckMaster_YT' },
			status: 'completed'
		},
		{
			id: '3',
			round: 1, 
			position: 3,
			player1: { id: '2', name: 'CardKnight_TV', seed: 2 },
			player2: { id: '7', name: 'SpellSlinger_X', seed: 7 },
			winner: { id: '2', name: 'CardKnight_TV' },
			status: 'completed'
		},
		{
			id: '4',
			round: 1,
			position: 4,
			player1: { id: '3', name: 'ManaWarrior', seed: 3 },
			player2: { id: '6', name: 'PlaneswalkPro', seed: 6 },
			winner: null,
			status: 'active'
		},
		// Round 2 (Semifinals)
		{
			id: '5',
			round: 2,
			position: 1,
			player1: { id: '1', name: 'MagicMike_Streams' },
			player2: { id: '4', name: 'DeckMaster_YT' },
			winner: null,
			status: 'waiting'
		},
		{
			id: '6',
			round: 2,
			position: 2,
			player1: { id: '2', name: 'CardKnight_TV' },
			player2: null, // Waiting for match 4
			winner: null,
			status: 'waiting'
		},
		// Finals
		{
			id: '7',
			round: 3,
			position: 1,
			player1: null, // Winner of match 5
			player2: null, // Winner of match 6
			winner: null,
			status: 'waiting'
		}
	];

	onMount(() => {
		bracket = mockBracket;
		currentRound = 1;
		// In real app: tournamentStore.connect();
	});

	onDestroy(() => {
		// In real app: tournamentStore.disconnect();
	});

	function updateMatchResult(matchId: string, winnerId: string) {
		const match = bracket.find(m => m.id === matchId);
		if (match) {
			const winner = winnerId === match.player1?.id ? match.player1 : match.player2;
			alert(`🏆 Match result: ${winner.name} advances! Real WebSocket update would propagate to all viewers.`);
			
			// In real app: tournamentStore.sendMatchResult(matchId, winnerId);
		}
	}

	function getMatchStatusColor(status: string): string {
		switch (status) {
			case 'waiting': return '#6B7280';
			case 'active': return '#10B981';
			case 'completed': return '#2DD4BF';
			default: return '#6B7280';
		}
	}

	function getMatchStatusIcon(status: string): string {
		switch (status) {
			case 'waiting': return '⏳';
			case 'active': return '🎮';
			case 'completed': return '✅';
			default: return '📅';
		}
	}

	// Group matches by round for display
	$: roundGroups = bracket.reduce((groups, match) => {
		if (!groups[match.round]) {
			groups[match.round] = [];
		}
		groups[match.round].push(match);
		return groups;
	}, {});

	$: rounds = Object.keys(roundGroups).map(round => ({
		number: parseInt(round),
		name: getRoundName(parseInt(round)),
		matches: roundGroups[round]
	})).sort((a, b) => a.number - b.number);

	function getRoundName(round: number): string {
		const totalRounds = Math.max(...bracket.map(m => m.round));
		if (round === totalRounds) return 'Finals';
		if (round === totalRounds - 1) return 'Semifinals';
		if (round === totalRounds - 2) return 'Quarterfinals';
		return `Round ${round}`;
	}
</script>

<div class="bracket-container">
	<div class="bracket-header">
		<h2 class="bracket-title">🏆 Tournament Bracket</h2>
		<p class="bracket-subtitle">Real-time bracket updates with live match coordination</p>
	</div>

	<div class="bracket-grid">
		{#each rounds as round}
			<div class="bracket-round">
				<h3 class="round-title">{round.name}</h3>
				
				<div class="round-matches">
					{#each round.matches as match}
						<div class="match-card" style="border-color: {getMatchStatusColor(match.status)}">
							<div class="match-header">
								<span class="match-status" style="background-color: {getMatchStatusColor(match.status)}">
									{getMatchStatusIcon(match.status)} {match.status}
								</span>
								<span class="match-id">Match {match.id}</span>
							</div>

							<div class="match-players">
								{#if match.player1}
									<div 
										class="player"
										class:winner={match.winner?.id === match.player1.id}
										class:loser={match.winner && match.winner.id !== match.player1.id}
									>
										<div class="player-info">
											<span class="player-name">{match.player1.name}</span>
											{#if match.player1.seed}
												<span class="player-seed">#{match.player1.seed}</span>
											{/if}
										</div>
										{#if match.status === 'active' && !match.winner}
											<button 
												class="win-btn"
												on:click={() => updateMatchResult(match.id, match.player1.id)}
											>
												<i class="fas fa-crown"></i>
											</button>
										{:else if match.winner?.id === match.player1.id}
											<div class="winner-icon">🏆</div>
										{/if}
									</div>
								{:else}
									<div class="player waiting">
										<span class="player-name">Waiting...</span>
									</div>
								{/if}

								<div class="vs-divider">VS</div>

								{#if match.player2}
									<div 
										class="player"
										class:winner={match.winner?.id === match.player2.id}
										class:loser={match.winner && match.winner.id !== match.player2.id}
									>
										<div class="player-info">
											<span class="player-name">{match.player2.name}</span>
											{#if match.player2.seed}
												<span class="player-seed">#{match.player2.seed}</span>
											{/if}
										</div>
										{#if match.status === 'active' && !match.winner}
											<button 
												class="win-btn"
												on:click={() => updateMatchResult(match.id, match.player2.id)}
											>
												<i class="fas fa-crown"></i>
											</button>
										{:else if match.winner?.id === match.player2.id}
											<div class="winner-icon">🏆</div>
										{/if}
									</div>
								{:else}
									<div class="player waiting">
										<span class="player-name">Waiting...</span>
									</div>
								{/if}
							</div>

							{#if match.status === 'active'}
								<div class="match-actions">
									<button class="btn btn-secondary btn-xs">
										<i class="fas fa-eye"></i> Watch Stream
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="bracket-legend">
		<div class="legend-item">
			<span class="legend-dot" style="background-color: #6B7280;"></span>
			<span>⏳ Waiting</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot" style="background-color: #10B981;"></span>
			<span>🎮 Active</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot" style="background-color: #2DD4BF;"></span>
			<span>✅ Completed</span>
		</div>
	</div>
</div>

<style>
	.bracket-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.bracket-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.bracket-title {
		font-family: 'Nunito', sans-serif;
		font-size: 2.2rem;
		font-weight: 800;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, #2DD4BF, #7C3AED);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.bracket-subtitle {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.1rem;
	}

	.bracket-grid {
		display: flex;
		gap: 3rem;
		overflow-x: auto;
		padding: 2rem 0;
		min-height: 600px;
	}

	.bracket-round {
		min-width: 300px;
		flex-shrink: 0;
	}

	.round-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.4rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 2rem;
		color: #2DD4BF;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
	}

	.round-matches {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		justify-content: center;
		min-height: 500px;
	}

	.match-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 12px;
		padding: 1.5rem;
		border: 2px solid;
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.match-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(45, 212, 191, 0.15);
	}

	.match-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.match-status {
		padding: 0.3rem 0.8rem;
		border-radius: 15px;
		font-size: 0.8rem;
		font-weight: 600;
		color: white;
	}

	.match-id {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.match-players {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.player {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		transition: all 0.3s ease;
	}

	.player.winner {
		background: linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(16, 185, 129, 0.1));
		border: 1px solid rgba(45, 212, 191, 0.4);
	}

	.player.loser {
		opacity: 0.6;
		background: rgba(107, 114, 128, 0.1);
	}

	.player.waiting {
		opacity: 0.5;
		font-style: italic;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.player-name {
		font-weight: 600;
		color: white;
	}

	.player-seed {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.vs-divider {
		text-align: center;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		padding: 0.5rem 0;
	}

	.win-btn {
		padding: 0.4rem 0.8rem;
		border: none;
		border-radius: 6px;
		background: linear-gradient(135deg, #F59E0B, #D97706);
		color: white;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.win-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
	}

	.winner-icon {
		font-size: 1.2rem;
		animation: pulse 2s infinite;
	}

	.match-actions {
		margin-top: 1rem;
		text-align: center;
	}

	.btn-xs {
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
	}

	.bracket-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.bracket-grid {
			gap: 1.5rem;
			padding: 1rem 0;
		}

		.bracket-round {
			min-width: 250px;
		}

		.round-title {
			font-size: 1.2rem;
		}

		.match-card {
			padding: 1rem;
		}

		.bracket-legend {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}
	}
</style>