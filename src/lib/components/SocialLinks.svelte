<script lang="ts">
	export let links: any;
	export let isEditing: boolean = false;

	const socialPlatforms = [
		{
			id: 'twitch',
			name: 'Twitch',
			icon: 'fab fa-twitch',
			color: '#9146FF',
			placeholder: 'https://twitch.tv/yourusername',
			prefix: 'https://twitch.tv/'
		},
		{
			id: 'youtube',
			name: 'YouTube',
			icon: 'fab fa-youtube',
			color: '#FF0000',
			placeholder: 'https://youtube.com/@yourchannel',
			prefix: 'https://youtube.com/@'
		},
		{
			id: 'twitter',
			name: 'Twitter/X',
			icon: 'fab fa-x-twitter',
			color: '#000000',
			placeholder: 'https://twitter.com/yourusername',
			prefix: 'https://twitter.com/'
		},
		{
			id: 'instagram',
			name: 'Instagram',
			icon: 'fab fa-instagram',
			color: '#E4405F',
			placeholder: 'https://instagram.com/yourusername',
			prefix: 'https://instagram.com/'
		},
		{
			id: 'tiktok',
			name: 'TikTok',
			icon: 'fab fa-tiktok',
			color: '#000000',
			placeholder: 'https://tiktok.com/@yourusername',
			prefix: 'https://tiktok.com/@'
		},
		{
			id: 'discord',
			name: 'Discord',
			icon: 'fab fa-discord',
			color: '#5865F2',
			placeholder: 'YourUsername#1234',
			prefix: ''
		},
		{
			id: 'website',
			name: 'Website',
			icon: 'fas fa-globe',
			color: '#2DD4BF',
			placeholder: 'https://yourwebsite.com',
			prefix: 'https://'
		}
	];

	function openLink(url: string) {
		if (!url) return;
		
		// Handle Discord differently (no clickable link)
		if (url.includes('#')) {
			navigator.clipboard?.writeText(url);
			alert('📋 Discord username copied to clipboard!');
			return;
		}
		
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function validateUrl(platformId: string, value: string): string {
		if (!value) return '';
		
		const platform = socialPlatforms.find(p => p.id === platformId);
		if (!platform) return value;
		
		// Special handling for Discord (no URL validation needed)
		if (platformId === 'discord') {
			return value;
		}
		
		// Ensure URL starts with https:// for web platforms
		if (!value.startsWith('http://') && !value.startsWith('https://')) {
			return `https://${value}`;
		}
		
		return value;
	}

	function getDisplayText(platformId: string, url: string): string {
		if (!url) return 'Not set';
		
		if (platformId === 'discord') {
			return url;
		}
		
		// Extract readable part from URL
		try {
			const urlObj = new URL(url);
			return urlObj.hostname + urlObj.pathname;
		} catch {
			return url;
		}
	}

	function handleUrlChange(platformId: string, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		links[platformId] = validateUrl(platformId, value);
	}
</script>

<div class="social-links">
	<div class="links-grid">
		{#each socialPlatforms as platform}
			<div class="link-card">
				<div class="link-header">
					<div class="platform-info">
						<i class={platform.icon} style="color: {platform.color}; font-size: 1.5rem;"></i>
						<div class="platform-details">
							<div class="platform-name">{platform.name}</div>
							<div class="link-status" class:connected={links[platform.id]} class:not-connected={!links[platform.id]}>
								{links[platform.id] ? '✅ Connected' : '⚪ Not connected'}
							</div>
						</div>
					</div>
				</div>

				{#if isEditing}
					<div class="link-input-group">
						<input
							type="text"
							bind:value={links[platform.id]}
							placeholder={platform.placeholder}
							on:blur={(e) => handleUrlChange(platform.id, e)}
							class="link-input"
						/>
						{#if links[platform.id]}
							<button 
								class="test-link-btn" 
								on:click={() => openLink(links[platform.id])}
								type="button"
							>
								<i class="fas fa-external-link-alt"></i>
							</button>
						{/if}
					</div>
				{:else}
					{#if links[platform.id]}
						<div class="link-display">
							<button 
								class="link-button"
								on:click={() => openLink(links[platform.id])}
								style="border-color: {platform.color}20; color: {platform.color}"
							>
								<span class="link-text">{getDisplayText(platform.id, links[platform.id])}</span>
								{#if platform.id !== 'discord'}
									<i class="fas fa-external-link-alt"></i>
								{:else}
									<i class="fas fa-copy"></i>
								{/if}
							</button>
						</div>
					{:else}
						<div class="link-empty">
							<span>No {platform.name.toLowerCase()} profile linked</span>
						</div>
					{/if}
				{/if}

				<!-- Platform-specific tips -->
				{#if isEditing}
					<div class="platform-tip">
						{#if platform.id === 'twitch'}
							💡 Link your Twitch for stream integration
						{:else if platform.id === 'youtube'}
							💡 YouTube channel for video content sharing
						{:else if platform.id === 'discord'}
							💡 Format: YourUsername#1234
						{:else if platform.id === 'website'}
							💡 Your personal website or portfolio
						{:else}
							💡 Connect for cross-platform sharing
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Social Media Tips -->
	{#if isEditing}
		<div class="tips-section">
			<h3 class="tips-title">🚀 Social Media Tips</h3>
			<div class="tips-grid">
				<div class="tip-card">
					<div class="tip-icon">🔗</div>
					<div class="tip-content">
						<div class="tip-title">Consistent Branding</div>
						<div class="tip-desc">Use the same username across all platforms for easy discovery</div>
					</div>
				</div>
				<div class="tip-card">
					<div class="tip-icon">📱</div>
					<div class="tip-content">
						<div class="tip-title">Cross-Platform Promotion</div>
						<div class="tip-desc">Share content across platforms to maximize reach</div>
					</div>
				</div>
				<div class="tip-card">
					<div class="tip-icon">🎯</div>
					<div class="tip-content">
						<div class="tip-title">Platform-Specific Content</div>
						<div class="tip-desc">Tailor your content format to each platform's audience</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.social-links {
		max-width: 1000px;
		margin: 0 auto;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.link-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
		transition: all 0.3s ease;
	}

	.link-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(45, 212, 191, 0.15);
	}

	.link-header {
		margin-bottom: 1.5rem;
	}

	.platform-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.platform-details {
		flex: 1;
	}

	.platform-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.2rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.3rem;
	}

	.link-status {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.link-status.connected {
		color: #10B981;
	}

	.link-status.not-connected {
		color: #6B7280;
	}

	/* Input Group */
	.link-input-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.link-input {
		flex: 1;
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
		transition: border-color 0.3s ease;
	}

	.link-input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.link-input:focus {
		outline: none;
		border-color: #2DD4BF;
		box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
	}

	.test-link-btn {
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.2);
		border: 1px solid rgba(45, 212, 191, 0.4);
		border-radius: 8px;
		color: #2DD4BF;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.test-link-btn:hover {
		background: rgba(45, 212, 191, 0.3);
		transform: scale(1.05);
	}

	/* Link Display */
	.link-display {
		margin-bottom: 1rem;
	}

	.link-button {
		width: 100%;
		padding: 1rem;
		border: 2px solid;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.link-button:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.link-text {
		flex: 1;
		text-align: left;
		font-weight: 500;
		word-break: break-all;
	}

	.link-empty {
		padding: 1rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		margin-bottom: 1rem;
	}

	/* Platform Tips */
	.platform-tip {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
	}

	/* Tips Section */
	.tips-section {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
		.links-grid {
			grid-template-columns: 1fr;
		}

		.link-input-group {
			flex-direction: column;
			align-items: stretch;
		}

		.test-link-btn {
			align-self: flex-end;
			width: auto;
		}

		.tips-grid {
			grid-template-columns: 1fr;
		}

		.tip-card {
			flex-direction: column;
			text-align: center;
		}

		.tip-icon {
			align-self: center;
		}
	}
</style>