<script lang="ts">
	export let platforms: any[];

	let postContent = '';
	let selectedPlatforms = [];
	let scheduledDate = '';
	let scheduledTime = '';
	let attachments = [];
	let hashtagSuggestions = ['#MTG', '#Commander', '#Pokemon', '#TCG', '#YuGiOh', '#Lorcana', '#Streaming', '#GamePod'];

	// Character limits per platform
	const characterLimits = {
		twitter: 280,
		instagram: 2200,
		tiktok: 150,
		youtube: 5000,
		twitch: 500,
		discord: 2000
	};

	$: currentLimit = selectedPlatforms.length > 0 
		? Math.min(...selectedPlatforms.map(p => characterLimits[p] || 2000))
		: 2000;
	
	$: charactersRemaining = currentLimit - postContent.length;

	function togglePlatform(platformId: string) {
		const platform = platforms.find(p => p.id === platformId);
		if (!platform || !platform.connected) return;

		if (selectedPlatforms.includes(platformId)) {
			selectedPlatforms = selectedPlatforms.filter(p => p !== platformId);
		} else {
			selectedPlatforms = [...selectedPlatforms, platformId];
		}
	}

	function addHashtag(hashtag: string) {
		if (!postContent.includes(hashtag)) {
			postContent = postContent.trim() + ` ${hashtag}`;
		}
	}

	function schedulePost() {
		if (!postContent.trim()) {
			alert('⚠️ Please enter some content for your post.');
			return;
		}

		if (selectedPlatforms.length === 0) {
			alert('⚠️ Please select at least one platform to post to.');
			return;
		}

		const platformNames = selectedPlatforms.map(id => 
			platforms.find(p => p.id === id)?.name
		).join(', ');

		if (scheduledDate && scheduledTime) {
			alert(`⏰ Post scheduled for ${scheduledDate} at ${scheduledTime} on: ${platformNames}`);
		} else {
			alert(`🚀 Post published immediately to: ${platformNames}`);
		}

		// Reset form
		postContent = '';
		selectedPlatforms = [];
		scheduledDate = '';
		scheduledTime = '';
	}

	function saveDraft() {
		alert('💾 Draft saved! You can find it in your drafts folder.');
	}

	function addMedia() {
		alert('📎 Media upload feature coming soon! Supports images, videos, and GIFs.');
	}

	function previewPost() {
		alert(`👀 Preview:\n\n${postContent}\n\nPlatforms: ${selectedPlatforms.join(', ')}`);
	}
</script>

<section class="composer-section">
	<div class="section-header">
		<h2 class="section-title">✍️ Compose Post</h2>
		<p class="section-subtitle">Create engaging TCG content for your streaming community</p>
	</div>

	<div class="composer-container">
		<!-- Platform Selection -->
		<div class="platform-selection">
			<h3 class="selection-title">Select Platforms</h3>
			<div class="platform-toggles">
				{#each platforms as platform}
					<button
						class="platform-toggle"
						class:active={selectedPlatforms.includes(platform.id)}
						class:disabled={!platform.connected}
						style="--platform-color: {platform.color}"
						on:click={() => togglePlatform(platform.id)}
						title={platform.connected ? `Post to ${platform.name}` : `Connect ${platform.name} first`}
					>
						<i class={platform.icon}></i>
						<span>{platform.name}</span>
						{#if !platform.connected}
							<i class="fas fa-lock disconnect-icon"></i>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Content Composer -->
		<div class="content-composer">
			<div class="composer-header">
				<h3 class="composer-title">Content</h3>
				<div class="character-counter" class:warning={charactersRemaining < 50} class:error={charactersRemaining < 0}>
					{charactersRemaining} characters remaining
				</div>
			</div>

			<textarea
				class="content-textarea"
				bind:value={postContent}
				placeholder="What's happening in the TCG world? Share your deck tech, tournament updates, or streaming highlights..."
				rows="8"
				class:error={charactersRemaining < 0}
			></textarea>

			<!-- Hashtag Suggestions -->
			<div class="hashtag-suggestions">
				<span class="suggestions-label">Quick hashtags:</span>
				{#each hashtagSuggestions as hashtag}
					<button 
						class="hashtag-btn"
						class:used={postContent.includes(hashtag)}
						on:click={() => addHashtag(hashtag)}
					>
						{hashtag}
					</button>
				{/each}
			</div>
		</div>

		<!-- Media & Options -->
		<div class="composer-options">
			<div class="media-section">
				<h4 class="options-title">Media & Attachments</h4>
				<div class="media-controls">
					<button class="btn btn-secondary btn-sm" on:click={addMedia}>
						<i class="fas fa-image"></i> Add Image/Video
					</button>
					<button class="btn btn-secondary btn-sm">
						<i class="fas fa-link"></i> Add Link
					</button>
					<button class="btn btn-secondary btn-sm">
						<i class="fas fa-poll"></i> Create Poll
					</button>
				</div>
			</div>

			<!-- Scheduling -->
			<div class="scheduling-section">
				<h4 class="options-title">Schedule Post (Optional)</h4>
				<div class="schedule-controls">
					<div class="date-input">
						<label for="schedule-date">Date</label>
						<input 
							type="date" 
							id="schedule-date" 
							bind:value={scheduledDate}
							min={new Date().toISOString().split('T')[0]}
						/>
					</div>
					<div class="time-input">
						<label for="schedule-time">Time</label>
						<input 
							type="time" 
							id="schedule-time" 
							bind:value={scheduledTime}
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="composer-actions">
			<div class="action-group">
				<button class="btn btn-secondary" on:click={saveDraft}>
					<i class="fas fa-save"></i> Save Draft
				</button>
				<button class="btn btn-secondary" on:click={previewPost}>
					<i class="fas fa-eye"></i> Preview
				</button>
			</div>
			
			<button 
				class="btn btn-primary btn-lg"
				on:click={schedulePost}
				disabled={!postContent.trim() || selectedPlatforms.length === 0 || charactersRemaining < 0}
			>
				{#if scheduledDate && scheduledTime}
					<i class="fas fa-clock"></i> Schedule Post
				{:else}
					<i class="fas fa-rocket"></i> Post Now
				{/if}
			</button>
		</div>
	</div>
</section>

<style>
	.composer-section {
		max-width: 800px;
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

	.composer-container {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 18px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	/* Platform Selection */
	.platform-selection {
		margin-bottom: 2rem;
	}

	.selection-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: white;
	}

	.platform-toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.platform-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.8rem 1.2rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
	}

	.platform-toggle:hover:not(.disabled) {
		border-color: var(--platform-color);
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.platform-toggle.active {
		border-color: var(--platform-color);
		background: linear-gradient(135deg, var(--platform-color), var(--platform-color));
		color: white;
		box-shadow: 0 4px 15px rgba(45, 212, 191, 0.25);
	}

	.platform-toggle.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.disconnect-icon {
		position: absolute;
		top: -5px;
		right: -5px;
		background: #EF4444;
		color: white;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
	}

	/* Content Composer */
	.content-composer {
		margin-bottom: 2rem;
	}

	.composer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.composer-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: white;
		margin: 0;
	}

	.character-counter {
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.character-counter.warning {
		color: #F59E0B;
	}

	.character-counter.error {
		color: #EF4444;
	}

	.content-textarea {
		width: 100%;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 1rem;
		line-height: 1.6;
		resize: vertical;
		min-height: 120px;
		backdrop-filter: blur(10px);
		transition: border-color 0.3s ease;
	}

	.content-textarea::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.content-textarea:focus {
		outline: none;
		border-color: #2DD4BF;
		box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
	}

	.content-textarea.error {
		border-color: #EF4444;
	}

	/* Hashtag Suggestions */
	.hashtag-suggestions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.suggestions-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.hashtag-btn {
		padding: 0.3rem 0.8rem;
		border: 1px solid rgba(45, 212, 191, 0.4);
		border-radius: 20px;
		background: rgba(45, 212, 191, 0.1);
		color: #2DD4BF;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.hashtag-btn:hover {
		background: rgba(45, 212, 191, 0.2);
		border-color: #2DD4BF;
	}

	.hashtag-btn.used {
		background: #2DD4BF;
		color: white;
		border-color: #2DD4BF;
	}

	/* Options */
	.composer-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.options-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: white;
		margin-bottom: 1rem;
	}

	.media-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.schedule-controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.date-input, .time-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.date-input label, .time-input label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.date-input input, .time-input input {
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.date-input input:focus, .time-input input:focus {
		outline: none;
		border-color: #2DD4BF;
	}

	/* Actions */
	.composer-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.action-group {
		display: flex;
		gap: 1rem;
	}

	.btn-sm {
		padding: 0.6rem 1rem;
		font-size: 0.9rem;
	}

	.btn-lg {
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.composer-options {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.schedule-controls {
			grid-template-columns: 1fr;
		}

		.composer-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.action-group {
			justify-content: center;
		}

		.platform-toggles {
			justify-content: center;
		}
	}
</style>