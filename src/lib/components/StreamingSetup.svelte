<script lang="ts">
	export let setup: any;
	export let isEditing: boolean = false;

	const platforms = ['Twitch', 'YouTube', 'Facebook Gaming', 'TikTok Live', 'Discord'];
	const streamingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const overlayThemes = ['TCG Magic', 'Pokemon Adventure', 'Yu-Gi-Oh Duel', 'Lorcana Dreams', 'Dark Gaming', 'Neon Cyber', 'Minimalist Clean'];
	const moderationLevels = ['Off', 'Light', 'Moderate', 'Strict', 'Auto-ban'];
	
	const equipmentCategories = [
		{
			category: 'Microphone',
			options: ['Built-in', 'Blue Yeti', 'Audio-Technica AT2020', 'Shure SM7B', 'Rode PodMic', 'Other']
		},
		{
			category: 'Camera',
			options: ['Built-in', 'Logitech C920', 'Logitech C922', 'Sony A7III', 'Canon EOS M50', 'DSLR Setup', 'Other']
		},
		{
			category: 'Streaming Software',
			options: ['OBS Studio', 'Streamlabs OBS', 'XSplit', 'Wirecast', 'NVIDIA Broadcast', 'Other']
		}
	];

	function toggleArrayItem(array: string[], item: string) {
		if (!isEditing) return;
		
		const index = array.indexOf(item);
		if (index > -1) {
			array.splice(index, 1);
		} else {
			array.push(item);
		}
		setup = { ...setup }; // Trigger reactivity
	}

	function generateStreamTitle() {
		if (!isEditing) return;
		
		const templates = [
			'🎮 #{game} with {streamer} | #{format} Fun!',
			'⚔️ Live #{game} Stream | {format} Battles!',
			'🃏 {streamer} Plays #{game} | #{format} Action!',
			'🏆 Competitive #{game} | {format} Tournament Prep',
			'🎯 #{game} Draft Night | Pack Opening & Games'
		];
		
		const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
		setup.streamTitle = randomTemplate;
	}

	function testStreamSetup() {
		alert('🧪 Stream test feature coming soon! Will check your streaming setup and provide optimization suggestions.');
	}

	function exportSettings() {
		alert('💾 Export settings feature coming soon! Save your streaming configuration as a backup file.');
	}

	function importSettings() {
		alert('📁 Import settings feature coming soon! Load streaming configuration from a backup file.');
	}
</script>

<div class="streaming-setup">
	<div class="setup-grid">
		<!-- Primary Platform -->
		<div class="setup-card">
			<h3 class="card-title">📺 Primary Platform</h3>
			{#if isEditing}
				<select bind:value={setup.primaryPlatform} class="platform-select">
					{#each platforms as platform}
						<option value={platform}>{platform}</option>
					{/each}
				</select>
				<div class="platform-tip">
					💡 Choose your main streaming platform for integration and analytics
				</div>
			{:else}
				<div class="platform-display">
					<div class="platform-badge" class:twitch={setup.primaryPlatform === 'Twitch'} 
						class:youtube={setup.primaryPlatform === 'YouTube'}>
						{#if setup.primaryPlatform === 'Twitch'}
							<i class="fab fa-twitch"></i>
						{:else if setup.primaryPlatform === 'YouTube'}
							<i class="fab fa-youtube"></i>
						{:else if setup.primaryPlatform === 'Facebook Gaming'}
							<i class="fab fa-facebook"></i>
						{:else if setup.primaryPlatform === 'TikTok Live'}
							<i class="fab fa-tiktok"></i>
						{:else if setup.primaryPlatform === 'Discord'}
							<i class="fab fa-discord"></i>
						{/if}
						{setup.primaryPlatform}
					</div>
				</div>
			{/if}
		</div>

		<!-- Schedule -->
		<div class="setup-card">
			<h3 class="card-title">📅 Streaming Schedule</h3>
			<div class="schedule-section">
				<div class="field-group">
					<label>Streaming Days</label>
					{#if isEditing}
						<div class="days-selector">
							{#each streamingDays as day}
								<button
									class="day-chip"
									class:selected={setup.streamingDays.includes(day)}
									on:click={() => toggleArrayItem(setup.streamingDays, day)}
								>
									{day.substring(0, 3)}
								</button>
							{/each}
						</div>
					{:else}
						<div class="selected-days">
							{#each setup.streamingDays as day}
								<span class="day-tag">{day}</span>
							{/each}
						</div>
					{/if}
				</div>
				
				<div class="field-group">
					<label>Stream Hours</label>
					{#if isEditing}
						<input type="text" bind:value={setup.streamingHours} placeholder="e.g., 7:00 PM - 11:00 PM PST" />
					{:else}
						<div class="hours-display">{setup.streamingHours}</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Stream Configuration -->
		<div class="setup-card full-width">
			<h3 class="card-title">⚙️ Stream Configuration</h3>
			<div class="config-grid">
				<div class="field-group">
					<label>Stream Title Template</label>
					{#if isEditing}
						<div class="title-input-group">
							<input type="text" bind:value={setup.streamTitle} placeholder="Your stream title template..." />
							<button class="generate-btn" on:click={generateStreamTitle} type="button">
								<i class="fas fa-magic"></i> Generate
							</button>
						</div>
						<div class="template-tip">
							💡 Use variables: #{`{game}`}, #{`{format}`}, {`{streamer}`}
						</div>
					{:else}
						<div class="title-display">{setup.streamTitle}</div>
					{/if}
				</div>

				<div class="field-group">
					<label>Overlay Theme</label>
					{#if isEditing}
						<select bind:value={setup.overlayTheme}>
							{#each overlayThemes as theme}
								<option value={theme}>{theme}</option>
							{/each}
						</select>
					{:else}
						<div class="theme-display">
							<span class="theme-badge">{setup.overlayTheme}</span>
						</div>
					{/if}
				</div>

				<div class="field-group">
					<label>Chat Moderation</label>
					{#if isEditing}
						<select bind:value={setup.chatModeration}>
							{#each moderationLevels as level}
								<option value={level}>{level}</option>
							{/each}
						</select>
					{:else}
						<div class="moderation-display" class:moderate={setup.chatModeration === 'Moderate'}>
							{setup.chatModeration}
						</div>
					{/if}
				</div>

				<div class="field-group">
					<label>Auto-host</label>
					{#if isEditing}
						<label class="toggle-switch">
							<input type="checkbox" bind:checked={setup.autoHost} />
							<span class="toggle-slider"></span>
						</label>
					{:else}
						<div class="toggle-display">
							{setup.autoHost ? '✅ Enabled' : '❌ Disabled'}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Equipment Setup -->
		<div class="setup-card full-width">
			<h3 class="card-title">🎥 Equipment Setup</h3>
			<div class="equipment-grid">
				{#each equipmentCategories as category}
					<div class="equipment-section">
						<label class="equipment-label">{category.category}</label>
						{#if isEditing}
							<select bind:value={setup[category.category.toLowerCase().replace(' ', '') + 'Setup']}>
								{#each category.options as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
						{:else}
							<div class="equipment-display">
								<div class="equipment-icon">
									{#if category.category === 'Microphone'}
										🎤
									{:else if category.category === 'Camera'}
										📹
									{:else if category.category === 'Streaming Software'}
										💻
									{/if}
								</div>
								<div class="equipment-name">
									{setup[category.category.toLowerCase().replace(' ', '') + 'Setup'] || 'Not set'}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Stream Quality & Settings -->
		{#if !isEditing}
			<div class="setup-card">
				<h3 class="card-title">📊 Stream Metrics</h3>
				<div class="metrics-grid">
					<div class="metric-item">
						<div class="metric-value">1080p</div>
						<div class="metric-label">Resolution</div>
					</div>
					<div class="metric-item">
						<div class="metric-value">60fps</div>
						<div class="metric-label">Framerate</div>
					</div>
					<div class="metric-item">
						<div class="metric-value">6000</div>
						<div class="metric-label">Bitrate</div>
					</div>
					<div class="metric-item">
						<div class="metric-value">x264</div>
						<div class="metric-label">Encoder</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		{#if isEditing}
			<div class="setup-card">
				<h3 class="card-title">🔧 Setup Tools</h3>
				<div class="tools-grid">
					<button class="tool-btn" on:click={testStreamSetup}>
						<i class="fas fa-vial"></i>
						<span>Test Setup</span>
					</button>
					<button class="tool-btn" on:click={exportSettings}>
						<i class="fas fa-download"></i>
						<span>Export Settings</span>
					</button>
					<button class="tool-btn" on:click={importSettings}>
						<i class="fas fa-upload"></i>
						<span>Import Settings</span>
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Streaming Tips -->
	{#if isEditing}
		<div class="tips-section">
			<h3 class="tips-title">💡 Streaming Tips</h3>
			<div class="tips-grid">
				<div class="tip-card">
					<div class="tip-icon">🎯</div>
					<div class="tip-content">
						<div class="tip-title">Consistency is Key</div>
						<div class="tip-desc">Stick to your schedule to build a loyal audience who knows when to find you</div>
					</div>
				</div>
				<div class="tip-card">
					<div class="tip-icon">🎮</div>
					<div class="tip-content">
						<div class="tip-title">Interactive Gameplay</div>
						<div class="tip-desc">Explain your plays, involve chat in decisions, and teach strategies</div>
					</div>
				</div>
				<div class="tip-card">
					<div class="tip-icon">📱</div>
					<div class="tip-content">
						<div class="tip-title">Multi-Platform</div>
						<div class="tip-desc">Stream simultaneously to multiple platforms to maximize reach</div>
					</div>
				</div>
				<div class="tip-card">
					<div class="tip-icon">🎨</div>
					<div class="tip-content">
						<div class="tip-title">Brand Your Stream</div>
						<div class="tip-desc">Create consistent visuals, overlays, and emotes for professional appeal</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.streaming-setup {
		max-width: 1200px;
		margin: 0 auto;
	}

	.setup-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.setup-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
	}

	.setup-card.full-width {
		grid-column: 1 / -1;
	}

	.card-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
	}

	/* Platform Display */
	.platform-select {
		width: 100%;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.platform-display {
		display: flex;
		justify-content: center;
	}

	.platform-badge {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1.5rem 2rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		font-size: 1.2rem;
		font-weight: 700;
		border-left: 4px solid;
	}

	.platform-badge.twitch {
		border-left-color: #9146FF;
		color: #9146FF;
		background: rgba(145, 70, 255, 0.1);
	}

	.platform-badge.youtube {
		border-left-color: #FF0000;
		color: #FF0000;
		background: rgba(255, 0, 0, 0.1);
	}

	.platform-tip {
		margin-top: 1rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 6px;
		border-left: 3px solid #2DD4BF;
	}

	/* Schedule Section */
	.schedule-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.field-group label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.field-group input,
	.field-group select {
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.days-selector {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.5rem;
	}

	.day-chip {
		padding: 0.8rem 0.3rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
		font-size: 0.8rem;
		text-align: center;
	}

	.day-chip:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.day-chip.selected {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		border-color: #2DD4BF;
		color: white;
	}

	.selected-days {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.day-tag {
		padding: 0.4rem 0.8rem;
		background: rgba(45, 212, 191, 0.2);
		color: #2DD4BF;
		border-radius: 15px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.hours-display {
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
		color: white;
		font-weight: 600;
	}

	/* Configuration Grid */
	.config-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 1.5rem;
	}

	.title-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.title-input-group input {
		flex: 1;
	}

	.generate-btn {
		padding: 0.8rem;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.generate-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
	}

	.template-tip {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
	}

	.title-display {
		padding: 1rem;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 8px;
		border-left: 3px solid #7C3AED;
		color: white;
		font-weight: 500;
	}

	.theme-display {
		padding: 0.8rem;
	}

	.theme-badge {
		padding: 0.4rem 1rem;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		color: white;
		border-radius: 15px;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.moderation-display {
		padding: 0.8rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.8);
	}

	.moderation-display.moderate {
		background: rgba(245, 158, 11, 0.1);
		color: #F59E0B;
		border-left: 3px solid #F59E0B;
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

	.toggle-display {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	/* Equipment Grid */
	.equipment-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	.equipment-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.equipment-label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.equipment-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		border-left: 3px solid #2DD4BF;
	}

	.equipment-icon {
		font-size: 1.8rem;
	}

	.equipment-name {
		color: white;
		font-weight: 600;
	}

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	.metric-item {
		text-align: center;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
	}

	.metric-value {
		font-size: 1.3rem;
		font-weight: 700;
		color: #2DD4BF;
		margin-bottom: 0.3rem;
	}

	.metric-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Tools Grid */
	.tools-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.tool-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.08);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(45, 212, 191, 0.4);
		color: white;
		transform: translateY(-2px);
	}

	.tool-btn i {
		font-size: 1.5rem;
	}

	.tool-btn span {
		font-weight: 600;
		font-size: 0.9rem;
	}

	/* Tips Section */
	.tips-section {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
	}

	.tips-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
		text-align: center;
	}

	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.tip-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		border-left: 3px solid #2DD4BF;
	}

	.tip-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.tip-content {
		flex: 1;
	}

	.tip-title {
		font-weight: 600;
		color: white;
		margin-bottom: 0.5rem;
	}

	.tip-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.4;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.setup-grid {
			grid-template-columns: 1fr;
		}

		.config-grid {
			grid-template-columns: 1fr;
		}

		.equipment-grid {
			grid-template-columns: 1fr;
		}

		.metrics-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.tools-grid {
			grid-template-columns: 1fr;
		}

		.tips-grid {
			grid-template-columns: 1fr;
		}

		.day-chip {
			font-size: 0.7rem;
			padding: 0.6rem 0.2rem;
		}

		.title-input-group {
			flex-direction: column;
		}

		.tip-card {
			flex-direction: column;
			text-align: center;
		}
	}
</style>