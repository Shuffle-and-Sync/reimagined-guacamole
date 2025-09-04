<script lang="ts">
	export let match: any;
	export let isCompact: boolean = false;

	function getResultColor(result: string): string {
		switch (result) {
			case 'win': return '#10B981';
			case 'loss': return '#EF4444';
			case 'draw': return '#F59E0B';
			default: return '#6B7280';
		}
	}

	function getResultIcon(result: string): string {
		switch (result) {
			case 'win': return '🏆';
			case 'loss': return '💔';
			case 'draw': return '🤝';
			default: return '❓';
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString([], { 
			month: 'short', 
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getGameIcon(game: string): string {
		switch (game) {
			case 'Magic: The Gathering': return '🔮';
			case 'Pokemon TCG': return '⚡';
			case 'Yu-Gi-Oh!': return '⚔️';
			case 'Disney Lorcana': return '✨';
			default: return '🎮';
		}
	}
</script>

<div class="match-history-card" class:compact={isCompact}>
	<div class="match-header">
		<div class="match-result" style="color: {getResultColor(match.result)};">
			<span class="result-icon">{getResultIcon(match.result)}</span>
			<span class="result-text">{match.result.toUpperCase()}</span>
		</div>
		<div class="match-date">{formatDate(match.date)}</div>
	</div>

	<div class="match-details">
		<div class="match-game">
			<span class="game-icon">{getGameIcon(match.game)}</span>
			<div class="game-info">
				<div class="game-name">{match.game}</div>
				<div class="game-format">{match.format}</div>
			</div>
		</div>

		<div class="match-opponent">
			<div class="opponent-avatar">{match.opponent.charAt(0)}</div>
			<div class="opponent-info">
				<div class="opponent-name">{match.opponent}</div>
				<div class="match-duration">{match.duration}</div>
			</div>
		</div>
	</div>

	{#if !isCompact}
		<div class="match-metadata">
			{#if match.powerLevel}
				<div class="metadata-item">
					<span class="metadata-label">Power Level:</span>
					<span class="metadata-value">{match.powerLevel}/10</span>
				</div>
			{/if}
			
			{#if match.rating > 0}
				<div class="metadata-item">
					<span class="metadata-label">Rating:</span>
					<div class="rating-stars">
						{#each Array(5) as _, i}
							<span class="star" class:filled={i < Math.floor(match.rating)}>
								{i < Math.floor(match.rating) ? '★' : '☆'}
							</span>
						{/each}
						<span class="rating-number">({match.rating})</span>
					</div>
				</div>
			{/if}
		</div>

		{#if match.notes}
			<div class="match-notes">
				<div class="notes-title">📝 Notes:</div>
				<div class="notes-text">{match.notes}</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.match-history-card {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		transition: all 0.3s ease;
		position: relative;
	}

	.match-history-card:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.match-history-card.compact {
		padding: 1rem;
	}

	.match-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.match-result {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1rem;
	}

	.result-icon {
		font-size: 1.2rem;
	}

	.match-date {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}

	.match-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.match-game {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.game-icon {
		font-size: 1.5rem;
	}

	.game-name {
		font-weight: 600;
		color: white;
		font-size: 0.9rem;
	}

	.game-format {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8rem;
		margin-top: 0.1rem;
	}

	.match-opponent {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.opponent-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: white;
		font-size: 0.8rem;
		flex-shrink: 0;
	}

	.opponent-name {
		font-weight: 600;
		color: white;
		font-size: 0.9rem;
	}

	.match-duration {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8rem;
		margin-top: 0.1rem;
	}

	.match-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.metadata-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.metadata-label {
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.metadata-value {
		color: #2DD4BF;
		font-weight: 600;
	}

	.rating-stars {
		display: flex;
		align-items: center;
		gap: 0.1rem;
	}

	.star {
		color: #F59E0B;
		font-size: 0.9rem;
	}

	.star:not(.filled) {
		opacity: 0.3;
	}

	.rating-number {
		margin-left: 0.3rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.match-notes {
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		padding: 1rem;
		border-left: 3px solid #2DD4BF;
	}

	.notes-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #2DD4BF;
		margin-bottom: 0.5rem;
	}

	.notes-text {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.4;
		font-style: italic;
	}

	/* Compact Mode Adjustments */
	.match-history-card.compact .match-header {
		margin-bottom: 0.8rem;
	}

	.match-history-card.compact .match-details {
		margin-bottom: 0;
	}

	.match-history-card.compact .match-result {
		font-size: 0.85rem;
	}

	.match-history-card.compact .result-icon {
		font-size: 1rem;
	}

	.match-history-card.compact .game-icon {
		font-size: 1.2rem;
	}

	.match-history-card.compact .opponent-avatar {
		width: 28px;
		height: 28px;
		font-size: 0.7rem;
	}

	.match-history-card.compact .game-name,
	.match-history-card.compact .opponent-name {
		font-size: 0.8rem;
	}

	.match-history-card.compact .game-format,
	.match-history-card.compact .match-duration {
		font-size: 0.7rem;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.match-details {
			flex-direction: column;
			align-items: flex-start;
		}

		.match-opponent {
			width: 100%;
		}

		.match-metadata {
			flex-direction: column;
			gap: 0.5rem;
		}

		.metadata-item {
			justify-content: space-between;
			width: 100%;
		}

		.rating-stars {
			margin-left: auto;
		}
	}
</style>