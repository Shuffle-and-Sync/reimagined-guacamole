<script lang="ts">
	export let tournament: {
		id: string;
		name: string;
		description: string;
		gameFormat: string;
		community: string;
		organizer: string;
		maxParticipants: number;
		currentParticipants: number;
		status: string;
		startDate: Date;
		prizePool: string;
		rules?: string;
	};

	export let onJoin: (tournamentId: string) => void;
	export let onViewBracket: (tournamentId: string) => void;

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

<div class="tournament-card">
	<div class="tournament-header">
		<h3 class="tournament-name">{tournament.name}</h3>
		<span class="tournament-status" style="background-color: {getStatusColor(tournament.status)}">
			{getStatusIcon(tournament.status)} {tournament.status}
		</span>
	</div>
	
	<div class="tournament-details">
		<p class="tournament-description">{tournament.description}</p>
		
		<div class="tournament-meta">
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
				on:click={() => onJoin(tournament.id)}
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
				on:click={() => onViewBracket(tournament.id)}
			>
				<i class="fas fa-sitemap"></i> View Bracket
			</button>
		{/if}
		
		<button class="btn btn-secondary btn-sm">
			<i class="fas fa-eye"></i> Watch Streams
		</button>
	</div>
</div>

<style>
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

	.tournament-meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

	@media (max-width: 768px) {
		.tournament-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.tournament-meta {
			grid-template-columns: 1fr;
		}

		.tournament-actions {
			flex-direction: column;
		}
	}
</style>