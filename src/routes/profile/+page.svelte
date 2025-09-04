<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import ProfileHeader from '$lib/components/ProfileHeader.svelte';
	import GamePreferences from '$lib/components/GamePreferences.svelte';
	import SocialLinks from '$lib/components/SocialLinks.svelte';
	import StreamingSetup from '$lib/components/StreamingSetup.svelte';
	import CommunitySettings from '$lib/components/CommunitySettings.svelte';

	// Mock user profile data
	let profileData = {
		personalInfo: {
			displayName: 'StreamLord_TCG',
			realName: 'Alex Chen',
			bio: 'Passionate TCG streamer and tournament organizer. Building community one card at a time! 🎮✨',
			location: 'Los Angeles, CA',
			joinDate: new Date('2023-03-15'),
			avatar: null,
			banner: null,
			timezone: 'America/Los_Angeles'
		},
		gamePreferences: {
			primaryGame: 'Magic: The Gathering',
			favoriteFormats: ['Commander', 'Modern', 'Draft'],
			skillLevel: 'Advanced',
			playStyle: 'Competitive-Casual',
			favoriteColors: ['Blue', 'White'],
			preferredPowerLevel: 7,
			availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
			preferredTimes: ['Evening (6-10 PM)', 'Night (10 PM+)'],
			languages: ['English', 'Chinese']
		},
		socialLinks: {
			twitch: 'https://twitch.tv/streamlord_tcg',
			youtube: 'https://youtube.com/@streamlordtcg',
			twitter: 'https://twitter.com/streamlord_tcg',
			instagram: 'https://instagram.com/streamlord_tcg',
			discord: 'StreamLord#1337',
			tiktok: '',
			website: 'https://streamlord.tcg'
		},
		streamingSetup: {
			primaryPlatform: 'Twitch',
			streamingDays: ['Monday', 'Wednesday', 'Friday'],
			streamingHours: '7:00 PM - 11:00 PM PST',
			streamTitle: '🎮 #{game} with StreamLord | #{format} Fun!',
			overlayTheme: 'TCG Magic',
			microphoneSetup: 'Blue Yeti',
			cameraSetup: 'Logitech C920',
			streamingSetup: 'OBS Studio + Streamlabs',
			autoHost: true,
			chatModeration: 'Moderate'
		},
		communitySettings: {
			primaryCommunity: 'Magic: The Gathering',
			joinedCommunities: ['Magic: The Gathering', 'Pokemon TCG', 'Yu-Gi-Oh!'],
			rolePreferences: ['Tournament Organizer', 'Content Creator', 'Mentor'],
			mentoring: true,
			publicProfile: true,
			allowDirectMessages: true,
			showOnlineStatus: true,
			eventNotifications: true,
			tournamentReminders: true,
			communityUpdates: true
		},
		stats: {
			streamsHosted: 47,
			tournamentsOrganized: 12,
			tournamentsWon: 4,
			communityRank: 'Elder',
			totalViewers: 12547,
			followers: 3842
		}
	};

	let activeSection = 'overview'; // overview, games, social, streaming, community, privacy
	let isEditing = false;

	onMount(() => {
		authStore.checkAuth();
	});

	function toggleEdit() {
		isEditing = !isEditing;
	}

	function saveProfile() {
		alert('💾 Profile saved successfully! Changes will be reflected across the platform.');
		isEditing = false;
	}

	function uploadAvatar() {
		alert('📸 Avatar upload feature coming soon! Supports JPG, PNG, and GIF files.');
	}

	function uploadBanner() {
		alert('🖼️ Banner upload feature coming soon! Recommended size: 1920x480px.');
	}

	function exportProfile() {
		alert('📄 Profile export feature coming soon! Generate a shareable profile card.');
	}

	function shareProfile() {
		const profileUrl = `https://shuffle-sync.com/profile/${profileData.personalInfo.displayName}`;
		navigator.clipboard?.writeText(profileUrl);
		alert('🔗 Profile link copied to clipboard! Share your TCG streaming profile.');
	}

	function deleteAccount() {
		if (confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone.')) {
			alert('🗑️ Account deletion process initiated. You will receive a confirmation email.');
		}
	}
</script>

<svelte:head>
	<title>Profile - Shuffle & Sync</title>
	<meta name="description" content="Manage your TCG streaming profile and preferences" />
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
			</div>
		{/if}
	</nav>

	<main>
		<!-- Profile Header -->
		<ProfileHeader 
			profile={profileData.personalInfo}
			stats={profileData.stats}
			{isEditing}
			onUploadAvatar={uploadAvatar}
			onUploadBanner={uploadBanner}
		/>

		<!-- Profile Navigation -->
		<div class="profile-nav">
			<button 
				class="profile-nav-btn"
				class:active={activeSection === 'overview'}
				on:click={() => activeSection = 'overview'}
			>
				<i class="fas fa-user"></i> Overview
			</button>
			<button 
				class="profile-nav-btn"
				class:active={activeSection === 'games'}
				on:click={() => activeSection = 'games'}
			>
				<i class="fas fa-gamepad"></i> Gaming
			</button>
			<button 
				class="profile-nav-btn"
				class:active={activeSection === 'social'}
				on:click={() => activeSection = 'social'}
			>
				<i class="fas fa-share-alt"></i> Social
			</button>
			<button 
				class="profile-nav-btn"
				class:active={activeSection === 'streaming'}
				on:click={() => activeSection = 'streaming'}
			>
				<i class="fas fa-video"></i> Streaming
			</button>
			<button 
				class="profile-nav-btn"
				class:active={activeSection === 'community'}
				on:click={() => activeSection = 'community'}
			>
				<i class="fas fa-users"></i> Community
			</button>
			<button 
				class="profile-nav-btn"
				class:active={activeSection === 'privacy'}
				on:click={() => activeSection = 'privacy'}
			>
				<i class="fas fa-shield-alt"></i> Privacy
			</button>
		</div>

		<!-- Profile Actions -->
		<div class="profile-actions">
			{#if !isEditing}
				<button class="btn btn-primary" on:click={toggleEdit}>
					<i class="fas fa-edit"></i> Edit Profile
				</button>
			{:else}
				<button class="btn btn-success" on:click={saveProfile}>
					<i class="fas fa-save"></i> Save Changes
				</button>
				<button class="btn btn-secondary" on:click={toggleEdit}>
					<i class="fas fa-times"></i> Cancel
				</button>
			{/if}
			
			<button class="btn btn-secondary" on:click={shareProfile}>
				<i class="fas fa-share"></i> Share Profile
			</button>
			<button class="btn btn-secondary" on:click={exportProfile}>
				<i class="fas fa-download"></i> Export
			</button>
		</div>

		<!-- Profile Content Sections -->
		<div class="profile-content">
			{#if activeSection === 'overview'}
				<!-- Overview Section -->
				<div class="overview-section">
					<div class="overview-grid">
						<!-- Personal Info Card -->
						<div class="info-card">
							<h3 class="card-title">📋 Personal Information</h3>
							<div class="info-fields">
								{#if isEditing}
									<div class="field-group">
										<label for="displayName">Display Name</label>
										<input type="text" id="displayName" bind:value={profileData.personalInfo.displayName} />
									</div>
									<div class="field-group">
										<label for="realName">Real Name</label>
										<input type="text" id="realName" bind:value={profileData.personalInfo.realName} />
									</div>
									<div class="field-group">
										<label for="bio">Bio</label>
										<textarea id="bio" bind:value={profileData.personalInfo.bio} rows="3"></textarea>
									</div>
									<div class="field-group">
										<label for="location">Location</label>
										<input type="text" id="location" bind:value={profileData.personalInfo.location} />
									</div>
									<div class="field-group">
										<label for="timezone">Timezone</label>
										<select id="timezone" bind:value={profileData.personalInfo.timezone}>
											<option value="America/Los_Angeles">Pacific Time</option>
											<option value="America/Denver">Mountain Time</option>
											<option value="America/Chicago">Central Time</option>
											<option value="America/New_York">Eastern Time</option>
											<option value="Europe/London">GMT</option>
											<option value="Europe/Paris">CET</option>
											<option value="Asia/Tokyo">JST</option>
										</select>
									</div>
								{:else}
									<div class="info-item">
										<span class="info-label">Display Name:</span>
										<span class="info-value">{profileData.personalInfo.displayName}</span>
									</div>
									<div class="info-item">
										<span class="info-label">Real Name:</span>
										<span class="info-value">{profileData.personalInfo.realName}</span>
									</div>
									<div class="info-item bio-item">
										<span class="info-label">Bio:</span>
										<span class="info-value">{profileData.personalInfo.bio}</span>
									</div>
									<div class="info-item">
										<span class="info-label">Location:</span>
										<span class="info-value">{profileData.personalInfo.location}</span>
									</div>
									<div class="info-item">
										<span class="info-label">Joined:</span>
										<span class="info-value">{profileData.personalInfo.joinDate.toLocaleDateString()}</span>
									</div>
									<div class="info-item">
										<span class="info-label">Timezone:</span>
										<span class="info-value">{profileData.personalInfo.timezone}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Quick Stats Card -->
						<div class="info-card">
							<h3 class="card-title">📊 Quick Stats</h3>
							<div class="stats-grid">
								<div class="stat-item">
									<div class="stat-icon">🎥</div>
									<div class="stat-info">
										<div class="stat-value">{profileData.stats.streamsHosted}</div>
										<div class="stat-label">Streams Hosted</div>
									</div>
								</div>
								<div class="stat-item">
									<div class="stat-icon">🏆</div>
									<div class="stat-info">
										<div class="stat-value">{profileData.stats.tournamentsWon}</div>
										<div class="stat-label">Tournaments Won</div>
									</div>
								</div>
								<div class="stat-item">
									<div class="stat-icon">👥</div>
									<div class="stat-info">
										<div class="stat-value">{profileData.stats.followers.toLocaleString()}</div>
										<div class="stat-label">Followers</div>
									</div>
								</div>
								<div class="stat-item">
									<div class="stat-icon">👑</div>
									<div class="stat-info">
										<div class="stat-value">{profileData.stats.communityRank}</div>
										<div class="stat-label">Rank</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Recent Activity Card -->
						<div class="info-card full-width">
							<h3 class="card-title">🎯 Recent Activity</h3>
							<div class="activity-list">
								<div class="activity-item">
									<div class="activity-icon">🏆</div>
									<div class="activity-content">
										<div class="activity-text">Won 1st place in Commander Masters Weekly</div>
										<div class="activity-time">2 days ago</div>
									</div>
								</div>
								<div class="activity-item">
									<div class="activity-icon">📅</div>
									<div class="activity-content">
										<div class="activity-text">Organized Pokemon Draft Championship</div>
										<div class="activity-time">5 days ago</div>
									</div>
								</div>
								<div class="activity-item">
									<div class="activity-icon">🎮</div>
									<div class="activity-content">
										<div class="activity-text">Hosted 4-hour Commander stream</div>
										<div class="activity-time">1 week ago</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else if activeSection === 'games'}
				<GamePreferences 
					preferences={profileData.gamePreferences}
					{isEditing}
				/>

			{:else if activeSection === 'social'}
				<SocialLinks 
					links={profileData.socialLinks}
					{isEditing}
				/>

			{:else if activeSection === 'streaming'}
				<StreamingSetup 
					setup={profileData.streamingSetup}
					{isEditing}
				/>

			{:else if activeSection === 'community'}
				<CommunitySettings 
					settings={profileData.communitySettings}
					{isEditing}
				/>

			{:else if activeSection === 'privacy'}
				<!-- Privacy Section -->
				<div class="privacy-section">
					<div class="privacy-grid">
						<div class="info-card">
							<h3 class="card-title">🔒 Privacy Settings</h3>
							<div class="privacy-options">
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Public Profile</div>
										<div class="option-desc">Allow others to view your profile</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={profileData.communitySettings.publicProfile} disabled={!isEditing} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Direct Messages</div>
										<div class="option-desc">Allow users to send you direct messages</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={profileData.communitySettings.allowDirectMessages} disabled={!isEditing} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Online Status</div>
										<div class="option-desc">Show when you're online</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={profileData.communitySettings.showOnlineStatus} disabled={!isEditing} />
										<span class="toggle-slider"></span>
									</label>
								</div>
							</div>
						</div>

						<div class="info-card">
							<h3 class="card-title">🔔 Notification Settings</h3>
							<div class="privacy-options">
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Event Notifications</div>
										<div class="option-desc">Get notified about new events</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={profileData.communitySettings.eventNotifications} disabled={!isEditing} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Tournament Reminders</div>
										<div class="option-desc">Reminders for upcoming tournaments</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={profileData.communitySettings.tournamentReminders} disabled={!isEditing} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Community Updates</div>
										<div class="option-desc">Updates from your communities</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={profileData.communitySettings.communityUpdates} disabled={!isEditing} />
										<span class="toggle-slider"></span>
									</label>
								</div>
							</div>
						</div>

						<div class="info-card danger-zone">
							<h3 class="card-title">⚠️ Danger Zone</h3>
							<div class="danger-actions">
								<div class="danger-action">
									<div class="danger-info">
										<div class="danger-title">Delete Account</div>
										<div class="danger-desc">Permanently delete your account and all data</div>
									</div>
									<button class="btn btn-danger" on:click={deleteAccount} disabled={!isEditing}>
										Delete Account
									</button>
								</div>
							</div>
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

	/* Profile Navigation */
	.profile-nav {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin: 2rem 0;
		flex-wrap: wrap;
	}

	.profile-nav-btn {
		padding: 0.8rem 1.5rem;
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

	.profile-nav-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: white;
		border-color: rgba(45, 212, 191, 0.4);
	}

	.profile-nav-btn.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		border-color: #2DD4BF;
		box-shadow: 0 4px 20px rgba(45, 212, 191, 0.3);
	}

	/* Profile Actions */
	.profile-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 3rem;
		flex-wrap: wrap;
	}

	/* Profile Content */
	.profile-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Overview Section */
	.overview-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.info-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
	}

	.info-card.full-width {
		grid-column: 1 / -1;
	}

	.info-card.danger-zone {
		border-color: rgba(239, 68, 68, 0.4);
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
	}

	.card-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
	}

	.danger-zone .card-title {
		color: #EF4444;
	}

	/* Info Fields */
	.info-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.8rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.info-item.bio-item {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.info-label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		min-width: 120px;
		flex-shrink: 0;
	}

	.info-value {
		color: white;
		text-align: right;
		flex: 1;
	}

	.bio-item .info-value {
		text-align: left;
		line-height: 1.5;
	}

	/* Form Fields */
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-group label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.field-group input,
	.field-group textarea,
	.field-group select {
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
		transition: border-color 0.3s ease;
	}

	.field-group input:focus,
	.field-group textarea:focus,
	.field-group select:focus {
		outline: none;
		border-color: #2DD4BF;
		box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 10px;
		border-left: 3px solid #2DD4BF;
	}

	.stat-icon {
		font-size: 2rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: 'Nunito', sans-serif;
		color: white;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Activity List */
	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 10px;
	}

	.activity-icon {
		font-size: 1.5rem;
		width: 40px;
		text-align: center;
	}

	.activity-content {
		flex: 1;
	}

	.activity-text {
		color: white;
		font-weight: 500;
		margin-bottom: 0.2rem;
	}

	.activity-time {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Privacy Settings */
	.privacy-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.privacy-grid .info-card:last-child {
		grid-column: 1 / -1;
	}

	.privacy-options {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.privacy-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.privacy-option:last-child {
		border-bottom: none;
	}

	.option-title {
		font-weight: 600;
		color: white;
		margin-bottom: 0.2rem;
	}

	.option-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Toggle Switch */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 24px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 24px;
		transition: 0.3s;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background: white;
		border-radius: 50%;
		transition: 0.3s;
	}

	input:checked + .toggle-slider {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
	}

	input:checked + .toggle-slider:before {
		transform: translateX(26px);
	}

	input:disabled + .toggle-slider {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Danger Zone */
	.danger-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.danger-action {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 8px;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.danger-title {
		font-weight: 600;
		color: #EF4444;
		margin-bottom: 0.2rem;
	}

	.danger-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.btn-danger {
		background: linear-gradient(135deg, #EF4444, #DC2626);
		color: white;
		border: none;
	}

	.btn-danger:hover:not(:disabled) {
		background: linear-gradient(135deg, #DC2626, #B91C1C);
	}

	.btn-success {
		background: linear-gradient(135deg, #10B981, #059669);
		color: white;
		border: none;
	}

	.btn-success:hover {
		background: linear-gradient(135deg, #059669, #047857);
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

		.profile-nav {
			flex-direction: column;
			align-items: stretch;
		}

		.profile-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.overview-grid,
		.privacy-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.info-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.info-value {
			text-align: left;
		}

		.privacy-option,
		.danger-action {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>