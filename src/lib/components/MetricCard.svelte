<script lang="ts">
	export let icon: string;
	export let title: string;
	export let value: string;
	export let subtitle: string = '';
	export let growth: string = '';

	function getGrowthIcon(growth: string): string {
		if (growth.startsWith('+')) return '📈';
		if (growth.startsWith('-')) return '📉';
		return '➡️';
	}

	function getGrowthColor(growth: string): string {
		if (growth.startsWith('+')) return '#10B981';
		if (growth.startsWith('-')) return '#EF4444';
		return '#6B7280';
	}
</script>

<div class="metric-card">
	<div class="metric-header">
		<div class="metric-icon">{icon}</div>
		{#if growth}
			<div class="metric-growth" style="color: {getGrowthColor(growth)}">
				<span class="growth-icon">{getGrowthIcon(growth)}</span>
				<span class="growth-text">{growth}</span>
			</div>
		{/if}
	</div>
	
	<div class="metric-content">
		<div class="metric-value">{value}</div>
		<div class="metric-title">{title}</div>
		{#if subtitle}
			<div class="metric-subtitle">{subtitle}</div>
		{/if}
	</div>
</div>

<style>
	.metric-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.metric-card:hover {
		transform: translateY(-4px);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
		border-color: rgba(45, 212, 191, 0.4);
		box-shadow: 0 12px 35px rgba(45, 212, 191, 0.15);
	}

	.metric-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #2DD4BF, #10B981, #7C3AED);
		opacity: 0.6;
	}

	.metric-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	.metric-icon {
		font-size: 2.5rem;
		filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
		line-height: 1;
	}

	.metric-growth {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		font-weight: 600;
		padding: 0.3rem 0.8rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		backdrop-filter: blur(10px);
	}

	.growth-icon {
		font-size: 0.8rem;
	}

	.metric-content {
		text-align: left;
	}

	.metric-value {
		font-size: 2.5rem;
		font-weight: 800;
		color: white;
		font-family: 'Nunito', sans-serif;
		line-height: 1;
		margin-bottom: 0.5rem;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
	}

	.metric-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.3rem;
		font-family: 'Nunito', sans-serif;
	}

	.metric-subtitle {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.metric-card {
			padding: 1.5rem;
		}

		.metric-icon {
			font-size: 2rem;
		}

		.metric-value {
			font-size: 2rem;
		}

		.metric-title {
			font-size: 1rem;
		}

		.metric-subtitle {
			font-size: 0.8rem;
		}

		.metric-growth {
			font-size: 0.8rem;
			padding: 0.2rem 0.6rem;
		}
	}
</style>