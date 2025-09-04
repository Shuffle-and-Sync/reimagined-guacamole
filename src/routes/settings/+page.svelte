<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';

	// Mock user settings data
	let userSettings = {
		account: {
			email: 'streamlord@tcg.com',
			username: 'StreamLord_TCG',
			displayName: 'StreamLord TCG',
			phoneNumber: '',
			twoFactorEnabled: false,
			emailVerified: true,
			phoneVerified: false
		},
		privacy: {
			profileVisibility: 'public', // public, friends, private
			showOnlineStatus: true,
			showLastSeen: false,
			allowDirectMessages: 'friends', // everyone, friends, nobody
			showMatchHistory: true,
			showTournamentResults: true,
			indexBySearchEngines: true,
			showInMemberDirectory: true
		},
		notifications: {
			email: {
				enabled: true,
				tournamentReminders: true,
				matchResults: true,
				directMessages: false,
				forumReplies: true,
				eventInvitations: true,
				weeklyDigest: true,
				promotions: false
			},
			push: {
				enabled: true,
				matchFound: true,
				tournamentStarting: true,
				directMessages: true,
				mentions: true,
				eventReminders: true
			},
			inApp: {
				enabled: true,
				sound: true,
				desktop: true,
				quietHours: {
					enabled: true,
					start: '22:00',
					end: '08:00'
				}
			}
		},
		preferences: {
			theme: 'auto', // light, dark, auto
			language: 'en',
			timezone: 'America/Los_Angeles',
			dateFormat: 'MM/dd/yyyy',
			timeFormat: '12', // 12, 24
			defaultView: 'dashboard', // dashboard, tournaments, forums
			streamingIntegrations: true,
			autoJoinVoice: false,
			showAdvancedFeatures: true
		},
		streaming: {
			enableIntegration: true,
			defaultPlatform: 'twitch',
			autoPostResults: true,
			includeOpponentName: false,
			autoHostFriends: true,
			streamQuality: 'high',
			microphoneEnabled: true,
			webcamEnabled: false
		},
		data: {
			exportRequests: [],
			dataRetention: '2years', // 1year, 2years, 5years, forever
			analyticsOptIn: true,
			crashReporting: true,
			usageStats: true
		}
	};

	let activeTab = 'account';
	let hasChanges = false;

	onMount(() => {
		authStore.checkAuth();
	});

	function saveSettings() {
		// Simulate saving settings
		alert('⚙️ Settings saved successfully! Your preferences have been updated.');
		hasChanges = false;
	}

	function resetToDefaults() {
		if (confirm('⚠️ Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
			alert('🔄 Settings reset to defaults. Don\'t forget to save your changes.');
			hasChanges = true;
		}
	}

	function exportData() {
		if (confirm('📄 Export all your account data? This may take a few minutes to prepare.')) {
			alert('📤 Data export requested! You\'ll receive an email with your data within 24 hours.');
		}
	}

	function deleteAccount() {
		if (confirm('⚠️ This will permanently delete your account and all associated data. This action CANNOT be undone. Are you absolutely sure?')) {
			alert('🗑️ Account deletion initiated. You\'ll receive a confirmation email to complete this process.');
		}
	}

	function testNotification() {
		if ('Notification' in window) {
			if (Notification.permission === 'granted') {
				new Notification('🎮 Shuffle & Sync', {
					body: 'This is a test notification from your TCG streaming platform!',
					icon: '/favicon.ico'
				});
			} else if (Notification.permission !== 'denied') {
				Notification.requestPermission().then(permission => {
					if (permission === 'granted') {
						new Notification('🎮 Shuffle & Sync', {
							body: 'Notifications enabled! You\'ll now receive updates.',
							icon: '/favicon.ico'
						});
					}
				});
			} else {
				alert('🔔 Please enable notifications in your browser settings.');
			}
		} else {
			alert('❌ Your browser doesn\'t support notifications.');
		}
	}

	// Watch for changes to mark as modified
	$: {
		// This would normally compare with original settings
		if (userSettings) {
			// hasChanges = true when settings are modified
		}
	}
</script>

<svelte:head>
	<title>Settings - Shuffle & Sync</title>
	<meta name="description" content="Customize your TCG streaming platform experience" />
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
			<h1 class="hero-title">⚙️ Settings</h1>
			<p class="hero-subtitle">
				Customize your Shuffle & Sync experience and manage your account preferences
			</p>
		</header>

		<!-- Settings Actions -->
		<div class="settings-actions">
			{#if hasChanges}
				<div class="changes-indicator">
					<i class="fas fa-exclamation-circle"></i>
					<span>You have unsaved changes</span>
				</div>
			{/if}
			<div class="action-buttons">
				<button class="btn btn-secondary" on:click={resetToDefaults}>
					<i class="fas fa-undo"></i> Reset to Defaults
				</button>
				<button class="btn btn-primary" on:click={saveSettings} class:pulse={hasChanges}>
					<i class="fas fa-save"></i> Save Changes
				</button>
			</div>
		</div>

		<div class="settings-layout">
			<!-- Settings Navigation -->
			<nav class="settings-nav">
				<button 
					class="nav-item"
					class:active={activeTab === 'account'}
					on:click={() => activeTab = 'account'}
				>
					<i class="fas fa-user-circle"></i>
					<span>Account</span>
				</button>
				<button 
					class="nav-item"
					class:active={activeTab === 'privacy'}
					on:click={() => activeTab = 'privacy'}
				>
					<i class="fas fa-shield-alt"></i>
					<span>Privacy</span>
				</button>
				<button 
					class="nav-item"
					class:active={activeTab === 'notifications'}
					on:click={() => activeTab = 'notifications'}
				>
					<i class="fas fa-bell"></i>
					<span>Notifications</span>
				</button>
				<button 
					class="nav-item"
					class:active={activeTab === 'preferences'}
					on:click={() => activeTab = 'preferences'}
				>
					<i class="fas fa-cog"></i>
					<span>Preferences</span>
				</button>
				<button 
					class="nav-item"
					class:active={activeTab === 'streaming'}
					on:click={() => activeTab = 'streaming'}
				>
					<i class="fas fa-video"></i>
					<span>Streaming</span>
				</button>
				<button 
					class="nav-item"
					class:active={activeTab === 'data'}
					on:click={() => activeTab = 'data'}
				>
					<i class="fas fa-database"></i>
					<span>Data & Privacy</span>
				</button>
			</nav>

			<!-- Settings Content -->
			<div class="settings-content">
				{#if activeTab === 'account'}
					<div class="settings-section">
						<h2 class="section-title">👤 Account Information</h2>
						
						<div class="setting-group">
							<h3 class="group-title">Basic Information</h3>
							<div class="form-grid">
								<div class="form-field">
									<label>Email Address</label>
									<div class="input-with-status">
										<input type="email" bind:value={userSettings.account.email} />
										{#if userSettings.account.emailVerified}
											<span class="status-badge verified">✓ Verified</span>
										{:else}
											<span class="status-badge unverified">! Unverified</span>
										{/if}
									</div>
								</div>
								<div class="form-field">
									<label>Username</label>
									<input type="text" bind:value={userSettings.account.username} />
									<div class="field-help">Used for mentions and direct links to your profile</div>
								</div>
								<div class="form-field">
									<label>Display Name</label>
									<input type="text" bind:value={userSettings.account.displayName} />
									<div class="field-help">How your name appears to other users</div>
								</div>
								<div class="form-field">
									<label>Phone Number (optional)</label>
									<div class="input-with-status">
										<input type="tel" bind:value={userSettings.account.phoneNumber} placeholder="+1 (555) 123-4567" />
										{#if userSettings.account.phoneVerified}
											<span class="status-badge verified">✓ Verified</span>
										{:else if userSettings.account.phoneNumber}
											<span class="status-badge unverified">! Unverified</span>
										{/if}
									</div>
								</div>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Security</h3>
							<div class="security-options">
								<div class="security-option">
									<div class="option-info">
										<div class="option-title">Two-Factor Authentication</div>
										<div class="option-desc">Add an extra layer of security to your account</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.account.twoFactorEnabled} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								
								<div class="action-buttons">
									<button class="btn btn-secondary">
										<i class="fas fa-key"></i> Change Password
									</button>
									<button class="btn btn-secondary">
										<i class="fas fa-sign-out-alt"></i> Sign Out All Devices
									</button>
								</div>
							</div>
						</div>
					</div>

				{:else if activeTab === 'privacy'}
					<div class="settings-section">
						<h2 class="section-title">🔒 Privacy Settings</h2>
						
						<div class="setting-group">
							<h3 class="group-title">Profile Visibility</h3>
							<div class="radio-group">
								<label class="radio-option">
									<input type="radio" bind:group={userSettings.privacy.profileVisibility} value="public" />
									<div class="radio-content">
										<div class="radio-title">🌍 Public</div>
										<div class="radio-desc">Anyone can view your profile and activity</div>
									</div>
								</label>
								<label class="radio-option">
									<input type="radio" bind:group={userSettings.privacy.profileVisibility} value="friends" />
									<div class="radio-content">
										<div class="radio-title">👥 Friends Only</div>
										<div class="radio-desc">Only people you've added as friends can view your profile</div>
									</div>
								</label>
								<label class="radio-option">
									<input type="radio" bind:group={userSettings.privacy.profileVisibility} value="private" />
									<div class="radio-content">
										<div class="radio-title">🔒 Private</div>
										<div class="radio-desc">Your profile is hidden from everyone</div>
									</div>
								</label>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Activity Privacy</h3>
							<div class="privacy-options">
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Show Online Status</div>
										<div class="option-desc">Let others see when you're online</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.privacy.showOnlineStatus} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Show Last Seen</div>
										<div class="option-desc">Display when you were last active</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.privacy.showLastSeen} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Show Match History</div>
										<div class="option-desc">Allow others to see your game results</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.privacy.showMatchHistory} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="privacy-option">
									<div class="option-info">
										<div class="option-title">Show Tournament Results</div>
										<div class="option-desc">Display your tournament performance publicly</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.privacy.showTournamentResults} />
										<span class="toggle-slider"></span>
									</label>
								</div>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Communication</h3>
							<div class="form-field">
								<label>Who can send you direct messages?</label>
								<select bind:value={userSettings.privacy.allowDirectMessages}>
									<option value="everyone">Everyone</option>
									<option value="friends">Friends only</option>
									<option value="nobody">Nobody</option>
								</select>
							</div>
						</div>
					</div>

				{:else if activeTab === 'notifications'}
					<div class="settings-section">
						<h2 class="section-title">🔔 Notification Settings</h2>
						
						<div class="notification-test">
							<button class="btn btn-secondary" on:click={testNotification}>
								<i class="fas fa-bell-slash"></i> Test Notifications
							</button>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Email Notifications</h3>
							<div class="notification-master-toggle">
								<div class="master-toggle-info">
									<div class="toggle-title">Email Notifications</div>
									<div class="toggle-desc">Enable or disable all email notifications</div>
								</div>
								<label class="toggle-switch">
									<input type="checkbox" bind:checked={userSettings.notifications.email.enabled} />
									<span class="toggle-slider"></span>
								</label>
							</div>
							
							{#if userSettings.notifications.email.enabled}
								<div class="notification-options">
									<div class="notification-option">
										<div class="option-info">
											<div class="option-title">Tournament Reminders</div>
											<div class="option-desc">Notifications before tournaments start</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.notifications.email.tournamentReminders} />
											<span class="toggle-slider"></span>
										</label>
									</div>
									<div class="notification-option">
										<div class="option-info">
											<div class="option-title">Match Results</div>
											<div class="option-desc">Updates when your matches are complete</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.notifications.email.matchResults} />
											<span class="toggle-slider"></span>
										</label>
									</div>
									<div class="notification-option">
										<div class="option-info">
											<div class="option-title">Direct Messages</div>
											<div class="option-desc">When someone sends you a private message</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.notifications.email.directMessages} />
											<span class="toggle-slider"></span>
										</label>
									</div>
									<div class="notification-option">
										<div class="option-info">
											<div class="option-title">Forum Replies</div>
											<div class="option-desc">When someone replies to your forum posts</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.notifications.email.forumReplies} />
											<span class="toggle-slider"></span>
										</label>
									</div>
								</div>
							{/if}
						</div>

						<div class="setting-group">
							<h3 class="group-title">Push Notifications</h3>
							<div class="notification-master-toggle">
								<div class="master-toggle-info">
									<div class="toggle-title">Browser Notifications</div>
									<div class="toggle-desc">Show desktop notifications in your browser</div>
								</div>
								<label class="toggle-switch">
									<input type="checkbox" bind:checked={userSettings.notifications.push.enabled} />
									<span class="toggle-slider"></span>
								</label>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Quiet Hours</h3>
							<div class="quiet-hours">
								<div class="quiet-toggle">
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.notifications.inApp.quietHours.enabled} />
										<span class="toggle-slider"></span>
									</label>
									<span>Enable quiet hours</span>
								</div>
								{#if userSettings.notifications.inApp.quietHours.enabled}
									<div class="time-range">
										<div class="time-input">
											<label>From</label>
											<input type="time" bind:value={userSettings.notifications.inApp.quietHours.start} />
										</div>
										<div class="time-input">
											<label>To</label>
											<input type="time" bind:value={userSettings.notifications.inApp.quietHours.end} />
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>

				{:else if activeTab === 'preferences'}
					<div class="settings-section">
						<h2 class="section-title">🎨 Preferences</h2>
						
						<div class="setting-group">
							<h3 class="group-title">Appearance</h3>
							<div class="form-grid">
								<div class="form-field">
									<label>Theme</label>
									<select bind:value={userSettings.preferences.theme}>
										<option value="light">☀️ Light</option>
										<option value="dark">🌙 Dark</option>
										<option value="auto">🔄 Auto (system)</option>
									</select>
								</div>
								<div class="form-field">
									<label>Language</label>
									<select bind:value={userSettings.preferences.language}>
										<option value="en">🇺🇸 English</option>
										<option value="es">🇪🇸 Spanish</option>
										<option value="fr">🇫🇷 French</option>
										<option value="de">🇩🇪 German</option>
										<option value="ja">🇯🇵 Japanese</option>
									</select>
								</div>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Localization</h3>
							<div class="form-grid">
								<div class="form-field">
									<label>Timezone</label>
									<select bind:value={userSettings.preferences.timezone}>
										<option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
										<option value="America/Denver">Mountain Time (MST/MDT)</option>
										<option value="America/Chicago">Central Time (CST/CDT)</option>
										<option value="America/New_York">Eastern Time (EST/EDT)</option>
										<option value="Europe/London">Greenwich Mean Time (GMT)</option>
										<option value="Europe/Paris">Central European Time (CET)</option>
									</select>
								</div>
								<div class="form-field">
									<label>Date Format</label>
									<select bind:value={userSettings.preferences.dateFormat}>
										<option value="MM/dd/yyyy">MM/dd/yyyy (12/31/2024)</option>
										<option value="dd/MM/yyyy">dd/MM/yyyy (31/12/2024)</option>
										<option value="yyyy-MM-dd">yyyy-MM-dd (2024-12-31)</option>
									</select>
								</div>
								<div class="form-field">
									<label>Time Format</label>
									<select bind:value={userSettings.preferences.timeFormat}>
										<option value="12">12-hour (2:30 PM)</option>
										<option value="24">24-hour (14:30)</option>
									</select>
								</div>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Behavior</h3>
							<div class="form-field">
								<label>Default Page on Login</label>
								<select bind:value={userSettings.preferences.defaultView}>
									<option value="dashboard">🏠 Dashboard</option>
									<option value="tournaments">🏆 Tournaments</option>
									<option value="forums">💬 Forums</option>
									<option value="matchmaking">🎯 Matchmaking</option>
								</select>
							</div>
							
							<div class="preference-options">
								<div class="preference-option">
									<div class="option-info">
										<div class="option-title">Show Advanced Features</div>
										<div class="option-desc">Enable power-user features and detailed options</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.preferences.showAdvancedFeatures} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="preference-option">
									<div class="option-info">
										<div class="option-title">Auto-Join Voice Channels</div>
										<div class="option-desc">Automatically join voice chat in tournaments and events</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.preferences.autoJoinVoice} />
										<span class="toggle-slider"></span>
									</label>
								</div>
							</div>
						</div>
					</div>

				{:else if activeTab === 'streaming'}
					<div class="settings-section">
						<h2 class="section-title">📺 Streaming Integration</h2>
						
						<div class="setting-group">
							<h3 class="group-title">Platform Integration</h3>
							<div class="streaming-master-toggle">
								<div class="master-toggle-info">
									<div class="toggle-title">Enable Streaming Features</div>
									<div class="toggle-desc">Connect your streams with tournament and match results</div>
								</div>
								<label class="toggle-switch">
									<input type="checkbox" bind:checked={userSettings.streaming.enableIntegration} />
									<span class="toggle-slider"></span>
								</label>
							</div>

							{#if userSettings.streaming.enableIntegration}
								<div class="form-field">
									<label>Default Platform</label>
									<select bind:value={userSettings.streaming.defaultPlatform}>
										<option value="twitch">🟣 Twitch</option>
										<option value="youtube">🔴 YouTube</option>
										<option value="facebook">🔵 Facebook Gaming</option>
										<option value="tiktok">⚫ TikTok Live</option>
									</select>
								</div>

								<div class="streaming-options">
									<div class="streaming-option">
										<div class="option-info">
											<div class="option-title">Auto-Post Match Results</div>
											<div class="option-desc">Automatically share your match outcomes on stream</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.streaming.autoPostResults} />
											<span class="toggle-slider"></span>
										</label>
									</div>
									<div class="streaming-option">
										<div class="option-info">
											<div class="option-title">Include Opponent Names</div>
											<div class="option-desc">Show opponent usernames in stream posts (requires consent)</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.streaming.includeOpponentName} />
											<span class="toggle-slider"></span>
										</label>
									</div>
									<div class="streaming-option">
										<div class="option-info">
											<div class="option-title">Auto-Host Friends</div>
											<div class="option-desc">Automatically host friends when they go live</div>
										</div>
										<label class="toggle-switch">
											<input type="checkbox" bind:checked={userSettings.streaming.autoHostFriends} />
											<span class="toggle-slider"></span>
										</label>
									</div>
								</div>
							{/if}
						</div>
					</div>

				{:else if activeTab === 'data'}
					<div class="settings-section">
						<h2 class="section-title">📊 Data & Privacy</h2>
						
						<div class="setting-group">
							<h3 class="group-title">Data Export</h3>
							<div class="data-export">
								<div class="export-info">
									<div class="export-title">Download Your Data</div>
									<div class="export-desc">
										Get a copy of all your account data, match history, and settings.
										This may take up to 24 hours to prepare.
									</div>
								</div>
								<button class="btn btn-secondary" on:click={exportData}>
									<i class="fas fa-download"></i> Request Export
								</button>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Data Retention</h3>
							<div class="form-field">
								<label>Keep my data for</label>
								<select bind:value={userSettings.data.dataRetention}>
									<option value="1year">1 year after account deletion</option>
									<option value="2years">2 years after account deletion</option>
									<option value="5years">5 years after account deletion</option>
									<option value="forever">Keep forever</option>
								</select>
							</div>
						</div>

						<div class="setting-group">
							<h3 class="group-title">Usage Analytics</h3>
							<div class="analytics-options">
								<div class="analytics-option">
									<div class="option-info">
										<div class="option-title">Analytics Opt-in</div>
										<div class="option-desc">Help improve the platform by sharing anonymous usage data</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.data.analyticsOptIn} />
										<span class="toggle-slider"></span>
									</label>
								</div>
								<div class="analytics-option">
									<div class="option-info">
										<div class="option-title">Crash Reporting</div>
										<div class="option-desc">Automatically send crash reports to help us fix bugs</div>
									</div>
									<label class="toggle-switch">
										<input type="checkbox" bind:checked={userSettings.data.crashReporting} />
										<span class="toggle-slider"></span>
									</label>
								</div>
							</div>
						</div>

						<div class="setting-group danger-zone">
							<h3 class="group-title">⚠️ Danger Zone</h3>
							<div class="danger-actions">
								<div class="danger-action">
									<div class="danger-info">
										<div class="danger-title">Delete Account</div>
										<div class="danger-desc">Permanently delete your account and all associated data. This action cannot be undone.</div>
									</div>
									<button class="btn btn-danger" on:click={deleteAccount}>
										<i class="fas fa-trash"></i> Delete Account
									</button>
								</div>
							</div>
						</div>
					</div>
				{/if}
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

	/* Settings Actions */
	.settings-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.changes-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #F59E0B;
		font-weight: 500;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
	}

	.btn.pulse {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.4); }
		70% { box-shadow: 0 0 0 10px rgba(45, 212, 191, 0); }
		100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
	}

	/* Settings Layout */
	.settings-layout {
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Settings Navigation */
	.settings-nav {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		height: fit-content;
		position: sticky;
		top: 2rem;
	}

	.nav-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		margin-bottom: 0.5rem;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		font-weight: 500;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.nav-item.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		box-shadow: 0 2px 8px rgba(45, 212, 191, 0.3);
	}

	.nav-item:last-child {
		margin-bottom: 0;
	}

	/* Settings Content */
	.settings-content {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		color: white;
	}

	.section-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.8rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: #2DD4BF;
	}

	.setting-group {
		margin-bottom: 3rem;
	}

	.group-title {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: white;
	}

	/* Form Elements */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.form-field input,
	.form-field select {
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.form-field input:focus,
	.form-field select:focus {
		outline: none;
		border-color: #2DD4BF;
		box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
	}

	.field-help {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		font-style: italic;
	}

	.input-with-status {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-status input {
		flex: 1;
		margin: 0;
		padding-right: 4rem;
	}

	.status-badge {
		position: absolute;
		right: 0.8rem;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
	}

	.status-badge.verified {
		background: rgba(16, 185, 129, 0.2);
		color: #10B981;
	}

	.status-badge.unverified {
		background: rgba(245, 158, 11, 0.2);
		color: #F59E0B;
	}

	/* Toggle Switch */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 24px;
		flex-shrink: 0;
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

	/* Radio Options */
	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.radio-option:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(45, 212, 191, 0.4);
	}

	.radio-option:has(input:checked) {
		background: rgba(45, 212, 191, 0.1);
		border-color: #2DD4BF;
	}

	.radio-content {
		flex: 1;
	}

	.radio-title {
		font-weight: 600;
		margin-bottom: 0.2rem;
		color: white;
	}

	.radio-desc {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Privacy/Notification Options */
	.privacy-options,
	.notification-options,
	.preference-options,
	.streaming-options,
	.analytics-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.privacy-option,
	.notification-option,
	.preference-option,
	.streaming-option,
	.analytics-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.option-info {
		flex: 1;
	}

	.option-title {
		font-weight: 600;
		margin-bottom: 0.3rem;
		color: white;
	}

	.option-desc {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.4;
	}

	/* Special Sections */
	.notification-master-toggle,
	.streaming-master-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 10px;
		border: 1px solid rgba(45, 212, 191, 0.3);
		margin-bottom: 1.5rem;
	}

	.master-toggle-info {
		flex: 1;
	}

	.toggle-title {
		font-weight: 700;
		margin-bottom: 0.3rem;
		color: white;
		font-size: 1.1rem;
	}

	.toggle-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Quiet Hours */
	.quiet-hours {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quiet-toggle {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.time-range {
		display: flex;
		gap: 1rem;
		padding-left: 3.5rem;
	}

	.time-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.time-input label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.time-input input {
		padding: 0.6rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	/* Data Export */
	.data-export {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 10px;
		border: 1px solid rgba(45, 212, 191, 0.3);
	}

	.export-info {
		flex: 1;
	}

	.export-title {
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: white;
	}

	.export-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.4;
	}

	/* Danger Zone */
	.setting-group.danger-zone {
		border: 2px solid rgba(239, 68, 68, 0.4);
		border-radius: 10px;
		padding: 2rem;
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
	}

	.danger-zone .group-title {
		color: #EF4444;
	}

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
		padding: 1.5rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 8px;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.danger-info {
		flex: 1;
	}

	.danger-title {
		font-weight: 700;
		margin-bottom: 0.3rem;
		color: #EF4444;
	}

	.danger-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.4;
	}

	.btn-danger {
		background: linear-gradient(135deg, #EF4444, #DC2626);
		border: none;
		color: white;
	}

	.btn-danger:hover {
		background: linear-gradient(135deg, #DC2626, #B91C1C);
	}

	/* Test Notification */
	.notification-test {
		margin-bottom: 2rem;
		text-align: center;
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

		.settings-actions {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.action-buttons {
			justify-content: center;
		}

		.settings-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.settings-nav {
			order: 2;
			position: static;
		}

		.settings-content {
			order: 1;
			padding: 1.5rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.radio-option,
		.privacy-option,
		.notification-option,
		.preference-option,
		.streaming-option,
		.analytics-option,
		.notification-master-toggle,
		.streaming-master-toggle,
		.data-export,
		.danger-action {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.time-range {
			padding-left: 0;
			flex-direction: column;
		}

		.toggle-switch {
			align-self: center;
		}
	}
</style>