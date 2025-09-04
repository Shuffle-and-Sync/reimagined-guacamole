<script lang="ts">
	export let settings: any;
	export let isEditing: boolean = false;

	const tcgCommunities = [
		{ id: 'mtg', name: 'Magic: The Gathering', icon: '🔮', color: '#FF6B35' },
		{ id: 'pokemon', name: 'Pokemon TCG', icon: '⚡', color: '#FFD23F' },
		{ id: 'yugioh', name: 'Yu-Gi-Oh!', icon: '⚔️', color: '#7C3AED' },
		{ id: 'lorcana', name: 'Disney Lorcana', icon: '✨', color: '#EC4899' },
		{ id: 'fab', name: 'Flesh and Blood', icon: '🩸', color: '#DC2626' },
		{ id: 'digimon', name: 'Digimon TCG', icon: '🦾', color: '#0EA5E9' }
	];

	const rolePreferences = [
		{ id: 'organizer', name: 'Tournament Organizer', desc: 'Host and manage tournaments', icon: '🏆' },
		{ id: 'creator', name: 'Content Creator', desc: 'Create guides and educational content', icon: '🎬' },
		{ id: 'mentor', name: 'Mentor', desc: 'Help new players learn', icon: '🎓' },
		{ id: 'moderator', name: 'Community Moderator', desc: 'Help moderate discussions', icon: '🛡️' },
		{ id: 'judge', name: 'Tournament Judge', desc: 'Official rule enforcement', icon: '⚖️' },
		{ id: 'streamer', name: 'Streamer', desc: 'Stream gameplay and events', icon: '📺' }
	];

	function toggleArrayItem(array: string[], item: string) {
		if (!isEditing) return;
		
		const index = array.indexOf(item);
		if (index > -1) {
			array.splice(index, 1);
		} else {
			array.push(item);
		}
		settings = { ...settings }; // Trigger reactivity
	}

	function joinCommunity(communityId: string) {
		if (!isEditing) return;
		
		const community = tcgCommunities.find(c => c.id === communityId);
		if (community && !settings.joinedCommunities.includes(community.name)) {
			settings.joinedCommunities = [...settings.joinedCommunities, community.name];
			alert(`🎉 Joined ${community.name} community! You can now participate in events and discussions.`);
		}
	}

	function leaveCommunity(communityName: string) {
		if (!isEditing) return;
		
		if (confirm(`Are you sure you want to leave the ${communityName} community?`)) {
			settings.joinedCommunities = settings.joinedCommunities.filter(c => c !== communityName);
			
			// If leaving primary community, reset to first joined community
			if (settings.primaryCommunity === communityName) {
				settings.primaryCommunity = settings.joinedCommunities[0] || '';
			}
		}
	}

	function getCommunityInfo(communityName: string) {
		return tcgCommunities.find(c => c.name === communityName) || 
			{ icon: '🎮', color: '#2DD4BF', name: communityName };
	}
</script>

<div class="community-settings">
	<div class="settings-grid">
		<!-- Primary Community -->
		<div class="setting-card">
			<h3 class="card-title">🏠 Primary Community</h3>
			{#if isEditing}
				<select bind:value={settings.primaryCommunity} class="community-select">
					{#each settings.joinedCommunities as community}
						<option value={community}>{community}</option>
					{/each}
				</select>
				<div class="primary-tip">
					💡 Your primary community determines your main dashboard and recommendations
				</div>
			{:else}
				{@const communityInfo = getCommunityInfo(settings.primaryCommunity)}
				<div class="primary-community-display">
					<div class="community-badge" style="border-color: {communityInfo.color}; background: {communityInfo.color}20;">
						<span class="community-icon">{communityInfo.icon}</span>
						<div class="community-details">
							<div class="community-name">{settings.primaryCommunity}</div>
							<div class="community-status">Primary Community</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Community Roles -->
		<div class="setting-card">
			<h3 class="card-title">👤 Community Roles</h3>
			<div class="roles-grid">
				{#each rolePreferences as role}
					<div class="role-item" class:selected={settings.rolePreferences.includes(role.id)}>
						<div class="role-header">
							<span class="role-icon">{role.icon}</span>
							<div class="role-info">
								<div class="role-name">{role.name}</div>
								<div class="role-desc">{role.desc}</div>
							</div>
						</div>
						{#if isEditing}
							<button
								class="role-toggle"
								class:active={settings.rolePreferences.includes(role.id)}
								on:click={() => toggleArrayItem(settings.rolePreferences, role.id)}
							>
								{settings.rolePreferences.includes(role.id) ? '✓' : '+'}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Joined Communities -->
		<div class="setting-card full-width">
			<h3 class="card-title">🌟 Joined Communities</h3>
			
			<!-- Current Communities -->
			<div class="joined-communities">
				<h4 class="section-subtitle">Your Communities ({settings.joinedCommunities.length})</h4>
				<div class="communities-list">
					{#each settings.joinedCommunities as communityName}
						{@const communityInfo = getCommunityInfo(communityName)}
						<div class="community-card" style="border-color: {communityInfo.color};">
							<div class="community-header">
								<span class="community-icon" style="filter: drop-shadow(2px 2px 4px {communityInfo.color}50);">
									{communityInfo.icon}
								</span>
								<div class="community-info">
									<div class="community-name">{communityName}</div>
									<div class="community-meta">
										{#if settings.primaryCommunity === communityName}
											<span class="primary-badge">Primary</span>
										{/if}
										<span class="member-since">Member since March 2024</span>
									</div>
								</div>
							</div>
							{#if isEditing && communityName !== settings.primaryCommunity}
								<button 
									class="leave-btn"
									on:click={() => leaveCommunity(communityName)}
								>
									<i class="fas fa-times"></i>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Available Communities -->
			{#if isEditing}
				{@const availableCommunities = tcgCommunities.filter(c => !settings.joinedCommunities.includes(c.name))}
				{#if availableCommunities.length > 0}
					<div class="available-communities">
						<h4 class="section-subtitle">Available Communities</h4>
						<div class="available-list">
							{#each availableCommunities as community}
								<button 
									class="join-community-btn"
									on:click={() => joinCommunity(community.id)}
									style="border-color: {community.color}40; background: {community.color}10;"
								>
									<span class="community-icon">{community.icon}</span>
									<span class="community-name">{community.name}</span>
									<i class="fas fa-plus join-icon"></i>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Community Preferences -->
		<div class="setting-card">
			<h3 class="card-title">⚙️ Preferences</h3>
			<div class="preferences-list">
				<div class="preference-item">
					<div class="preference-info">
						<div class="preference-title">Mentoring</div>
						<div class="preference-desc">Help new players learn the game</div>
					</div>
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={settings.mentoring} disabled={!isEditing} />
						<span class="toggle-slider"></span>
					</label>
				</div>

				<div class="preference-item">
					<div class="preference-info">
						<div class="preference-title">Event Notifications</div>
						<div class="preference-desc">Get notified about upcoming events</div>
					</div>
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={settings.eventNotifications} disabled={!isEditing} />
						<span class="toggle-slider"></span>
					</label>
				</div>

				<div class="preference-item">
					<div class="preference-info">
						<div class="preference-title">Tournament Reminders</div>
						<div class="preference-desc">Reminders before tournament start</div>
					</div>
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={settings.tournamentReminders} disabled={!isEditing} />
						<span class="toggle-slider"></span>
					</label>
				</div>

				<div class="preference-item">
					<div class="preference-info">
						<div class="preference-title">Community Updates</div>
						<div class="preference-desc">News and announcements</div>
					</div>
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={settings.communityUpdates} disabled={!isEditing} />
						<span class="toggle-slider"></span>
					</label>
				</div>
			</div>
		</div>

		<!-- Community Stats -->
		{#if !isEditing}
			<div class="setting-card">
				<h3 class="card-title">📊 Community Stats</h3>
				<div class="stats-list">
					<div class="stat-item">
						<div class="stat-icon">🏆</div>
						<div class="stat-info">
							<div class="stat-value">12</div>
							<div class="stat-label">Events Organized</div>
						</div>
					</div>
					<div class="stat-item">
						<div class="stat-icon">👥</div>
						<div class="stat-info">
							<div class="stat-value">1,247</div>
							<div class="stat-label">Community Reach</div>
						</div>
					</div>
					<div class="stat-item">
						<div class="stat-icon">💬</div>
						<div class="stat-info">
							<div class="stat-value">456</div>
							<div class="stat-label">Messages Sent</div>
						</div>
					</div>
					<div class="stat-item">
						<div class="stat-icon">⭐</div>
						<div class="stat-info">
							<div class="stat-value">4.8</div>
							<div class="stat-label">Community Rating</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.community-settings {
		max-width: 1200px;
		margin: 0 auto;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.setting-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
	}

	.setting-card.full-width {
		grid-column: 1 / -1;
	}

	.card-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
	}

	.section-subtitle {
		font-size: 1rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
	}

	/* Primary Community */
	.community-select {
		width: 100%;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.primary-tip {
		margin-top: 1rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 6px;
		border-left: 3px solid #2DD4BF;
	}

	.primary-community-display {
		display: flex;
		justify-content: center;
	}

	.community-badge {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid;
		min-width: 250px;
	}

	.community-icon {
		font-size: 2.5rem;
	}

	.community-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.2rem;
	}

	.community-status {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Roles Grid */
	.roles-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.role-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	.role-item.selected {
		background: rgba(45, 212, 191, 0.1);
		border-color: rgba(45, 212, 191, 0.3);
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.role-icon {
		font-size: 1.5rem;
	}

	.role-name {
		font-weight: 600;
		color: white;
		margin-bottom: 0.2rem;
	}

	.role-desc {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.role-toggle {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		transition: all 0.3s ease;
	}

	.role-toggle:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.role-toggle.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		border-color: #2DD4BF;
		color: white;
	}

	/* Communities Lists */
	.joined-communities {
		margin-bottom: 2rem;
	}

	.communities-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.community-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		border: 2px solid;
		transition: all 0.3s ease;
	}

	.community-card:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
	}

	.community-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.community-info {
		flex: 1;
	}

	.community-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.3rem;
	}

	.primary-badge {
		padding: 0.2rem 0.6rem;
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.member-since {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.leave-btn {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: none;
		background: rgba(239, 68, 68, 0.2);
		color: #EF4444;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.leave-btn:hover {
		background: rgba(239, 68, 68, 0.4);
		transform: scale(1.1);
	}

	/* Available Communities */
	.available-communities {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 2rem;
	}

	.available-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.join-community-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		padding: 1.5rem;
		border: 2px dashed;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		color: rgba(255, 255, 255, 0.8);
	}

	.join-community-btn:hover {
		background: rgba(255, 255, 255, 0.05) !important;
		color: white;
		transform: translateY(-2px);
	}

	.join-icon {
		font-size: 1.2rem;
		opacity: 0.7;
	}

	/* Preferences */
	.preferences-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.preference-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.preference-title {
		font-weight: 600;
		color: white;
		margin-bottom: 0.2rem;
	}

	.preference-desc {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
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

	input:disabled + .toggle-slider {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Stats */
	.stats-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
	}

	.stat-icon {
		font-size: 1.5rem;
	}

	.stat-value {
		font-size: 1.3rem;
		font-weight: 700;
		color: #2DD4BF;
		font-family: 'Nunito', sans-serif;
	}

	.stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}

		.community-badge {
			min-width: auto;
		}

		.available-list {
			grid-template-columns: 1fr;
		}

		.community-card,
		.preference-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.community-header {
			width: 100%;
		}

		.preference-item {
			align-items: stretch;
		}

		.toggle-switch {
			align-self: center;
		}
	}
</style>