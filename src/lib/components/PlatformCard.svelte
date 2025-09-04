<script lang="ts">
	export let platform: {
		id: string;
		name: string;
		icon: string;
		color: string;
		connected: boolean;
		username: string | null;
		followers: string | null;
		lastPost: string | null;
		engagement: string | null;
	};

	export let onConnect: (platformId: string) => void;
	export let onDisconnect: (platformId: string) => void;
</script>

<div class="platform-card">
	<div class="platform-header">
		<div class="platform-info">
			<i class={platform.icon} style="color: {platform.color}; font-size: 2rem;"></i>
			<div>
				<h3 class="platform-name">{platform.name}</h3>
				<div class="connection-status">
					{#if platform.connected}
						<span class="status-connected">✅ Connected</span>
					{:else}
						<span class="status-disconnected">⚪ Not Connected</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	{#if platform.connected}
		<div class="platform-stats">
			<div class="stat-item">
				<div class="stat-label">Username</div>
				<div class="stat-value">{platform.username}</div>
			</div>
			<div class="stat-item">
				<div class="stat-label">Followers</div>
				<div class="stat-value">{platform.followers}</div>
			</div>
			<div class="stat-item">
				<div class="stat-label">Last Post</div>
				<div class="stat-value">{platform.lastPost}</div>
			</div>
			<div class="stat-item">
				<div class="stat-label">Engagement</div>
				<div class="stat-value">{platform.engagement}</div>
			</div>
		</div>

		<div class="platform-actions">
			<button class="btn btn-secondary btn-sm">
				<i class="fas fa-chart-line"></i> View Analytics
			</button>
			<button 
				class="btn btn-danger btn-sm"
				on:click={() => onDisconnect(platform.id)}
			>
				<i class="fas fa-unlink"></i> Disconnect
			</button>
		</div>
	{:else}
		<div class="connect-prompt">
			<p>Connect your {platform.name} account to post content, track analytics, and grow your TCG streaming community.</p>
			<button 
				class="btn btn-primary"
				on:click={() => onConnect(platform.id)}
			>
				<i class="fas fa-link"></i> Connect {platform.name}
			</button>
		</div>
	{/if}
</div>

<style>
	.platform-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		color: white;
	}

	.platform-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(45, 212, 191, 0.15);
	}

	.platform-header {
		margin-bottom: 1.5rem;
	}

	.platform-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.platform-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.2rem;
		font-weight: 700;
		margin: 0 0 0.3rem 0;
	}

	.connection-status {
		font-size: 0.9rem;
	}

	.status-connected {
		color: #10B981;
		font-weight: 500;
	}

	.status-disconnected {
		color: #6B7280;
		font-weight: 500;
	}

	.platform-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 0.3rem;
	}

	.stat-value {
		font-weight: 600;
		color: white;
	}

	.platform-actions {
		display: flex;
		gap: 1rem;
	}

	.connect-prompt {
		text-align: center;
		padding: 1rem 0;
	}

	.connect-prompt p {
		margin-bottom: 1.5rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.6;
	}

	.btn-sm {
		padding: 0.6rem 1rem;
		font-size: 0.85rem;
		flex: 1;
	}

	.btn-danger {
		background: linear-gradient(135deg, #EF4444, #DC2626);
		color: white;
		border: none;
	}

	.btn-danger:hover {
		background: linear-gradient(135deg, #DC2626, #B91C1C);
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.platform-stats {
			grid-template-columns: 1fr;
		}

		.platform-actions {
			flex-direction: column;
		}
	}
</style>