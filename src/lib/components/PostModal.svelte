<script lang="ts">
	export let categories: any[];
	export let selectedCategory: string = '';
	export let onSave: (postData: any) => void;
	export let onClose: () => void;

	// Form data
	let formData = {
		title: '',
		content: '',
		category: selectedCategory,
		subcategory: '',
		tags: '',
		isQuestion: false,
		allowComments: true
	};

	// Available subcategories based on selected category
	$: availableSubcategories = formData.category 
		? categories.find(c => c.id === formData.category)?.subcategories || []
		: [];

	// Auto-select first subcategory when category changes
	$: if (formData.category && availableSubcategories.length > 0 && !formData.subcategory) {
		formData.subcategory = availableSubcategories[0].id;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!formData.title.trim()) {
			alert('⚠️ Please enter a post title.');
			return;
		}

		if (!formData.content.trim()) {
			alert('⚠️ Please enter post content.');
			return;
		}

		if (!formData.category) {
			alert('⚠️ Please select a category.');
			return;
		}

		const postData = {
			title: formData.title.trim(),
			content: formData.content.trim(),
			category: formData.category,
			subcategory: formData.subcategory,
			tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
			isQuestion: formData.isQuestion,
			allowComments: formData.allowComments,
			preview: formData.content.slice(0, 150) + (formData.content.length > 150 ? '...' : '')
		};

		onSave(postData);
	}

	function insertFormatting(type: string) {
		const textarea = document.querySelector('#content') as HTMLTextAreaElement;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;
		const selectedText = text.substring(start, end);

		let replacement = '';
		let cursorOffset = 0;

		switch (type) {
			case 'bold':
				replacement = `**${selectedText}**`;
				cursorOffset = selectedText ? 0 : 2;
				break;
			case 'italic':
				replacement = `*${selectedText}*`;
				cursorOffset = selectedText ? 0 : 1;
				break;
			case 'link':
				replacement = `[${selectedText || 'Link text'}](URL)`;
				cursorOffset = selectedText ? replacement.length - 4 : 1;
				break;
			case 'code':
				replacement = `\`${selectedText}\``;
				cursorOffset = selectedText ? 0 : 1;
				break;
			case 'quote':
				replacement = `> ${selectedText}`;
				cursorOffset = selectedText ? 0 : 2;
				break;
			case 'list':
				replacement = `- ${selectedText}`;
				cursorOffset = selectedText ? 0 : 2;
				break;
		}

		formData.content = text.substring(0, start) + replacement + text.substring(end);
		
		// Set cursor position
		setTimeout(() => {
			textarea.focus();
			const newPosition = start + replacement.length - cursorOffset;
			textarea.setSelectionRange(newPosition, newPosition);
		}, 0);
	}

	function addTemplate(template: string) {
		switch (template) {
			case 'deck-help':
				formData.content = `**Deck List:**
[Please paste your deck list here]

**What format are you playing?**
[Commander, Modern, Standard, etc.]

**What's your budget?**
[Budget constraints]

**What's your local meta like?**
[Describe what decks you commonly face]

**What specific help do you need?**
[Describe what you want to improve]`;
				break;
			case 'tournament-report':
				formData.content = `**Event:** [Tournament name and date]
**Format:** [Format played]
**Record:** [Your win/loss record]

**Deck List:**
[Please paste your deck list here]

**Round Breakdown:**
**Round 1:** [Opponent's deck] - [Result] - [Brief description]
**Round 2:** [Opponent's deck] - [Result] - [Brief description]
[Continue for each round]

**Key Takeaways:**
[What you learned, what worked well, what didn't]

**Changes for Next Time:**
[What you would change about your deck or play]`;
				break;
			case 'rules-question':
				formData.content = `**Scenario:**
[Describe the game situation clearly]

**Cards Involved:**
[List all relevant cards]

**What Happened:**
[Describe the sequence of events]

**Question:**
[What specific rule interaction are you asking about?]

**What I Think Should Happen:**
[Your understanding of how it should resolve]`;
				break;
		}
	}

	function getCategoryInfo(categoryId: string) {
		return categories.find(c => c.id === categoryId) || { name: 'Unknown', icon: '❓', color: '#6B7280' };
	}
</script>

<div class="modal-overlay" on:click={onClose}>
	<div class="modal" on:click|stopPropagation>
		<form class="post-form" on:submit={handleSubmit}>
			<div class="form-header">
				<h2 class="form-title">✏️ Create New Post</h2>
				<button type="button" class="close-btn" on:click={onClose}>
					<i class="fas fa-times"></i>
				</button>
			</div>

			<div class="form-content">
				<!-- Post Title -->
				<div class="form-group">
					<label for="title">Post Title</label>
					<input 
						type="text" 
						id="title" 
						bind:value={formData.title}
						placeholder="What do you want to discuss?"
						required
					/>
				</div>

				<!-- Category Selection -->
				<div class="form-row">
					<div class="form-group">
						<label for="category">Category</label>
						<select id="category" bind:value={formData.category} required>
							<option value="">Select a category...</option>
							{#each categories as category}
								<option value={category.id}>
									{category.icon} {category.name}
								</option>
							{/each}
						</select>
					</div>

					{#if availableSubcategories.length > 0}
						<div class="form-group">
							<label for="subcategory">Subcategory</label>
							<select id="subcategory" bind:value={formData.subcategory}>
								{#each availableSubcategories as subcategory}
									<option value={subcategory.id}>{subcategory.name}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<!-- Quick Templates -->
				{#if formData.category}
					<div class="templates-section">
						<label>Quick Templates</label>
						<div class="template-buttons">
							<button type="button" class="template-btn" on:click={() => addTemplate('deck-help')}>
								<i class="fas fa-list-alt"></i> Deck Help
							</button>
							<button type="button" class="template-btn" on:click={() => addTemplate('tournament-report')}>
								<i class="fas fa-trophy"></i> Tournament Report
							</button>
							<button type="button" class="template-btn" on:click={() => addTemplate('rules-question')}>
								<i class="fas fa-question-circle"></i> Rules Question
							</button>
						</div>
					</div>
				{/if}

				<!-- Content Editor -->
				<div class="form-group">
					<label for="content">Post Content</label>
					
					<!-- Formatting Toolbar -->
					<div class="formatting-toolbar">
						<button type="button" class="format-btn" on:click={() => insertFormatting('bold')} title="Bold">
							<i class="fas fa-bold"></i>
						</button>
						<button type="button" class="format-btn" on:click={() => insertFormatting('italic')} title="Italic">
							<i class="fas fa-italic"></i>
						</button>
						<button type="button" class="format-btn" on:click={() => insertFormatting('link')} title="Link">
							<i class="fas fa-link"></i>
						</button>
						<button type="button" class="format-btn" on:click={() => insertFormatting('code')} title="Code">
							<i class="fas fa-code"></i>
						</button>
						<button type="button" class="format-btn" on:click={() => insertFormatting('quote')} title="Quote">
							<i class="fas fa-quote-left"></i>
						</button>
						<button type="button" class="format-btn" on:click={() => insertFormatting('list')} title="List">
							<i class="fas fa-list-ul"></i>
						</button>
					</div>

					<textarea 
						id="content" 
						bind:value={formData.content}
						rows="12"
						placeholder="Share your thoughts, ask questions, or start a discussion..."
						required
					></textarea>
					
					<div class="editor-help">
						💡 Tip: Use **bold**, *italic*, `code`, > quotes, and - lists for formatting
					</div>
				</div>

				<!-- Tags -->
				<div class="form-group">
					<label for="tags">Tags (optional)</label>
					<input 
						type="text" 
						id="tags" 
						bind:value={formData.tags}
						placeholder="commander, budget, combo, control (separate with commas)"
					/>
					<div class="tags-help">
						Add relevant tags to help others find your post
					</div>
				</div>

				<!-- Post Options -->
				<div class="post-options">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={formData.isQuestion} />
						<span class="checkbox-text">🤔 Mark as question (others can mark answers as helpful)</span>
					</label>
					
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={formData.allowComments} />
						<span class="checkbox-text">💬 Allow comments and replies</span>
					</label>
				</div>
			</div>

			<div class="form-actions">
				<button type="button" class="btn btn-secondary" on:click={onClose}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary">
					<i class="fas fa-paper-plane"></i>
					Create Post
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
		backdrop-filter: blur(5px);
	}

	.modal {
		background: linear-gradient(135deg, #4C63D2 0%, #7C3AED 35%, #2DD4BF 70%);
		border-radius: 18px;
		width: 100%;
		max-width: 800px;
		max-height: 90vh;
		overflow-y: auto;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		color: white;
	}

	/* Form Header */
	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.form-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.8rem;
		font-weight: 700;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.5rem;
		transition: all 0.3s ease;
	}

	.close-btn:hover {
		color: white;
		transform: scale(1.1);
	}

	/* Form Content */
	.form-content {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 1rem;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #2DD4BF;
		box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
	}

	/* Templates Section */
	.templates-section {
		margin-bottom: 1.5rem;
	}

	.templates-section label {
		display: block;
		margin-bottom: 0.8rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.template-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.template-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.template-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border-color: rgba(45, 212, 191, 0.4);
	}

	/* Formatting Toolbar */
	.formatting-toolbar {
		display: flex;
		gap: 0.2rem;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.format-btn {
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		font-size: 0.85rem;
	}

	.format-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border-color: rgba(45, 212, 191, 0.4);
	}

	/* Editor Help */
	.editor-help,
	.tags-help {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
	}

	/* Post Options */
	.post-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		cursor: pointer;
		font-weight: 500;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.checkbox-text {
		color: rgba(255, 255, 255, 0.9);
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1rem 2rem 2rem 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.modal {
			max-width: 95vw;
			margin: 1rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.template-buttons {
			flex-direction: column;
		}

		.template-btn {
			justify-content: center;
		}

		.formatting-toolbar {
			flex-wrap: wrap;
		}

		.form-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.post-options {
			gap: 0.8rem;
		}
	}
</style>