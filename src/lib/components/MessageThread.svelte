<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';

	export let messages: any[];
	export let currentUserId: string;

	let messagesContainer: HTMLElement;

	onMount(() => {
		scrollToBottom();
	});

	afterUpdate(() => {
		scrollToBottom();
	});

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function formatMessageTime(timestamp: Date): string {
		return timestamp.toLocaleTimeString([], { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}

	function isConsecutiveMessage(index: number): boolean {
		if (index === 0) return false;
		const currentMessage = messages[index];
		const previousMessage = messages[index - 1];
		
		// Check if same sender and within 5 minutes
		const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime();
		return currentMessage.senderId === previousMessage.senderId && timeDiff < 300000; // 5 minutes
	}
</script>

<div class="message-thread" bind:this={messagesContainer}>
	<div class="messages-list">
		{#each messages as message, index}
			<div 
				class="message"
				class:own={message.senderId === currentUserId}
				class:consecutive={isConsecutiveMessage(index)}
			>
				{#if !isConsecutiveMessage(index)}
					<div class="message-header">
						<div class="message-avatar">
							{message.senderName.charAt(0)}
						</div>
						<div class="message-meta">
							<span class="sender-name">{message.senderName}</span>
							<span class="message-time">{formatMessageTime(message.timestamp)}</span>
						</div>
					</div>
				{/if}
				
				<div class="message-content">
					<div class="message-bubble" class:own={message.senderId === currentUserId}>
						{message.content}
					</div>
				</div>
			</div>
		{/each}

		{#if messages.length === 0}
			<div class="empty-messages">
				<i class="fas fa-comments empty-icon"></i>
				<p>No messages yet. Start the conversation!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.message-thread {
		flex: 1;
		overflow-y: auto;
		background: rgba(255, 255, 255, 0.02);
	}

	.messages-list {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 100%;
	}

	.message {
		display: flex;
		flex-direction: column;
		margin-bottom: 0.5rem;
	}

	.message.consecutive {
		margin-bottom: 0.2rem;
	}

	.message.own {
		align-items: flex-end;
	}

	.message-header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.message.own .message-header {
		flex-direction: row-reverse;
	}

	.message-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.8rem;
		color: white;
		flex-shrink: 0;
	}

	.message-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.message.own .message-meta {
		flex-direction: row-reverse;
	}

	.sender-name {
		font-weight: 600;
		color: white;
	}

	.message-time {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
	}

	.message-content {
		display: flex;
		max-width: 70%;
	}

	.message.own .message-content {
		justify-content: flex-end;
		margin-left: auto;
	}

	.message.consecutive .message-content {
		margin-left: 40px; /* Avatar width + gap */
	}

	.message.own.consecutive .message-content {
		margin-left: auto;
		margin-right: 40px;
	}

	.message-bubble {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		padding: 0.8rem 1rem;
		border-radius: 18px;
		border-bottom-left-radius: 4px;
		line-height: 1.4;
		word-wrap: break-word;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
	}

	.message-bubble.own {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		border-bottom-left-radius: 18px;
		border-bottom-right-radius: 4px;
		color: white;
		border: 1px solid rgba(45, 212, 191, 0.3);
	}

	.empty-messages {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: rgba(255, 255, 255, 0.6);
		padding: 3rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.empty-messages p {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Scrollbar styling */
	.message-thread::-webkit-scrollbar {
		width: 6px;
	}

	.message-thread::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
	}

	.message-thread::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 3px;
	}

	.message-thread::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.message-content {
			max-width: 85%;
		}

		.message.consecutive .message-content {
			margin-left: 35px;
		}

		.message.own.consecutive .message-content {
			margin-right: 35px;
		}

		.message-avatar {
			width: 28px;
			height: 28px;
			font-size: 0.7rem;
		}

		.message-bubble {
			padding: 0.7rem 0.9rem;
		}
	}
</style>