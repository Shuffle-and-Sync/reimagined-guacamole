<script lang="ts">
	export let category: any;
	export let isSelected: boolean = false;
	export let onSelect: () => void;

	let showSubcategories = isSelected;

	function toggleCategory() {
		onSelect();
		showSubcategories = !showSubcategories;
	}

	function selectSubcategory(subcategoryId: string) {
		// In a real app, this would filter to subcategory
		console.log('Selected subcategory:', subcategoryId);
	}

	// Toggle subcategories when category becomes selected
	$: if (isSelected && !showSubcategories) {
		showSubcategories = true;
	}
</script>

<div class="forum-category">
	<button 
		class="category-btn"
		class:active={isSelected}
		on:click={toggleCategory}
	>
		<div class="category-main">
			<div class="category-icon" style="color: {category.color};">{category.icon}</div>
			<div class="category-info">
				<div class="category-name">{category.name}</div>
				<div class="category-meta">
					<span class="post-count">{category.postCount} posts</span>
					<span class="member-count">{category.memberCount} members</span>
				</div>
			</div>
		</div>
		<div class="category-status">
			{#if category.isModerated}
				<span class="moderated-badge" title="Moderated category">🛡️</span>
			{/if}
			<i class="fas fa-chevron-down chevron" class:rotated={showSubcategories}></i>
		</div>
	</button>

	{#if showSubcategories && category.subcategories}
		<div class="subcategories" class:visible={showSubcategories}>
			{#each category.subcategories as subcategory}
				<button 
					class="subcategory-btn"
					on:click|stopPropagation={() => selectSubcategory(subcategory.id)}
					style="border-left-color: {subcategory.color};"
				>
					<div class="subcategory-info">
						<div class="subcategory-name">{subcategory.name}</div>
						<div class="subcategory-posts">{subcategory.posts} posts</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.forum-category {
		margin-bottom: 0.5rem;
	}

	.category-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
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
		transform: translateY(-1px);
	}

	.category-btn.active {
		background: linear-gradient(135deg, rgba(45, 212, 191, 0.2), rgba(16, 185, 129, 0.1));
		border: 1px solid rgba(45, 212, 191, 0.3);
		color: white;
	}

	.category-main {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.category-icon {
		font-size: 1.8rem;
		flex-shrink: 0;
		filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
	}

	.category-info {
		flex: 1;
		min-width: 0;
	}

	.category-name {
		font-weight: 700;
		margin-bottom: 0.3rem;
		font-size: 0.95rem;
		line-height: 1.2;
	}

	.category-meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.post-count,
	.member-count {
		font-size: 0.75rem;
		opacity: 0.8;
		line-height: 1;
	}

	.category-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.moderated-badge {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.chevron {
		font-size: 0.8rem;
		transition: transform 0.3s ease;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	/* Subcategories */
	.subcategories {
		margin-top: 0.5rem;
		margin-left: 1rem;
		padding-left: 1rem;
		border-left: 2px solid rgba(255, 255, 255, 0.1);
		max-height: 0;
		overflow: hidden;
		opacity: 0;
		transition: all 0.3s ease;
	}

	.subcategories.visible {
		max-height: 500px;
		opacity: 1;
	}

	.subcategory-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.8rem;
		margin-bottom: 0.3rem;
		border: none;
		border-left: 3px solid;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.03);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
	}

	.subcategory-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: white;
		transform: translateX(2px);
	}

	.subcategory-btn:last-child {
		margin-bottom: 0;
	}

	.subcategory-info {
		flex: 1;
	}

	.subcategory-name {
		font-weight: 600;
		font-size: 0.85rem;
		margin-bottom: 0.2rem;
		line-height: 1.2;
	}

	.subcategory-posts {
		font-size: 0.7rem;
		opacity: 0.7;
	}

	/* Hover effects for the entire category */
	.forum-category:hover .category-btn:not(.active) {
		background: rgba(255, 255, 255, 0.08);
	}

	/* Active state enhancements */
	.category-btn.active .category-icon {
		filter: drop-shadow(2px 2px 6px rgba(45, 212, 191, 0.4));
	}

	/* Animation for subcategory reveal */
	@keyframes slideDown {
		from {
			max-height: 0;
			opacity: 0;
		}
		to {
			max-height: 500px;
			opacity: 1;
		}
	}

	.subcategories.visible {
		animation: slideDown 0.3s ease-out;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.category-btn {
			padding: 0.8rem;
		}

		.category-icon {
			font-size: 1.5rem;
		}

		.category-name {
			font-size: 0.9rem;
		}

		.category-meta {
			flex-direction: row;
			gap: 0.5rem;
		}

		.post-count,
		.member-count {
			font-size: 0.7rem;
		}

		.subcategories {
			margin-left: 0.5rem;
			padding-left: 0.5rem;
		}

		.subcategory-btn {
			padding: 0.6rem;
		}

		.subcategory-name {
			font-size: 0.8rem;
		}
	}
</style>