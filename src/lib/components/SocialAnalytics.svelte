<script lang="ts">
	export let data: {
		totalFollowers: number;
		totalReach: number;
		totalEngagement: number;
		topPlatform: string;
		recentGrowth: string;
		bestPerformingPost: string;
		platformBreakdown: any[];
	};
</script>

<section class="analytics-section">
	<div class="section-header">
		<h2 class="section-title">📊 Social Analytics</h2>
		<p class="section-subtitle">Track your TCG streaming community growth and engagement</p>
	</div>

	<!-- Overview Stats -->
	<div class="overview-stats">
		<div class="stat-card highlighted">
			<div class="stat-icon">👥</div>
			<div class="stat-info">
				<div class="stat-value">{data.totalFollowers.toLocaleString()}</div>
				<div class="stat-label">Total Followers</div>
				<div class="stat-growth positive">{data.recentGrowth} this month</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">👁️</div>
			<div class="stat-info">
				<div class="stat-value">{data.totalReach.toLocaleString()}</div>
				<div class="stat-label">Monthly Reach</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">❤️</div>
			<div class="stat-info">
				<div class="stat-value">{data.totalEngagement}%</div>
				<div class="stat-label">Avg Engagement Rate</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🏆</div>
			<div class="stat-info">
				<div class="stat-value">{data.topPlatform}</div>
				<div class="stat-label">Top Platform</div>
				<div class="stat-growth">Best performing</div>
			</div>
		</div>
	</div>

	<!-- Platform Breakdown -->
	<div class="platform-analytics">
		<h3 class="analytics-title">📈 Platform Performance</h3>
		
		<div class="platform-stats">
			{#each data.platformBreakdown as platform}
				<div class="platform-stat-card">
					<div class="platform-header">
						<h4 class="platform-name">{platform.platform}</h4>
						<div class="platform-growth" class:positive={platform.growth.includes('+')} class:negative={platform.growth.includes('-')}>
							{platform.growth}
						</div>
					</div>
					
					<div class="platform-metrics">
						<div class="metric">
							<div class="metric-value">{platform.followers.toLocaleString()}</div>
							<div class="metric-label">Followers</div>
						</div>
						<div class="metric">
							<div class="metric-value">{platform.engagement}%</div>
							<div class="metric-label">Engagement</div>
						</div>
					</div>

					<!-- Simple engagement bar visualization -->
					<div class="engagement-bar">
						<div class="engagement-fill" style="width: {platform.engagement}%"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Content Performance -->
	<div class="content-performance">
		<h3 class="analytics-title">🎯 Content Insights</h3>
		
		<div class="insights-grid">
			<div class="insight-card">
				<div class="insight-header">
					<h4 class="insight-title">🔥 Top Performing Post</h4>
				</div>
				<div class="insight-content">
					<div class="post-preview">"{data.bestPerformingPost}"</div>
					<div class="post-stats">
						<span class="post-stat">1.2K likes</span>
						<span class="post-stat">340 shares</span>
						<span class="post-stat">156 comments</span>
					</div>
				</div>
			</div>

			<div class="insight-card">
				<div class="insight-header">
					<h4 class="insight-title">⏰ Best Posting Times</h4>
				</div>
				<div class="insight-content">
					<div class="time-slots">
						<div class="time-slot best">
							<div class="time">6-8 PM</div>
							<div class="engagement">12.4% engagement</div>
						</div>
						<div class="time-slot good">
							<div class="time">12-2 PM</div>
							<div class="engagement">9.8% engagement</div>
						</div>
						<div class="time-slot decent">
							<div class="time">8-10 AM</div>
							<div class="engagement">7.2% engagement</div>
						</div>
					</div>
				</div>
			</div>

			<div class="insight-card">
				<div class="insight-header">
					<h4 class="insight-title">📱 Top Hashtags</h4>
				</div>
				<div class="insight-content">
					<div class="hashtag-list">
						<div class="hashtag-item">#MTG <span class="usage">45 posts</span></div>
						<div class="hashtag-item">#Commander <span class="usage">38 posts</span></div>
						<div class="hashtag-item">#TCG <span class="usage">52 posts</span></div>
						<div class="hashtag-item">#Streaming <span class="usage">41 posts</span></div>
					</div>
				</div>
			</div>

			<div class="insight-card">
				<div class="insight-header">
					<h4 class="insight-title">📊 Content Types</h4>
				</div>
				<div class="insight-content">
					<div class="content-types">
						<div class="content-type">
							<div class="type-name">Tournament Highlights</div>
							<div class="type-performance">18.2% avg engagement</div>
						</div>
						<div class="content-type">
							<div class="type-name">Deck Tech Videos</div>
							<div class="type-performance">15.7% avg engagement</div>
						</div>
						<div class="content-type">
							<div class="type-name">Stream Announcements</div>
							<div class="type-performance">11.3% avg engagement</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.analytics-section {
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.section-title {
		font-family: 'Nunito', sans-serif;
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: #2DD4BF;
	}

	.section-subtitle {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
	}

	/* Overview Stats */
	.overview-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.stat-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		display: flex;
		align-items: center;
		gap: 1rem;
		color: white;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(45, 212, 191, 0.15);
	}

	.stat-card.highlighted {
		border-color: rgba(45, 212, 191, 0.4);
		background: linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(16, 185, 129, 0.1));
	}

	.stat-icon {
		font-size: 2rem;
		filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
	}

	.stat-value {
		font-size: 1.8rem;
		font-weight: 700;
		color: white;
		font-family: 'Nunito', sans-serif;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 0.2rem;
	}

	.stat-growth {
		font-size: 0.8rem;
		margin-top: 0.2rem;
		font-weight: 500;
	}

	.stat-growth.positive {
		color: #10B981;
	}

	/* Platform Analytics */
	.platform-analytics {
		margin-bottom: 3rem;
	}

	.analytics-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: white;
		text-align: center;
	}

	.platform-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.platform-stat-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
	}

	.platform-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.platform-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
	}

	.platform-growth {
		font-size: 0.9rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
	}

	.platform-growth.positive {
		background: rgba(16, 185, 129, 0.2);
		color: #10B981;
	}

	.platform-growth.negative {
		background: rgba(239, 68, 68, 0.2);
		color: #EF4444;
	}

	.platform-metrics {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.metric {
		text-align: center;
	}

	.metric-value {
		font-size: 1.3rem;
		font-weight: 700;
		font-family: 'Nunito', sans-serif;
	}

	.metric-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 0.2rem;
	}

	.engagement-bar {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		overflow: hidden;
	}

	.engagement-fill {
		height: 100%;
		background: linear-gradient(90deg, #2DD4BF, #10B981);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	/* Content Performance */
	.content-performance {
		margin-bottom: 3rem;
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.insight-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
	}

	.insight-header {
		margin-bottom: 1rem;
	}

	.insight-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: #2DD4BF;
	}

	.post-preview {
		font-style: italic;
		margin-bottom: 1rem;
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
	}

	.post-stats {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.post-stat {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.time-slots {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.time-slot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem;
		border-radius: 8px;
	}

	.time-slot.best {
		background: rgba(16, 185, 129, 0.2);
		border-left: 3px solid #10B981;
	}

	.time-slot.good {
		background: rgba(245, 158, 11, 0.2);
		border-left: 3px solid #F59E0B;
	}

	.time-slot.decent {
		background: rgba(107, 114, 128, 0.2);
		border-left: 3px solid #6B7280;
	}

	.time {
		font-weight: 600;
	}

	.engagement {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.hashtag-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.hashtag-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 6px;
	}

	.usage {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.content-types {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.content-type {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 8px;
		border-left: 3px solid #7C3AED;
	}

	.type-name {
		font-weight: 500;
	}

	.type-performance {
		font-size: 0.9rem;
		color: #7C3AED;
		font-weight: 600;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.overview-stats,
		.platform-stats,
		.insights-grid {
			grid-template-columns: 1fr;
		}

		.platform-metrics {
			flex-direction: column;
			gap: 1rem;
		}

		.post-stats {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>