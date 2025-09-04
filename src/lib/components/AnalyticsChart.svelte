<script lang="ts">
	export let data: any[];
	export let type: 'line' | 'bar' | 'area' = 'line';
	export let xKey: string;
	export let yKey: string;
	export let color: string = '#2DD4BF';

	// Simple chart implementation for demonstration
	// In a real app, you'd use a library like Chart.js or D3
	
	let maxValue = Math.max(...data.map(d => d[yKey]));
	let minValue = Math.min(...data.map(d => d[yKey]));
	let range = maxValue - minValue;

	function getYPosition(value: number): number {
		return 100 - ((value - minValue) / range) * 100;
	}

	function formatXValue(value: string | Date): string {
		if (value instanceof Date) {
			return value.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
		return value.toString();
	}

	function formatYValue(value: number): string {
		if (value >= 1000) {
			return (value / 1000).toFixed(1) + 'k';
		}
		return value.toString();
	}

	// Generate path for line chart
	$: linePath = data.map((d, i) => {
		const x = (i / (data.length - 1)) * 100;
		const y = getYPosition(d[yKey]);
		return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
	}).join(' ');

	// Generate area path
	$: areaPath = `${linePath} L 100 100 L 0 100 Z`;
</script>

<div class="chart-container">
	<div class="chart-wrapper">
		<svg viewBox="0 0 100 100" class="chart-svg">
			{#if type === 'line'}
				<!-- Line Chart -->
				<defs>
					<linearGradient id="line-gradient" gradientUnits="userSpaceOnUse">
						<stop offset="0%" stop-color={color} stop-opacity="0.8"/>
						<stop offset="100%" stop-color={color} stop-opacity="0.4"/>
					</linearGradient>
				</defs>
				<path
					d={linePath}
					fill="none"
					stroke="url(#line-gradient)"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<!-- Data points -->
				{#each data as point, i}
					<circle
						cx={i / (data.length - 1) * 100}
						cy={getYPosition(point[yKey])}
						r="1.5"
						fill={color}
						stroke="white"
						stroke-width="0.5"
					/>
				{/each}

			{:else if type === 'bar'}
				<!-- Bar Chart -->
				{#each data as point, i}
					<rect
						x={i / data.length * 100}
						y={getYPosition(point[yKey])}
						width={80 / data.length}
						height={100 - getYPosition(point[yKey])}
						fill={color}
						opacity="0.8"
						rx="1"
					/>
				{/each}

			{:else if type === 'area'}
				<!-- Area Chart -->
				<defs>
					<linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stop-color={color} stop-opacity="0.6"/>
						<stop offset="100%" stop-color={color} stop-opacity="0.1"/>
					</linearGradient>
				</defs>
				<path
					d={areaPath}
					fill="url(#area-gradient)"
				/>
				<path
					d={linePath}
					fill="none"
					stroke={color}
					stroke-width="2"
				/>
			{/if}
		</svg>
	</div>

	<!-- Chart Labels -->
	<div class="chart-labels">
		{#each data.slice(0, Math.min(data.length, 7)) as point, i}
			<div class="label" style="left: {(i / Math.min(data.length - 1, 6)) * 100}%">
				{formatXValue(point[xKey])}
			</div>
		{/each}
	</div>

	<!-- Y-axis labels -->
	<div class="y-labels">
		<div class="y-label y-max">{formatYValue(maxValue)}</div>
		<div class="y-label y-mid">{formatYValue((maxValue + minValue) / 2)}</div>
		<div class="y-label y-min">{formatYValue(minValue)}</div>
	</div>
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 300px;
		margin: 1rem 0;
	}

	.chart-wrapper {
		position: relative;
		width: 100%;
		height: calc(100% - 30px);
		padding: 20px 30px 10px 30px;
	}

	.chart-svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.chart-labels {
		position: absolute;
		bottom: 0;
		left: 30px;
		right: 30px;
		height: 30px;
		display: flex;
		align-items: center;
	}

	.label {
		position: absolute;
		transform: translateX(-50%);
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
	}

	.y-labels {
		position: absolute;
		left: 0;
		top: 20px;
		bottom: 40px;
		width: 25px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.y-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		text-align: right;
		transform: translateY(-50%);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.chart-container {
			height: 250px;
		}

		.chart-wrapper {
			padding: 15px 25px 10px 25px;
		}

		.label {
			font-size: 0.7rem;
		}

		.y-label {
			font-size: 0.7rem;
		}
	}
</style>