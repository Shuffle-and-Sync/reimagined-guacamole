<script lang="ts">
	export let onSend: (content: string) => void;

	let messageContent = '';
	let isTyping = false;

	function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!messageContent.trim()) return;
		
		onSend(messageContent);
		messageContent = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(event);
		}
	}

	function handleTyping() {
		isTyping = true;
		// In real app: send typing indicator via WebSocket
		
		// Clear typing indicator after inactivity
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			isTyping = false;
		}, 3000);
	}

	let typingTimeout: number;

	function addEmoji(emoji: string) {
		messageContent += emoji;
	}

	function addAttachment() {
		alert('📎 File attachment feature coming soon! Supports images, documents, and deck lists.');
	}

	// Common gaming emojis for TCG
	const quickEmojis = ['🎮', '🃏', '⚔️', '🏆', '🔥', '💯', '👍', '❤️', '😄', '🎯'];
</script>

<div class="message-composer">
	<form class="composer-form" on:submit={handleSubmit}>
		<!-- Quick Emojis -->
		<div class="quick-actions">
			<div class="emoji-picker">
				{#each quickEmojis as emoji}
					<button 
						type="button"
						class="emoji-btn"
						on:click={() => addEmoji(emoji)}
						title="Add {emoji}"
					>
						{emoji}
					</button>
				{/each}
			</div>
			
			<button 
				type="button"
				class="attachment-btn"
				on:click={addAttachment}
				title="Add attachment"
			>
				<i class="fas fa-paperclip"></i>
			</button>
		</div>

		<div class="input-container">
			<textarea
				class="message-input"
				bind:value={messageContent}
				on:keydown={handleKeydown}
				on:input={handleTyping}
				placeholder="Type your message... Press Enter to send, Shift+Enter for new line"
				rows="1"
			></textarea>
			
			<button 
				type="submit"
				class="send-btn"
				disabled={!messageContent.trim()}
				title="Send message"
			>
				<i class="fas fa-paper-plane"></i>
			</button>
		</div>

		{#if isTyping}
			<div class="typing-indicator">
				<span class="typing-text">✍️ Typing...</span>
			</div>
		{/if}
	</form>
</div>

<style>
	.message-composer {
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(15px);
	}

	.composer-form {
		padding: 1rem;
	}

	.quick-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.8rem;
		flex-wrap: wrap;
	}

	.emoji-picker {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}

	.emoji-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		padding: 0.4rem 0.6rem;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.emoji-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(1.1);
	}

	.attachment-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		padding: 0.4rem 0.6rem;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.attachment-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.input-container {
		display: flex;
		align-items: flex-end;
		gap: 0.8rem;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 0.8rem;
		backdrop-filter: blur(15px);
	}

	.message-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: white;
		font-size: 1rem;
		line-height: 1.4;
		resize: none;
		min-height: 20px;
		max-height: 120px;
		overflow-y: auto;
		font-family: inherit;
	}

	.message-input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.send-btn {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		border: none;
		border-radius: 8px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		flex-shrink: 0;
	}

	.send-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #10B981, #059669);
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(45, 212, 191, 0.4);
	}

	.send-btn:disabled {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.4);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.typing-indicator {
		margin-top: 0.5rem;
		text-align: left;
	}

	.typing-text {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		font-style: italic;
	}

	/* Auto-resize textarea */
	.message-input {
		field-sizing: content;
	}

	/* Scrollbar for textarea */
	.message-input::-webkit-scrollbar {
		width: 4px;
	}

	.message-input::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
	}

	.message-input::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.quick-actions {
			justify-content: center;
		}

		.emoji-picker {
			justify-content: center;
		}

		.emoji-btn {
			padding: 0.3rem 0.5rem;
			font-size: 0.9rem;
		}

		.input-container {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.send-btn {
			width: 100%;
			height: 45px;
			border-radius: 8px;
		}

		.message-input {
			min-height: 40px;
		}
	}
</style>