<script lang="ts">
	export let posts: any[];
	export let platforms: any[];

	function getStatusColor(status: string): string {
		switch (status) {
			case 'draft': return '#6B7280';
			case 'scheduled': return '#F59E0B';
			case 'published': return '#10B981';
			case 'failed': return '#EF4444';
			default: return '#6B7280';
		}
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'draft': return '📝';
			case 'scheduled': return '⏰';
			case 'published': return '✅';
			case 'failed': return '❌';
			default: return '📄';
		}
	}

	function editPost(postId: string) {
		alert(`✏️ Editing post ${postId}. Would open composer with post content.`);
	}

	function deletePost(postId: string) {
		if (confirm('Are you sure you want to delete this post?')) {
			alert(`🗑️ Post ${postId} deleted.`);
		}
	}

	function duplicatePost(postId: string) {
		alert(`📋 Post ${postId} duplicated. Would open composer with copied content.`);
	}

	function viewAnalytics(postId: string) {
		alert(`📊 Viewing analytics for post ${postId}.`);
	}
</script>

<section class="scheduled-section">
	<div class="section-header">
		<h2 class="section-title">📅 Scheduled Posts</h2>
		<p class="section-subtitle">Manage your upcoming and published TCG content</p>
	</div>

	<div class="posts-container">
		{#each posts as post}
			<div class="post-card">
				<div class="post-header">
					<div class="post-status" style="background-color: {getStatusColor(post.status)}">
						{getStatusIcon(post.status)} {post.status}
					</div>
					<div class="post-date">
						{#if post.status === 'scheduled'}
							Scheduled for {post.scheduledFor.toLocaleDateString()} at {post.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						{:else if post.status === 'published'}
							Published {post.scheduledFor.toLocaleDateString()}
						{:else}
							Draft created {post.scheduledFor.toLocaleDateString()}
						{/if}
					</div>
				</div>

				<div class="post-content">
					{post.content}
				</div>

				<div class="post-platforms">
					<span class="platforms-label">Platforms:</span>
					<div class="platform-icons">
						{#each post.platforms as platformId}
							{@const platform = platforms.find(p => p.id === platformId)}
							{#if platform}
								<i class={platform.icon} style="color: {platform.color};" title={platform.name}></i>
							{/if}
						{/each}
					</div>
				</div>

				{#if post.engagement}
					<div class="post-engagement">
						<div class="engagement-stat">
							<i class="fas fa-heart"></i>
							<span>{post.engagement.likes}</span>
						</div>
						<div class="engagement-stat">
							<i class="fas fa-share"></i>
							<span>{post.engagement.shares}</span>
						</div>
						<div class="engagement-stat">
							<i class="fas fa-comment"></i>
							<span>{post.engagement.comments}</span>
						</div>
					</div>
				{/if}

				<div class="post-actions">
					{#if post.status === 'draft' || post.status === 'scheduled'}
						<button class="btn btn-primary btn-sm" on:click={() => editPost(post.id)}>
							<i class="fas fa-edit"></i> Edit
						</button>
					{/if}
					
					<button class="btn btn-secondary btn-sm" on:click={() => duplicatePost(post.id)}>
						<i class="fas fa-copy"></i> Duplicate
					</button>
					
					{#if post.status === 'published'}
						<button class="btn btn-secondary btn-sm" on:click={() => viewAnalytics(post.id)}>
							<i class="fas fa-chart-line"></i> Analytics
						</button>
					{/if}
					
					<button class="btn btn-danger btn-sm" on:click={() => deletePost(post.id)}>
						<i class="fas fa-trash"></i> Delete
					</button>
				</div>
			</div>
		{/each}

		{#if posts.length === 0}
			<div class="empty-state">
				<h3>📝 No posts yet</h3>
				<p>Your scheduled and published content will appear here.</p>
			</div>
		{/if}
	</div>
</section>

<style>
	.scheduled-section {
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

	.posts-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.post-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
		transition: all 0.3s ease;
	}

	.post-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(45, 212, 191, 0.15);
	}

	.post-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.post-status {
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		color: white;
	}

	.post-date {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.post-content {
		margin-bottom: 1rem;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
		line-height: 1.6;
	}

	.post-platforms {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.platforms-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.platform-icons {
		display: flex;
		gap: 0.5rem;
		font-size: 1.2rem;
	}

	.post-engagement {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.8rem;
		background: rgba(16, 185, 129, 0.1);
		border-radius: 8px;
	}

	.engagement-stat {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		color: #10B981;
	}

	.post-actions {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.btn-sm {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
	}

	.btn-danger {
		background: linear-gradient(135deg, #EF4444, #DC2626);
		color: white;
		border: none;
	}

	.btn-danger:hover {
		background: linear-gradient(135deg, #DC2626, #B91C1C);
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 18px;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.empty-state h3 {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: white;
	}

	.empty-state p {
		color: rgba(255, 255, 255, 0.8);
	}

	@media (max-width: 768px) {
		.post-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.post-actions {
			flex-wrap: wrap;
		}

		.btn-sm {
			flex: 1;
			min-width: 100px;
		}
	}
</style>