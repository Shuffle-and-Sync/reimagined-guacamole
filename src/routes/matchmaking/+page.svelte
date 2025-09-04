<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import MatchmakingQueue from '$lib/components/MatchmakingQueue.svelte';
	import MatchHistoryCard from '$lib/components/MatchHistoryCard.svelte';

	// Mock user preferences (would come from profile)
	let userPreferences = {
		primaryGame: 'Magic: The Gathering',
		preferredFormats: ['Commander', 'Modern'],
		skillLevel: 'Advanced',
		availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
		preferredTimes: ['Evening (6-10 PM)', 'Night (10 PM+)'],
		powerLevel: 7,
		playStyle: 'Competitive-Casual',
		maxDistance: 'Online Only',
		languages: ['English']
	};

	// Mock matchmaking data
	let matchmakingData = {
		currentMatch: null,
		isInQueue: false,
		queueTime: 0,
		estimatedWait: 0,
		activeQueues: [
			{
				id: 'mtg-commander-7',
				game: 'Magic: The Gathering',
				format: 'Commander',
				powerLevel: '6-8',
				playersInQueue: 12,
				averageWait: '3 minutes',
				icon: '🔮'
			},
			{
				id: 'pokemon-competitive',
				game: 'Pokemon TCG',
				format: 'Standard',
				powerLevel: 'Competitive',
				playersInQueue: 8,
				averageWait: '5 minutes',
				icon: '⚡'
			},
			{
				id: 'yugioh-casual',
				game: 'Yu-Gi-Oh!',
				format: 'Traditional',
				powerLevel: 'Casual',
				playersInQueue: 6,
				averageWait: '7 minutes',
				icon: '⚔️'
			}
		],
		availableOpponents: [
			{
				id: '1',
				username: 'MagicMike_Streams',
				game: 'Magic: The Gathering',
				format: 'Commander',
				skillLevel: 'Advanced',
				powerLevel: 7,
				matchCompatibility: 95,
				status: 'online',
				preferredTime: 'Evening',
				averageGameTime: '90 minutes',
				winRate: 68,
				gamesPlayed: 234
			},
			{
				id: '2',
				username: 'CommanderQueen_2024',
				game: 'Magic: The Gathering',
				format: 'Commander',
				skillLevel: 'Expert',
				powerLevel: 8,
				matchCompatibility: 87,
				status: 'online',
				preferredTime: 'Night',
				averageGameTime: '120 minutes',
				winRate: 73,
				gamesPlayed: 156
			},
			{
				id: '3',
				username: 'ModernMaster_Pro',
				game: 'Magic: The Gathering',
				format: 'Modern',
				skillLevel: 'Advanced',
				powerLevel: 'Competitive',
				matchCompatibility: 82,
				status: 'online',
				preferredTime: 'Evening',
				averageGameTime: '45 minutes',
				winRate: 71,
				gamesPlayed: 189
			}
		],
		matchHistory: [
			{
				id: '1',
				opponent: 'DuelKing_Elite',
				game: 'Magic: The Gathering',
				format: 'Commander',
				result: 'win',
				duration: '95 minutes',
				date: new Date('2024-12-02T19:30:00'),
				powerLevel: 7,
				rating: 4.8,
				notes: 'Great game! Very interactive and fun.'
			},
			{
				id: '2',
				opponent: 'PikachuPower_YT',
				game: 'Pokemon TCG',
				format: 'Standard',
				result: 'loss',
				duration: '35 minutes',
				date: new Date('2024-12-01T20:15:00'),
				rating: 4.5,
				notes: 'Close game, learned a lot about the matchup.'
			},
			{
				id: '3',
				opponent: 'SpellSlinger_99',
				game: 'Magic: The Gathering',
				format: 'Modern',
				result: 'win',
				duration: '42 minutes',
				date: new Date('2024-11-30T18:45:00'),
				rating: 4.9,
				notes: 'Excellent opponent, very skilled and friendly.'
			}
		]
	};

	let queueTimer: number;
	let selectedQueue = '';
	let customMatchPrefs = {
		game: userPreferences.primaryGame,
		format: userPreferences.preferredFormats[0] || '',
		powerLevel: userPreferences.powerLevel,
		maxWaitTime: 10,
		preferredTime: 'now',
		allowSpectators: true
	};

	onMount(() => {
		authStore.checkAuth();
	});

	function joinQueue(queueId: string) {
		if (matchmakingData.isInQueue) {
			alert('⚠️ You are already in a matchmaking queue.');
			return;
		}

		const queue = matchmakingData.activeQueues.find(q => q.id === queueId);
		if (!queue) return;

		matchmakingData.isInQueue = true;
		matchmakingData.queueTime = 0;
		matchmakingData.estimatedWait = parseInt(queue.averageWait) * 60; // Convert to seconds
		selectedQueue = queueId;

		// Start queue timer
		queueTimer = setInterval(() => {
			matchmakingData.queueTime++;
			matchmakingData = { ...matchmakingData }; // Trigger reactivity
		}, 1000);

		alert(`🎮 Joined ${queue.game} ${queue.format} queue! Looking for opponents...`);

		// Simulate finding match after random time
		const findMatchTime = Math.random() * 30000 + 10000; // 10-40 seconds
		setTimeout(() => {
			if (matchmakingData.isInQueue) {
				findMatch();
			}
		}, findMatchTime);
	}

	function leaveQueue() {
		if (!matchmakingData.isInQueue) return;

		clearInterval(queueTimer);
		matchmakingData.isInQueue = false;
		matchmakingData.queueTime = 0;
		matchmakingData.estimatedWait = 0;
		selectedQueue = '';

		alert('❌ Left matchmaking queue.');
	}

	function findMatch() {
		if (!matchmakingData.isInQueue) return;

		clearInterval(queueTimer);
		matchmakingData.isInQueue = false;

		// Select a random opponent from available ones
		const opponents = matchmakingData.availableOpponents.filter(opp => 
			opp.game === customMatchPrefs.game && 
			opp.format === customMatchPrefs.format
		);
		
		if (opponents.length === 0) {
			alert('❌ No suitable opponents found. Please try again later.');
			return;
		}

		const opponent = opponents[Math.floor(Math.random() * opponents.length)];
		
		matchmakingData.currentMatch = {
			opponent: opponent.username,
			game: customMatchPrefs.game,
			format: customMatchPrefs.format,
			powerLevel: customMatchPrefs.powerLevel,
			startTime: new Date(),
			matchId: Date.now().toString()
		};

		alert(`🎯 Match found! You're matched with ${opponent.username} for ${customMatchPrefs.game} ${customMatchPrefs.format}`);
	}

	function directChallenge(opponentId: string) {
		const opponent = matchmakingData.availableOpponents.find(o => o.id === opponentId);
		if (!opponent) return;

		if (confirm(`🎲 Send match challenge to ${opponent.username}?`)) {
			alert(`📤 Challenge sent to ${opponent.username}! They'll be notified and can accept/decline.`);
		}
	}

	function completeMatch(result: 'win' | 'loss' | 'draw') {
		if (!matchmakingData.currentMatch) return;

		const newMatch = {
			id: Date.now().toString(),
			opponent: matchmakingData.currentMatch.opponent,
			game: matchmakingData.currentMatch.game,
			format: matchmakingData.currentMatch.format,
			result: result,
			duration: Math.floor((new Date().getTime() - matchmakingData.currentMatch.startTime.getTime()) / 1000 / 60) + ' minutes',
			date: new Date(),
			powerLevel: matchmakingData.currentMatch.powerLevel,
			rating: 0,
			notes: ''
		};

		matchmakingData.matchHistory = [newMatch, ...matchmakingData.matchHistory];
		matchmakingData.currentMatch = null;

		alert(`✅ Match recorded as ${result}! Thanks for playing.`);
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getCompatibilityColor(compatibility: number): string {
		if (compatibility >= 90) return '#10B981';
		if (compatibility >= 75) return '#F59E0B';
		return '#EF4444';
	}

	function getCompatibilityIcon(compatibility: number): string {
		if (compatibility >= 90) return '🔥';
		if (compatibility >= 75) return '✅';
		return '⚠️';
	}
</script>

<svelte:head>
	<title>Matchmaking - Shuffle & Sync</title>
	<meta name="description" content="Find TCG opponents based on your skill level, preferences, and availability" />
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
				<a href="/analytics" class="nav-link">Analytics</a>
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		<header class="page-header">
			<h1 class="hero-title">🎯 Smart Matchmaking</h1>
			<p class="hero-subtitle">
				Find the perfect TCG opponents based on your skill level, preferences, and availability
			</p>
		</header>

		<!-- Current Match Status -->
		{#if matchmakingData.currentMatch}
			<div class="current-match">
				<div class="match-header">
					<h3>🎮 Current Match</h3>
					<div class="match-time">
						Started {matchmakingData.currentMatch.startTime.toLocaleTimeString()}
					</div>
				</div>
				<div class="match-details">
					<div class="match-info">
						<span class="match-opponent">{matchmakingData.currentMatch.opponent}</span>
						<span class="match-game">{matchmakingData.currentMatch.game} - {matchmakingData.currentMatch.format}</span>
						<span class="match-power">Power Level {matchmakingData.currentMatch.powerLevel}</span>
					</div>
					<div class="match-actions">
						<button class="btn btn-success btn-sm" on:click={() => completeMatch('win')}>
							<i class="fas fa-trophy"></i> I Won
						</button>
						<button class="btn btn-secondary btn-sm" on:click={() => completeMatch('draw')}>
							<i class="fas fa-handshake"></i> Draw
						</button>
						<button class="btn btn-danger btn-sm" on:click={() => completeMatch('loss')}>
							<i class="fas fa-flag"></i> I Lost
						</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="matchmaking-layout">
			<!-- Matchmaking Main -->
			<div class="matchmaking-main">
				<!-- Queue Status -->
				{#if matchmakingData.isInQueue}
					<MatchmakingQueue
						queueTime={matchmakingData.queueTime}
						estimatedWait={matchmakingData.estimatedWait}
						selectedQueue={matchmakingData.activeQueues.find(q => q.id === selectedQueue)}
						onLeaveQueue={leaveQueue}
					/>
				{:else if !matchmakingData.currentMatch}
					<!-- Active Queues -->
					<div class="queues-section">
						<h3 class="section-title">🚀 Active Queues</h3>
						<div class="queues-grid">
							{#each matchmakingData.activeQueues as queue}
								<div class="queue-card">
									<div class="queue-header">
										<div class="queue-icon">{queue.icon}</div>
										<div class="queue-info">
											<div class="queue-name">{queue.game}</div>
											<div class="queue-format">{queue.format}</div>
										</div>
									</div>
									<div class="queue-stats">
										<div class="stat-item">
											<span class="stat-value">{queue.playersInQueue}</span>
											<span class="stat-label">in queue</span>
										</div>
										<div class="stat-item">
											<span class="stat-value">{queue.averageWait}</span>
											<span class="stat-label">avg wait</span>
										</div>
									</div>
									<div class="queue-power">{queue.powerLevel}</div>
									<button 
										class="btn btn-primary btn-sm queue-join-btn"
										on:click={() => joinQueue(queue.id)}
									>
										<i class="fas fa-play"></i> Join Queue
									</button>
								</div>
							{/each}
						</div>
					</div>

					<!-- Available Opponents -->
					<div class="opponents-section">
						<h3 class="section-title">👥 Available Opponents</h3>
						<div class="opponents-list">
							{#each matchmakingData.availableOpponents as opponent}
								<div class="opponent-card">
									<div class="opponent-header">
										<div class="opponent-avatar">{opponent.username.charAt(0)}</div>
										<div class="opponent-info">
											<div class="opponent-name">{opponent.username}</div>
											<div class="opponent-game">{opponent.game} - {opponent.format}</div>
										</div>
										<div class="opponent-status" class:online={opponent.status === 'online'}>
											{opponent.status === 'online' ? '🟢' : '🔴'}
										</div>
									</div>

									<div class="opponent-stats">
										<div class="stat-row">
											<span class="stat-label">Skill:</span>
											<span class="stat-value">{opponent.skillLevel}</span>
										</div>
										<div class="stat-row">
											<span class="stat-label">Power Level:</span>
											<span class="stat-value">{opponent.powerLevel}</span>
										</div>
										<div class="stat-row">
											<span class="stat-label">Win Rate:</span>
											<span class="stat-value">{opponent.winRate}%</span>
										</div>
									</div>

									<div class="compatibility-score" style="color: {getCompatibilityColor(opponent.matchCompatibility)}">
										<span class="compatibility-icon">{getCompatibilityIcon(opponent.matchCompatibility)}</span>
										<span class="compatibility-text">{opponent.matchCompatibility}% match</span>
									</div>

									<button 
										class="btn btn-secondary btn-sm challenge-btn"
										on:click={() => directChallenge(opponent.id)}
									>
										<i class="fas fa-sword"></i> Challenge
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Matchmaking Sidebar -->
			<div class="matchmaking-sidebar">
				<!-- Quick Stats -->
				<div class="sidebar-card">
					<h4 class="sidebar-title">📊 Your Stats</h4>
					<div class="quick-stats">
						<div class="quick-stat">
							<div class="stat-value">73%</div>
							<div class="stat-label">Win Rate</div>
						</div>
						<div class="quick-stat">
							<div class="stat-value">156</div>
							<div class="stat-label">Games Played</div>
						</div>
						<div class="quick-stat">
							<div class="stat-value">1,847</div>
							<div class="stat-label">Rating</div>
						</div>
					</div>
				</div>

				<!-- Match Preferences -->
				<div class="sidebar-card">
					<h4 class="sidebar-title">⚙️ Quick Preferences</h4>
					<div class="prefs-form">
						<div class="pref-group">
							<label>Game</label>
							<select bind:value={customMatchPrefs.game}>
								<option value="Magic: The Gathering">Magic: The Gathering</option>
								<option value="Pokemon TCG">Pokemon TCG</option>
								<option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
								<option value="Disney Lorcana">Disney Lorcana</option>
							</select>
						</div>
						<div class="pref-group">
							<label>Format</label>
							<select bind:value={customMatchPrefs.format}>
								{#if customMatchPrefs.game === 'Magic: The Gathering'}
									<option value="Commander">Commander</option>
									<option value="Modern">Modern</option>
									<option value="Standard">Standard</option>
									<option value="Draft">Draft</option>
								{:else if customMatchPrefs.game === 'Pokemon TCG'}
									<option value="Standard">Standard</option>
									<option value="Expanded">Expanded</option>
									<option value="Unlimited">Unlimited</option>
								{:else}
									<option value="Traditional">Traditional</option>
									<option value="Advanced">Advanced</option>
								{/if}
							</select>
						</div>
						<div class="pref-group">
							<label>Power Level</label>
							<input type="range" min="1" max="10" bind:value={customMatchPrefs.powerLevel} />
							<div class="power-display">{customMatchPrefs.powerLevel}/10</div>
						</div>
					</div>
				</div>

				<!-- Recent Matches -->
				<div class="sidebar-card">
					<h4 class="sidebar-title">🕐 Recent Matches</h4>
					<div class="recent-matches">
						{#each matchmakingData.matchHistory.slice(0, 3) as match}
							<MatchHistoryCard {match} isCompact={true} />
						{/each}
					</div>
					<a href="/profile" class="view-all-link">View all matches →</a>
				</div>
			</div>
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

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	/* Current Match */
	.current-match {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
		border: 2px solid rgba(16, 185, 129, 0.4);
		border-radius: 14px;
		padding: 2rem;
		margin-bottom: 3rem;
		color: white;
	}

	.match-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.match-header h3 {
		margin: 0;
		color: #10B981;
		font-size: 1.3rem;
	}

	.match-time {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.match-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.match-info {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.match-opponent {
		font-size: 1.2rem;
		font-weight: 700;
		color: white;
	}

	.match-game {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.match-power {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.match-actions {
		display: flex;
		gap: 0.5rem;
	}

	/* Layout */
	.matchmaking-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.matchmaking-main {
		min-width: 0;
	}

	/* Sections */
	.section-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
	}

	/* Queues */
	.queues-section {
		margin-bottom: 3rem;
	}

	.queues-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.queue-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		color: white;
		transition: all 0.3s ease;
		position: relative;
	}

	.queue-card:hover {
		transform: translateY(-2px);
		border-color: rgba(45, 212, 191, 0.4);
	}

	.queue-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.queue-icon {
		font-size: 2rem;
	}

	.queue-name {
		font-weight: 700;
		font-size: 1.1rem;
	}

	.queue-format {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.queue-stats {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.2rem;
		font-weight: 700;
		color: #2DD4BF;
	}

	.stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.queue-power {
		text-align: center;
		margin-bottom: 1rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 600;
	}

	.queue-join-btn {
		width: 100%;
	}

	/* Opponents */
	.opponents-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.opponent-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		color: white;
		transition: all 0.3s ease;
	}

	.opponent-card:hover {
		transform: translateY(-2px);
		border-color: rgba(45, 212, 191, 0.4);
	}

	.opponent-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.opponent-avatar {
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

	.opponent-info {
		flex: 1;
	}

	.opponent-name {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 0.2rem;
	}

	.opponent-game {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.opponent-status {
		font-size: 1.2rem;
	}

	.opponent-stats {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 1rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
	}

	.stat-row .stat-label {
		color: rgba(255, 255, 255, 0.7);
	}

	.stat-row .stat-value {
		font-weight: 600;
		color: white;
	}

	.compatibility-score {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.challenge-btn {
		width: 100%;
	}

	/* Sidebar */
	.matchmaking-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.sidebar-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		color: white;
	}

	.sidebar-title {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #2DD4BF;
	}

	.quick-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.quick-stat {
		text-align: center;
	}

	.quick-stat .stat-value {
		font-size: 1.3rem;
		font-weight: 700;
		color: #2DD4BF;
		display: block;
	}

	.quick-stat .stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 0.2rem;
	}

	/* Preferences Form */
	.prefs-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.pref-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pref-group label {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.pref-group select,
	.pref-group input {
		padding: 0.6rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.power-display {
		text-align: center;
		font-weight: 600;
		color: #2DD4BF;
	}

	/* Recent Matches */
	.recent-matches {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.view-all-link {
		display: block;
		text-align: center;
		margin-top: 1rem;
		color: #2DD4BF;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.view-all-link:hover {
		text-decoration: underline;
	}

	/* Button Sizes */
	.btn-sm {
		padding: 0.6rem 1rem;
		font-size: 0.85rem;
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

		.matchmaking-layout {
			grid-template-columns: 1fr;
		}

		.matchmaking-sidebar {
			order: -1;
		}

		.current-match .match-details {
			flex-direction: column;
			align-items: stretch;
		}

		.match-actions {
			justify-content: center;
		}

		.queues-grid,
		.opponents-list {
			grid-template-columns: 1fr;
		}

		.quick-stats {
			grid-template-columns: 1fr;
		}

		.opponent-header {
			flex-wrap: wrap;
		}

		.compatibility-score {
			justify-content: center;
		}
	}
</style>