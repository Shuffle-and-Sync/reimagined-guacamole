<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import AnalyticsChart from '$lib/components/AnalyticsChart.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';

	// Mock analytics data
	let analyticsData = {
		overview: {
			totalStreams: 47,
			totalViewers: 12547,
			avgViewers: 267,
			totalHours: 156,
			engagement: 8.4,
			growth: '+18.2%',
			topGame: 'Magic: The Gathering',
			bestStream: 'Commander Tournament Finals'
		},
		streaming: {
			weeklyStats: [
				{ date: '2024-11-25', viewers: 234, hours: 4.5, engagement: 7.2 },
				{ date: '2024-11-26', viewers: 289, hours: 5.2, engagement: 8.1 },
				{ date: '2024-11-27', viewers: 312, hours: 6.1, engagement: 9.3 },
				{ date: '2024-11-28', viewers: 278, hours: 4.8, engagement: 8.7 },
				{ date: '2024-11-29', viewers: 341, hours: 5.9, engagement: 9.8 },
				{ date: '2024-11-30', viewers: 298, hours: 5.1, engagement: 8.4 },
				{ date: '2024-12-01', viewers: 356, hours: 6.3, engagement: 10.2 }
			],
			platformBreakdown: [
				{ platform: 'Twitch', viewers: 8945, percentage: 71.3, growth: '+12.4%' },
				{ platform: 'YouTube', viewers: 2458, percentage: 19.6, growth: '+8.7%' },
				{ platform: 'TikTok', viewers: 892, percentage: 7.1, growth: '+23.1%' },
				{ platform: 'Other', viewers: 252, percentage: 2.0, growth: '+5.2%' }
			],
			gameBreakdown: [
				{ game: 'Magic: The Gathering', hours: 89, viewers: 6834, engagement: 9.2 },
				{ game: 'Pokemon TCG', hours: 34, viewers: 2987, engagement: 8.7 },
				{ game: 'Yu-Gi-Oh!', hours: 21, viewers: 1892, engagement: 7.9 },
				{ game: 'Disney Lorcana', hours: 12, viewers: 834, engagement: 8.1 }
			]
		},
		tournaments: {
			hosted: 8,
			participated: 15,
			wins: 4,
			avgPlacement: 3.2,
			totalPrizes: '$1,250',
			recentTournaments: [
				{ name: 'Commander Masters Weekly', placement: 1, prize: '$200', date: '2024-12-01' },
				{ name: 'Pokemon Draft Championship', placement: 3, prize: '$75', date: '2024-11-28' },
				{ name: 'Yu-Gi-Oh! Duel Masters Cup', placement: 2, prize: '$150', date: '2024-11-25' }
			]
		},
		community: {
			followers: 12547,
			activeMembers: 8934,
			messagesSent: 15678,
			eventsCreated: 23,
			avgEventAttendance: 18.4,
			communityGrowth: [
				{ month: 'Sep', followers: 8945, active: 6234 },
				{ month: 'Oct', followers: 10234, active: 7456 },
				{ month: 'Nov', followers: 11567, active: 8123 },
				{ month: 'Dec', followers: 12547, active: 8934 }
			],
			topContributors: [
				{ name: 'MagicMike_Streams', contribution: 234, type: 'messages' },
				{ name: 'PikachuPower_YT', contribution: 8, type: 'events' },
				{ name: 'DuelKing_2024', contribution: 156, type: 'matches' }
			]
		}
	};

	let activeTab = 'overview'; // overview, streaming, tournaments, community
	let dateRange = '30days'; // 7days, 30days, 90days, all

	onMount(() => {
		authStore.checkAuth();
	});

	function exportReport() {
		alert('📊 Analytics report export feature coming soon! Will generate PDF/CSV reports.');
	}

	function shareStats() {
		alert('🔗 Share stats feature coming soon! Create shareable analytics cards for social media.');
	}

	function setGoals() {
		alert('🎯 Goal setting feature coming soon! Set streaming and community growth targets.');
	}

	function getGrowthIcon(growth: string): string {
		return growth.startsWith('+') ? '📈' : growth.startsWith('-') ? '📉' : '➡️';
	}

	function getGrowthColor(growth: string): string {
		return growth.startsWith('+') ? '#10B981' : growth.startsWith('-') ? '#EF4444' : '#6B7280';
	}
</script>

<svelte:head>
	<title>Analytics - Shuffle & Sync</title>
	<meta name="description" content="Track your TCG streaming performance and community growth metrics" />
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
				<a href="/social" class="nav-link">Social</a>
				<a href="/messages" class="nav-link">Messages</a>
				<a href="/calendar" class="nav-link">Calendar</a>
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		<header class="page-header">
			<div class="header-content">
				<div class="header-text">
					<h1 class="hero-title">📊 Analytics Dashboard</h1>
					<p class="hero-subtitle">
						Track your streaming performance, tournament success, and community growth
					</p>
				</div>
				
				<div class="header-actions">
					<div class="date-selector">
						<select bind:value={dateRange}>
							<option value="7days">Last 7 days</option>
							<option value="30days">Last 30 days</option>
							<option value="90days">Last 90 days</option>
							<option value="all">All time</option>
						</select>
					</div>
					
					<button class="btn btn-secondary" on:click={exportReport}>
						<i class="fas fa-download"></i> Export
					</button>
					<button class="btn btn-secondary" on:click={shareStats}>
						<i class="fas fa-share"></i> Share
					</button>
					<button class="btn btn-primary" on:click={setGoals}>
						<i class="fas fa-target"></i> Set Goals
					</button>
				</div>
			</div>
		</header>

		<!-- Analytics Tabs -->
		<div class="analytics-tabs">
			<button 
				class="tab-btn"
				class:active={activeTab === 'overview'}
				on:click={() => activeTab = 'overview'}
			>
				<i class="fas fa-chart-pie"></i> Overview
			</button>
			<button 
				class="tab-btn"
				class:active={activeTab === 'streaming'}
				on:click={() => activeTab = 'streaming'}
			>
				<i class="fas fa-video"></i> Streaming
			</button>
			<button 
				class="tab-btn"
				class:active={activeTab === 'tournaments'}
				on:click={() => activeTab = 'tournaments'}
			>
				<i class="fas fa-trophy"></i> Tournaments
			</button>
			<button 
				class="tab-btn"
				class:active={activeTab === 'community'}
				on:click={() => activeTab = 'community'}
			>
				<i class="fas fa-users"></i> Community
			</button>
		</div>

		<div class="analytics-content">
			{#if activeTab === 'overview'}
				<!-- Overview Tab -->
				<div class="overview-section">
					<div class="metrics-grid">
						<MetricCard 
							icon="🎥"
							title="Total Streams"
							value={analyticsData.overview.totalStreams.toString()}
							subtitle="This month"
							growth={analyticsData.overview.growth}
						/>
						<MetricCard 
							icon="👥"
							title="Total Viewers"
							value={analyticsData.overview.totalViewers.toLocaleString()}
							subtitle="All platforms"
							growth={analyticsData.overview.growth}
						/>
						<MetricCard 
							icon="📈"
							title="Avg Viewers"
							value={analyticsData.overview.avgViewers.toString()}
							subtitle="Per stream"
						/>
						<MetricCard 
							icon="⏱️"
							title="Stream Hours"
							value={analyticsData.overview.totalHours.toString()}
							subtitle="This month"
						/>
						<MetricCard 
							icon="💬"
							title="Engagement Rate"
							value={analyticsData.overview.engagement + '%'}
							subtitle="Avg across platforms"
						/>
						<MetricCard 
							icon="🎮"
							title="Top Game"
							value={analyticsData.overview.topGame}
							subtitle="Most streamed"
						/>
					</div>

					<div class="charts-section">
						<div class="chart-container">
							<h3 class="chart-title">📈 Weekly Performance</h3>
							<AnalyticsChart 
								data={analyticsData.streaming.weeklyStats}
								type="line"
								xKey="date"
								yKey="viewers"
								color="#2DD4BF"
							/>
						</div>

						<div class="chart-container">
							<h3 class="chart-title">🎯 Platform Distribution</h3>
							<div class="platform-breakdown">
								{#each analyticsData.streaming.platformBreakdown as platform}
									<div class="platform-stat">
										<div class="platform-info">
											<div class="platform-name">{platform.platform}</div>
											<div class="platform-viewers">{platform.viewers.toLocaleString()} viewers</div>
										</div>
										<div class="platform-percentage">{platform.percentage}%</div>
										<div class="platform-growth" style="color: {getGrowthColor(platform.growth)}">
											{getGrowthIcon(platform.growth)} {platform.growth}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>

			{:else if activeTab === 'streaming'}
				<!-- Streaming Tab -->
				<div class="streaming-section">
					<div class="metrics-grid">
						<MetricCard 
							icon="📺"
							title="Total Streams"
							value={analyticsData.overview.totalStreams.toString()}
							subtitle="This period"
						/>
						<MetricCard 
							icon="👁️"
							title="Peak Viewers"
							value="2,847"
							subtitle="Highest concurrent"
							growth="+23.4%"
						/>
						<MetricCard 
							icon="⏰"
							title="Avg Stream Time"
							value="3.3h"
							subtitle="Per session"
						/>
						<MetricCard 
							icon="🔥"
							title="Best Stream"
							value="Commander Finals"
							subtitle="2,847 peak viewers"
						/>
					</div>

					<div class="charts-section">
						<div class="chart-container full-width">
							<h3 class="chart-title">📊 Daily Streaming Statistics</h3>
							<AnalyticsChart 
								data={analyticsData.streaming.weeklyStats}
								type="bar"
								xKey="date"
								yKey="viewers"
								color="#7C3AED"
							/>
						</div>

						<div class="game-breakdown">
							<h3 class="section-title">🎮 Game Performance</h3>
							{#each analyticsData.streaming.gameBreakdown as game}
								<div class="game-stat-card">
									<div class="game-header">
										<div class="game-name">{game.game}</div>
										<div class="game-hours">{game.hours}h streamed</div>
									</div>
									<div class="game-metrics">
										<div class="game-viewers">{game.viewers.toLocaleString()} viewers</div>
										<div class="game-engagement">{game.engagement}% engagement</div>
									</div>
									<div class="game-progress-bar">
										<div class="game-progress" style="width: {(game.hours / 89) * 100}%; background: #2DD4BF;"></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

			{:else if activeTab === 'tournaments'}
				<!-- Tournaments Tab -->
				<div class="tournaments-section">
					<div class="metrics-grid">
						<MetricCard 
							icon="🏆"
							title="Tournaments Hosted"
							value={analyticsData.tournaments.hosted.toString()}
							subtitle="This month"
						/>
						<MetricCard 
							icon="🎯"
							title="Participated"
							value={analyticsData.tournaments.participated.toString()}
							subtitle="Total events"
						/>
						<MetricCard 
							icon="👑"
							title="Wins"
							value={analyticsData.tournaments.wins.toString()}
							subtitle="1st place finishes"
						/>
						<MetricCard 
							icon="📊"
							title="Avg Placement"
							value={analyticsData.tournaments.avgPlacement.toString()}
							subtitle="Overall ranking"
						/>
						<MetricCard 
							icon="💰"
							title="Total Prizes"
							value={analyticsData.tournaments.totalPrizes}
							subtitle="Prize winnings"
						/>
					</div>

					<div class="tournaments-list">
						<h3 class="section-title">🏅 Recent Tournament Results</h3>
						{#each analyticsData.tournaments.recentTournaments as tournament}
							<div class="tournament-result">
								<div class="tournament-info">
									<div class="tournament-name">{tournament.name}</div>
									<div class="tournament-date">{new Date(tournament.date).toLocaleDateString()}</div>
								</div>
								<div class="tournament-placement">
									<div class="placement-badge placement-{tournament.placement}">
										#{tournament.placement}
									</div>
								</div>
								<div class="tournament-prize">{tournament.prize}</div>
							</div>
						{/each}
					</div>
				</div>

			{:else if activeTab === 'community'}
				<!-- Community Tab -->
				<div class="community-section">
					<div class="metrics-grid">
						<MetricCard 
							icon="👥"
							title="Total Followers"
							value={analyticsData.community.followers.toLocaleString()}
							subtitle="Across all platforms"
							growth="+12.3%"
						/>
						<MetricCard 
							icon="🔥"
							title="Active Members"
							value={analyticsData.community.activeMembers.toLocaleString()}
							subtitle="Monthly active"
						/>
						<MetricCard 
							icon="💬"
							title="Messages Sent"
							value={analyticsData.community.messagesSent.toLocaleString()}
							subtitle="Community chat"
						/>
						<MetricCard 
							icon="📅"
							title="Events Created"
							value={analyticsData.community.eventsCreated.toString()}
							subtitle="This month"
						/>
						<MetricCard 
							icon="🎯"
							title="Avg Attendance"
							value={analyticsData.community.avgEventAttendance.toString()}
							subtitle="Per event"
						/>
					</div>

					<div class="charts-section">
						<div class="chart-container">
							<h3 class="chart-title">📈 Community Growth</h3>
							<AnalyticsChart 
								data={analyticsData.community.communityGrowth}
								type="area"
								xKey="month"
								yKey="followers"
								color="#10B981"
							/>
						</div>

						<div class="contributors-section">
							<h3 class="section-title">⭐ Top Contributors</h3>
							{#each analyticsData.community.topContributors as contributor}
								<div class="contributor-card">
									<div class="contributor-avatar">
										{contributor.name.charAt(0)}
									</div>
									<div class="contributor-info">
										<div class="contributor-name">{contributor.name}</div>
										<div class="contributor-stat">
											{contributor.contribution} {contributor.type}
										</div>
									</div>
									<div class="contributor-badge">
										{contributor.type === 'messages' ? '💬' : 
										 contributor.type === 'events' ? '📅' : '⚔️'}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	/* Navigation */
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

	/* Header */
	.page-header {
		margin-bottom: 3rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.header-text {
		text-align: left;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.date-selector select {
		padding: 0.8rem 1.2rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	/* Tabs */
	.analytics-tabs {
		display: flex;
		gap: 1rem;
		margin-bottom: 3rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.tab-btn {
		padding: 1rem 2rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		backdrop-filter: blur(15px);
	}

	.tab-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: white;
		border-color: rgba(45, 212, 191, 0.4);
	}

	.tab-btn.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		border-color: #2DD4BF;
		box-shadow: 0 4px 20px rgba(45, 212, 191, 0.3);
	}

	/* Content Sections */
	.analytics-content {
		max-width: 1400px;
		margin: 0 auto;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.charts-section {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.chart-container {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.chart-container.full-width {
		grid-column: 1 / -1;
	}

	.chart-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: white;
	}

	.section-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
		text-align: center;
	}

	/* Platform Breakdown */
	.platform-breakdown {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.platform-stat {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
	}

	.platform-name {
		font-weight: 600;
		color: white;
	}

	.platform-viewers {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.platform-percentage {
		font-weight: 700;
		color: #2DD4BF;
	}

	.platform-growth {
		font-size: 0.9rem;
		font-weight: 600;
	}

	/* Game Breakdown */
	.game-breakdown {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
	}

	.game-stat-card {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		transition: all 0.3s ease;
	}

	.game-stat-card:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.game-name {
		font-weight: 700;
		color: white;
	}

	.game-hours {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.game-metrics {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.game-viewers {
		color: #2DD4BF;
		font-weight: 600;
	}

	.game-engagement {
		color: #7C3AED;
		font-weight: 600;
	}

	.game-progress-bar {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		overflow: hidden;
	}

	.game-progress {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	/* Tournaments */
	.tournaments-list {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
	}

	.tournament-result {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 1rem;
		align-items: center;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		margin-bottom: 1rem;
	}

	.tournament-name {
		font-weight: 700;
		color: white;
		margin-bottom: 0.3rem;
	}

	.tournament-date {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.placement-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 700;
		color: white;
	}

	.placement-1 { background: #FFD700; color: #000; }
	.placement-2 { background: #C0C0C0; color: #000; }
	.placement-3 { background: #CD7F32; }

	.tournament-prize {
		font-weight: 600;
		color: #10B981;
	}

	/* Contributors */
	.contributors-section {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
	}

	.contributor-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		margin-bottom: 1rem;
		transition: all 0.3s ease;
	}

	.contributor-card:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
	}

	.contributor-avatar {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: white;
	}

	.contributor-info {
		flex: 1;
	}

	.contributor-name {
		font-weight: 600;
		color: white;
		margin-bottom: 0.2rem;
	}

	.contributor-stat {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.contributor-badge {
		font-size: 1.5rem;
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

		.header-content {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}

		.header-actions {
			justify-content: center;
			flex-wrap: wrap;
		}

		.analytics-tabs {
			flex-direction: column;
			align-items: stretch;
		}

		.metrics-grid {
			grid-template-columns: 1fr;
		}

		.charts-section {
			grid-template-columns: 1fr;
		}

		.platform-stat,
		.tournament-result {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.game-header,
		.game-metrics {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>