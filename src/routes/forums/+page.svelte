<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import ForumCategory from '$lib/components/ForumCategory.svelte';
	import PostModal from '$lib/components/PostModal.svelte';

	// Mock forum data
	let forumData = {
		categories: [
			{
				id: 'mtg',
				name: 'Magic: The Gathering',
				description: 'Discuss Magic formats, deck building, and gameplay strategies',
				icon: '🔮',
				color: '#FF6B35',
				postCount: 1247,
				memberCount: 8934,
				isModerated: true,
				subcategories: [
					{ id: 'mtg-commander', name: 'Commander/EDH', posts: 567, color: '#E53E3E' },
					{ id: 'mtg-modern', name: 'Modern', posts: 234, color: '#3182CE' },
					{ id: 'mtg-standard', name: 'Standard', posts: 189, color: '#38A169' },
					{ id: 'mtg-draft', name: 'Draft & Limited', posts: 157, color: '#805AD5' },
					{ id: 'mtg-deck-help', name: 'Deck Help', posts: 312, color: '#D69E2E' }
				]
			},
			{
				id: 'pokemon',
				name: 'Pokemon TCG',
				description: 'Pokemon TCG strategies, deck lists, and tournament discussion',
				icon: '⚡',
				color: '#FFD23F',
				postCount: 892,
				memberCount: 6234,
				isModerated: true,
				subcategories: [
					{ id: 'pokemon-competitive', name: 'Competitive Play', posts: 334, color: '#E53E3E' },
					{ id: 'pokemon-collecting', name: 'Collecting', posts: 278, color: '#3182CE' },
					{ id: 'pokemon-deck-lists', name: 'Deck Lists', posts: 156, color: '#38A169' },
					{ id: 'pokemon-news', name: 'News & Spoilers', posts: 124, color: '#805AD5' }
				]
			},
			{
				id: 'yugioh',
				name: 'Yu-Gi-Oh!',
				description: 'Yu-Gi-Oh! deck strategies, combos, and meta discussion',
				icon: '⚔️',
				color: '#7C3AED',
				postCount: 678,
				memberCount: 4567,
				isModerated: true,
				subcategories: [
					{ id: 'yugioh-meta', name: 'Meta Discussion', posts: 234, color: '#E53E3E' },
					{ id: 'yugioh-combos', name: 'Combos & Tech', posts: 189, color: '#3182CE' },
					{ id: 'yugioh-deck-help', name: 'Deck Building', posts: 156, color: '#38A169' },
					{ id: 'yugioh-casual', name: 'Casual Play', posts: 99, color: '#805AD5' }
				]
			},
			{
				id: 'lorcana',
				name: 'Disney Lorcana',
				description: 'Disney Lorcana strategies, deck building, and collection discussion',
				icon: '✨',
				color: '#EC4899',
				postCount: 456,
				memberCount: 3421,
				isModerated: true,
				subcategories: [
					{ id: 'lorcana-strategy', name: 'Strategy Discussion', posts: 167, color: '#E53E3E' },
					{ id: 'lorcana-collecting', name: 'Collecting & Trading', posts: 134, color: '#3182CE' },
					{ id: 'lorcana-deck-builds', name: 'Deck Builds', posts: 98, color: '#38A169' },
					{ id: 'lorcana-lore', name: 'Disney Lore', posts: 57, color: '#805AD5' }
				]
			},
			{
				id: 'general',
				name: 'General Discussion',
				description: 'TCG industry news, streaming tips, and community chat',
				icon: '💬',
				color: '#2DD4BF',
				postCount: 1034,
				memberCount: 12456,
				isModerated: false,
				subcategories: [
					{ id: 'general-news', name: 'TCG News', posts: 345, color: '#E53E3E' },
					{ id: 'general-streaming', name: 'Streaming Tips', posts: 234, color: '#3182CE' },
					{ id: 'general-community', name: 'Community', posts: 278, color: '#38A169' },
					{ id: 'general-marketplace', name: 'Buy/Sell/Trade', posts: 177, color: '#805AD5' }
				]
			}
		],
		recentPosts: [
			{
				id: '1',
				title: 'Best Commander decks for new players?',
				author: 'MagicNewbie_2024',
				category: 'mtg',
				subcategory: 'mtg-commander',
				timestamp: new Date('2024-12-04T14:30:00'),
				replies: 23,
				likes: 45,
				isSticky: false,
				preview: 'Looking for budget-friendly Commander decks that are good for learning...'
			},
			{
				id: '2',
				title: '[Guide] Pokemon TCG Rotation 2025 - What You Need to Know',
				author: 'PikachuMaster_Pro',
				category: 'pokemon',
				subcategory: 'pokemon-competitive',
				timestamp: new Date('2024-12-04T12:15:00'),
				replies: 67,
				likes: 134,
				isSticky: true,
				preview: 'Complete guide to the upcoming rotation and its impact on the meta...'
			},
			{
				id: '3',
				title: 'New Yu-Gi-Oh! Combo with latest cards',
				author: 'DuelKing_Elite',
				category: 'yugioh',
				subcategory: 'yugioh-combos',
				timestamp: new Date('2024-12-04T10:45:00'),
				replies: 12,
				likes: 28,
				isSticky: false,
				preview: 'Found an amazing combo using the new support cards from the latest set...'
			},
			{
				id: '4',
				title: 'Streaming setup recommendations for TCG content?',
				author: 'StreamLord_TCG',
				category: 'general',
				subcategory: 'general-streaming',
				timestamp: new Date('2024-12-04T09:20:00'),
				replies: 31,
				likes: 52,
				isSticky: false,
				preview: 'Looking to upgrade my streaming setup specifically for card games...'
			}
		]
	};

	let selectedCategory = 'all';
	let searchQuery = '';
	let sortBy = 'recent'; // recent, popular, replies
	let showNewPostModal = false;
	let selectedPost = null;

	onMount(() => {
		authStore.checkAuth();
	});

	function openNewPost() {
		selectedPost = null;
		showNewPostModal = true;
	}

	function closePostModal() {
		showNewPostModal = false;
		selectedPost = null;
	}

	function createPost(postData) {
		const newPost = {
			id: Date.now().toString(),
			...postData,
			author: $user?.username || 'You',
			timestamp: new Date(),
			replies: 0,
			likes: 0,
			isSticky: false
		};
		
		forumData.recentPosts = [newPost, ...forumData.recentPosts];
		
		// Update category post count
		const category = forumData.categories.find(c => c.id === postData.category);
		if (category) {
			category.postCount++;
			const subcategory = category.subcategories?.find(s => s.id === postData.subcategory);
			if (subcategory) {
				subcategory.posts++;
			}
		}
		
		alert(`📝 Post "${postData.title}" created successfully in ${category?.name}!`);
		closePostModal();
	}

	function likePost(postId: string) {
		const post = forumData.recentPosts.find(p => p.id === postId);
		if (post) {
			post.likes++;
			forumData = { ...forumData }; // Trigger reactivity
		}
	}

	function filterPosts() {
		let filtered = forumData.recentPosts;

		if (selectedCategory !== 'all') {
			filtered = filtered.filter(post => post.category === selectedCategory);
		}

		if (searchQuery) {
			filtered = filtered.filter(post => 
				post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				post.preview.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Sort posts
		if (sortBy === 'popular') {
			filtered.sort((a, b) => b.likes - a.likes);
		} else if (sortBy === 'replies') {
			filtered.sort((a, b) => b.replies - a.replies);
		} else {
			filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
		}

		return filtered;
	}

	function getCategoryInfo(categoryId: string) {
		return forumData.categories.find(c => c.id === categoryId) || { name: 'Unknown', icon: '❓', color: '#6B7280' };
	}

	function getSubcategoryInfo(categoryId: string, subcategoryId: string) {
		const category = forumData.categories.find(c => c.id === categoryId);
		return category?.subcategories?.find(s => s.id === subcategoryId) || { name: 'General', color: '#6B7280' };
	}

	function formatTimeAgo(timestamp: Date): string {
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
		
		if (diffInSeconds < 60) return 'just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	}

	$: filteredPosts = filterPosts();
	$: totalPosts = forumData.categories.reduce((sum, cat) => sum + cat.postCount, 0);
	$: totalMembers = forumData.categories.reduce((sum, cat) => sum + cat.memberCount, 0);
</script>

<svelte:head>
	<title>Forums - Shuffle & Sync</title>
	<meta name="description" content="Connect with the TCG community through discussions, deck help, and strategy sharing" />
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
			<div class="header-content">
				<div class="header-text">
					<h1 class="hero-title">💬 Community Forums</h1>
					<p class="hero-subtitle">
						Connect with fellow TCG players, share strategies, and get help with your decks
					</p>
				</div>
				
				<div class="header-actions">
					<button class="btn btn-primary" on:click={openNewPost}>
						<i class="fas fa-plus"></i> New Post
					</button>
				</div>
			</div>
		</header>

		<!-- Forum Stats -->
		<div class="forum-stats">
			<div class="stat-card">
				<div class="stat-icon">📝</div>
				<div class="stat-info">
					<div class="stat-value">{totalPosts.toLocaleString()}</div>
					<div class="stat-label">Total Posts</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">👥</div>
				<div class="stat-info">
					<div class="stat-value">{totalMembers.toLocaleString()}</div>
					<div class="stat-label">Community Members</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">🏆</div>
				<div class="stat-info">
					<div class="stat-value">{forumData.categories.length}</div>
					<div class="stat-label">Game Categories</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">📊</div>
				<div class="stat-info">
					<div class="stat-value">24/7</div>
					<div class="stat-label">Active Community</div>
				</div>
			</div>
		</div>

		<div class="forum-layout">
			<!-- Forum Categories Sidebar -->
			<div class="categories-sidebar">
				<h3 class="sidebar-title">🎮 Game Categories</h3>
				<div class="categories-list">
					<button 
						class="category-btn"
						class:active={selectedCategory === 'all'}
						on:click={() => selectedCategory = 'all'}
					>
						<div class="category-icon">🌟</div>
						<div class="category-info">
							<div class="category-name">All Categories</div>
							<div class="category-posts">{totalPosts} posts</div>
						</div>
					</button>
					
					{#each forumData.categories as category}
						<ForumCategory 
							{category}
							isSelected={selectedCategory === category.id}
							onSelect={() => selectedCategory = category.id}
						/>
					{/each}
				</div>
			</div>

			<!-- Main Forum Content -->
			<div class="forum-main">
				<!-- Forum Controls -->
				<div class="forum-controls">
					<div class="search-section">
						<div class="search-input-group">
							<i class="fas fa-search search-icon"></i>
							<input
								type="text"
								placeholder="Search discussions..."
								bind:value={searchQuery}
								class="search-input"
							/>
						</div>
						
						<select bind:value={sortBy} class="sort-select">
							<option value="recent">Most Recent</option>
							<option value="popular">Most Popular</option>
							<option value="replies">Most Replies</option>
						</select>
					</div>
				</div>

				<!-- Posts List -->
				<div class="posts-section">
					{#if filteredPosts.length > 0}
						<div class="posts-list">
							{#each filteredPosts as post}
								{@const categoryInfo = getCategoryInfo(post.category)}
								{@const subcategoryInfo = getSubcategoryInfo(post.category, post.subcategory)}
								
								<div class="post-card" class:sticky={post.isSticky}>
									{#if post.isSticky}
										<div class="sticky-badge">📌 Pinned</div>
									{/if}
									
									<div class="post-header">
										<div class="post-meta">
											<div class="category-tags">
												<span class="category-tag" style="background: {categoryInfo.color}20; color: {categoryInfo.color};">
													{categoryInfo.icon} {categoryInfo.name}
												</span>
												{#if subcategoryInfo}
													<span class="subcategory-tag" style="color: {subcategoryInfo.color};">
														{subcategoryInfo.name}
													</span>
												{/if}
											</div>
											<div class="post-timestamp">{formatTimeAgo(post.timestamp)}</div>
										</div>
									</div>
									
									<h3 class="post-title">{post.title}</h3>
									<p class="post-preview">{post.preview}</p>
									
									<div class="post-footer">
										<div class="post-author">
											<div class="author-avatar">{post.author.charAt(0)}</div>
											<span class="author-name">{post.author}</span>
										</div>
										
										<div class="post-stats">
											<button 
												class="stat-btn"
												on:click={() => likePost(post.id)}
												title="Like this post"
											>
												<i class="fas fa-heart"></i>
												<span>{post.likes}</span>
											</button>
											<div class="stat-item">
												<i class="fas fa-comments"></i>
												<span>{post.replies}</span>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-forum">
							<i class="fas fa-comments empty-icon"></i>
							<h3>No discussions found</h3>
							<p>
								{#if searchQuery}
									No posts match your search for "{searchQuery}".
								{:else if selectedCategory !== 'all'}
									No posts in this category yet. Be the first to start a discussion!
								{:else}
									No posts available. Start a new discussion!
								{/if}
							</p>
							<button class="btn btn-primary" on:click={openNewPost}>
								<i class="fas fa-plus"></i> Start Discussion
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>
</div>

<!-- New Post Modal -->
{#if showNewPostModal}
	<PostModal 
		categories={forumData.categories}
		selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
		onSave={createPost}
		onClose={closePostModal}
	/>
{/if}

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
	}

	/* Forum Stats */
	.forum-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		transition: transform 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
	}

	.stat-icon {
		font-size: 2.5rem;
	}

	.stat-value {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: #2DD4BF;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Forum Layout */
	.forum-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Categories Sidebar */
	.categories-sidebar {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		height: fit-content;
		position: sticky;
		top: 2rem;
	}

	.sidebar-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.1rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #2DD4BF;
	}

	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-btn {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: none;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
	}

	.category-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.category-btn.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
	}

	.category-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.category-info {
		flex: 1;
		min-width: 0;
	}

	.category-name {
		font-weight: 600;
		margin-bottom: 0.2rem;
	}

	.category-posts {
		font-size: 0.8rem;
		opacity: 0.8;
	}

	/* Forum Main */
	.forum-main {
		min-width: 0;
	}

	/* Forum Controls */
	.forum-controls {
		margin-bottom: 2rem;
	}

	.search-section {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.search-input-group {
		position: relative;
		flex: 1;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(255, 255, 255, 0.6);
	}

	.search-input {
		width: 100%;
		padding: 0.8rem 0.8rem 0.8rem 2.5rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.sort-select {
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	/* Posts Section */
	.posts-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.post-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		transition: all 0.3s ease;
		position: relative;
		color: white;
	}

	.post-card:hover {
		transform: translateY(-2px);
		border-color: rgba(45, 212, 191, 0.4);
		box-shadow: 0 8px 30px rgba(45, 212, 191, 0.15);
	}

	.post-card.sticky {
		border-color: rgba(245, 158, 11, 0.5);
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
	}

	.sticky-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.3rem 0.8rem;
		background: linear-gradient(135deg, #F59E0B, #D97706);
		color: white;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.post-header {
		margin-bottom: 1rem;
	}

	.post-meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.category-tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.category-tag {
		padding: 0.3rem 0.8rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.subcategory-tag {
		padding: 0.3rem 0.8rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 500;
	}

	.post-timestamp {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
	}

	.post-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 0.8rem;
		color: white;
		cursor: pointer;
		transition: color 0.3s ease;
	}

	.post-title:hover {
		color: #2DD4BF;
	}

	.post-preview {
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}

	.post-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.post-author {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.author-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: white;
		font-size: 0.8rem;
	}

	.author-name {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.post-stats {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.8rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.8rem;
	}

	.stat-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #EF4444;
		border-color: rgba(239, 68, 68, 0.4);
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8rem;
	}

	/* Empty State */
	.empty-forum {
		text-align: center;
		padding: 4rem 2rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.empty-forum h3 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: white;
	}

	.empty-forum p {
		margin-bottom: 2rem;
		line-height: 1.6;
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

		.forum-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.forum-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.categories-sidebar {
			order: 2;
			position: static;
		}

		.forum-main {
			order: 1;
		}

		.search-section {
			flex-direction: column;
			align-items: stretch;
		}

		.post-meta {
			flex-direction: column;
			align-items: flex-start;
		}

		.post-footer {
			flex-direction: column;
			align-items: flex-start;
		}

		.post-stats {
			align-self: flex-end;
		}
	}
</style>