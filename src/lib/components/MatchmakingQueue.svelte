<script lang="ts">
	export let queueTime: number;
	export let estimatedWait: number;
	export let selectedQueue: any;
	export let onLeaveQueue: () => void;

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getProgressPercentage(): number {
		if (estimatedWait === 0) return 0;
		return Math.min((queueTime / estimatedWait) * 100, 100);
	}

	function getQueueStatus(): string {
		if (!selectedQueue) return 'Finding opponents...';
		
		const progress = getProgressPercentage();
		if (progress < 25) return 'Searching for opponents...';
		if (progress < 50) return 'Evaluating matches...';
		if (progress < 75) return 'Confirming availability...';
		return 'Match found! Connecting...';
	}

	$: progressPercentage = getProgressPercentage();
	$: queueStatus = getQueueStatus();
</script>

<div class="matchmaking-queue">
	<div class="queue-header">
		<div class="queue-icon">🔍</div>
		<div class="queue-info">
			<h3 class="queue-title">Looking for Opponents</h3>
			<div class="queue-subtitle">{queueStatus}</div>
		</div>
		<button class="leave-queue-btn" on:click={onLeaveQueue}>
			<i class="fas fa-times"></i>
		</button>
	</div>

	{#if selectedQueue}
		<div class="queue-details">
			<div class="queue-game">
				<span class="game-icon">{selectedQueue.icon}</span>
				<div class="game-info">
					<div class="game-name">{selectedQueue.game}</div>
					<div class="game-format">{selectedQueue.format}</div>
				</div>
			</div>
			<div class="queue-power">Power Level: {selectedQueue.powerLevel}</div>
		</div>
	{/if}

	<div class="queue-progress">
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progressPercentage}%"></div>
		</div>
		<div class="progress-info">
			<div class="queue-time">
				<i class="fas fa-clock"></i>
				<span>In queue: {formatTime(queueTime)}</span>
			</div>
			<div class="estimated-time">
				<i class="fas fa-hourglass-half"></i>
				<span>Estimated: {formatTime(estimatedWait)}</span>
			</div>
		</div>
	</div>

	<div class="queue-animation">
		<div class="searching-dots">
			<div class="dot dot-1"></div>
			<div class="dot dot-2"></div>
			<div class="dot dot-3"></div>
		</div>
		<div class="search-text">Finding the perfect opponent for you...</div>
	</div>

	<div class="queue-tips">
		<h4 class="tips-title">💡 While You Wait</h4>
		<ul class="tips-list">
			<li>Make sure your deck is ready and legal for the format</li>
			<li>Check your streaming setup if you plan to broadcast</li>
			<li>Review your opponent preferences in settings</li>
			<li>Join our Discord for faster match coordination</li>
		</ul>
	</div>
</div>

<style>
	.matchmaking-queue {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(79, 70, 229, 0.1));
		border: 2px solid rgba(124, 58, 237, 0.4);
		border-radius: 18px;
		padding: 2rem;
		margin-bottom: 3rem;
		color: white;
		position: relative;
		overflow: hidden;
	}

	.matchmaking-queue::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% { left: -100%; }
		100% { left: 100%; }
	}

	.queue-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		position: relative;
		z-index: 1;
	}

	.queue-icon {
		font-size: 2.5rem;
		filter: drop-shadow(2px 2px 4px rgba(124, 58, 237, 0.4));
	}

	.queue-info {
		flex: 1;
	}

	.queue-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.3rem 0;
		color: white;
	}

	.queue-subtitle {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.leave-queue-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid rgba(239, 68, 68, 0.4);
		background: rgba(239, 68, 68, 0.2);
		color: #EF4444;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		font-size: 1.1rem;
	}

	.leave-queue-btn:hover {
		background: rgba(239, 68, 68, 0.4);
		transform: scale(1.1);
		border-color: rgba(239, 68, 68, 0.6);
	}

	.queue-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		border-left: 4px solid #7C3AED;
	}

	.queue-game {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.game-icon {
		font-size: 2rem;
	}

	.game-name {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 0.2rem;
	}

	.game-format {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.queue-power {
		font-weight: 600;
		color: #A855F7;
		font-size: 1rem;
	}

	.queue-progress {
		margin-bottom: 2rem;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #7C3AED, #A855F7, #C084FC);
		border-radius: 6px;
		transition: width 0.3s ease;
		background-size: 200% 200%;
		animation: gradientShift 2s ease-in-out infinite alternate;
	}

	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		100% { background-position: 100% 50%; }
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.queue-time,
	.estimated-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.queue-time {
		color: #2DD4BF;
		font-weight: 600;
	}

	.estimated-time {
		color: rgba(255, 255, 255, 0.7);
	}

	.queue-animation {
		text-align: center;
		margin-bottom: 2rem;
	}

	.searching-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #A855F7);
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.dot-1 { animation-delay: -0.32s; }
	.dot-2 { animation-delay: -0.16s; }
	.dot-3 { animation-delay: 0s; }

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}

	.search-text {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.95rem;
		font-style: italic;
	}

	.queue-tips {
		background: rgba(45, 212, 191, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		border-left: 4px solid #2DD4BF;
	}

	.tips-title {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #2DD4BF;
	}

	.tips-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tips-list li {
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		line-height: 1.4;
		position: relative;
		padding-left: 1.5rem;
	}

	.tips-list li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: #2DD4BF;
		font-weight: 700;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.matchmaking-queue {
			padding: 1.5rem;
		}

		.queue-header {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.queue-details {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.progress-info {
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
		}

		.queue-game {
			width: 100%;
		}

		.tips-list li {
			font-size: 0.85rem;
		}
	}
</style>