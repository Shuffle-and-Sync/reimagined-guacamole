<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import MessageThread from '$lib/components/MessageThread.svelte';
	import MessageComposer from '$lib/components/MessageComposer.svelte';

	// Mock message conversations data
	let conversations = [
		{
			id: '1',
			participantId: '2',
			participantName: 'MagicMike_Streams',
			participantAvatar: null,
			lastMessage: 'Sounds good! I\'ll bring my commander deck for the pod tonight.',
			lastMessageTime: new Date('2024-12-08T15:30:00'),
			unreadCount: 2,
			isOnline: true,
			community: 'Magic: The Gathering'
		},
		{
			id: '2',
			participantId: '3',
			participantName: 'PikachuPower_YT',
			participantAvatar: null,
			lastMessage: 'The tournament bracket looks amazing! Great work setting it up.',
			lastMessageTime: new Date('2024-12-08T14:15:00'),
			unreadCount: 0,
			isOnline: false,
			community: 'Pokemon TCG'
		},
		{
			id: '3',
			participantId: '4',
			participantName: 'DuelKing_2024',
			participantAvatar: null,
			lastMessage: 'Let me know when you want to practice some matches before the tournament.',
			lastMessageTime: new Date('2024-12-07T22:45:00'),
			unreadCount: 1,
			isOnline: true,
			community: 'Yu-Gi-Oh!'
		},
		{
			id: '4',
			participantId: '5',
			participantName: 'StreamLord_TCG',
			participantAvatar: null,
			lastMessage: 'Your deck tech video was incredible! Mind sharing that decklist?',
			lastMessageTime: new Date('2024-12-07T18:20:00'),
			unreadCount: 0,
			isOnline: false,
			community: 'Magic: The Gathering'
		}
	];

	// Mock message data for selected conversation
	let selectedConversation = null;
	let messages = [];
	let socket = null;

	// Mock messages for conversation 1
	const mockMessages = {
		'1': [
			{
				id: '1',
				senderId: '2',
				senderName: 'MagicMike_Streams',
				content: 'Hey! Are you still planning to join the Commander pod tonight?',
				timestamp: new Date('2024-12-08T15:00:00'),
				isRead: true
			},
			{
				id: '2',
				senderId: $user?.id || '1',
				senderName: $user?.username || 'You',
				content: 'Absolutely! I\'ve got my Atraxa deck ready. What power level are we aiming for?',
				timestamp: new Date('2024-12-08T15:05:00'),
				isRead: true
			},
			{
				id: '3',
				senderId: '2',
				senderName: 'MagicMike_Streams',
				content: 'Perfect! We\'re thinking 7-8 power level. I\'ve got my Kaalia deck, and the others are bringing similar power.',
				timestamp: new Date('2024-12-08T15:10:00'),
				isRead: true
			},
			{
				id: '4',
				senderId: '2',
				senderName: 'MagicMike_Streams',
				content: 'Sounds good! I\'ll bring my commander deck for the pod tonight.',
				timestamp: new Date('2024-12-08T15:30:00'),
				isRead: false
			}
		]
	};

	onMount(() => {
		authStore.checkAuth();
		// In real app: connect to WebSocket for real-time messages
	});

	onDestroy(() => {
		// In real app: disconnect WebSocket
		if (socket) {
			socket.close();
		}
	});

	function selectConversation(conversationId: string) {
		selectedConversation = conversations.find(c => c.id === conversationId);
		messages = mockMessages[conversationId] || [];
		
		// Mark conversation as read
		const conv = conversations.find(c => c.id === conversationId);
		if (conv) {
			conv.unreadCount = 0;
		}
	}

	function sendMessage(content: string) {
		if (!selectedConversation || !content.trim()) return;

		const newMessage = {
			id: Date.now().toString(),
			senderId: $user?.id || '1',
			senderName: $user?.username || 'You',
			content: content.trim(),
			timestamp: new Date(),
			isRead: true
		};

		// Add to messages
		messages = [...messages, newMessage];
		
		// Update conversation last message
		selectedConversation.lastMessage = content.trim();
		selectedConversation.lastMessageTime = new Date();
		
		// Move conversation to top
		conversations = [selectedConversation, ...conversations.filter(c => c.id !== selectedConversation.id)];

		// In real app: send via WebSocket to backend
		alert('📨 Message sent! Real WebSocket integration would deliver this instantly.');
	}

	function startNewConversation() {
		alert('➕ New conversation feature coming soon! Will show user picker from your TCG communities.');
	}

	function searchMessages() {
		alert('🔍 Message search feature coming soon! Search across all conversations.');
	}

	function formatTime(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = diff / (1000 * 60 * 60);
		
		if (hours < 1) return 'Just now';
		if (hours < 24) return `${Math.floor(hours)}h ago`;
		if (hours < 48) return 'Yesterday';
		return date.toLocaleDateString();
	}

	function getCommunityColor(community: string): string {
		switch (community) {
			case 'Magic: The Gathering': return '#FF6B35';
			case 'Pokemon TCG': return '#FFD23F';
			case 'Yu-Gi-Oh!': return '#7C3AED';
			case 'Disney Lorcana': return '#EC4899';
			default: return '#2DD4BF';
		}
	}
</script>

<svelte:head>
	<title>Messages - Shuffle & Sync</title>
	<meta name="description" content="Communicate with fellow TCG streamers and coordinate gaming sessions" />
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
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		<header class="page-header">
			<h1 class="hero-title">💬 Messages</h1>
			<p class="hero-subtitle">
				Connect and coordinate with fellow TCG streamers in real-time
			</p>
		</header>

		<div class="messages-container">
			<!-- Conversations Sidebar -->
			<div class="conversations-sidebar">
				<div class="sidebar-header">
					<div class="sidebar-title">
						<h2>Conversations</h2>
						<button class="btn btn-primary btn-sm" on:click={startNewConversation}>
							<i class="fas fa-plus"></i>
						</button>
					</div>
					<div class="sidebar-controls">
						<button class="btn btn-secondary btn-sm" on:click={searchMessages}>
							<i class="fas fa-search"></i>
						</button>
					</div>
				</div>

				<div class="conversations-list">
					{#each conversations as conversation}
						<div 
							class="conversation-item"
							class:active={selectedConversation?.id === conversation.id}
							on:click={() => selectConversation(conversation.id)}
							on:keydown={(e) => e.key === 'Enter' && selectConversation(conversation.id)}
							role="button"
							tabindex="0"
						>
							<div class="conversation-avatar">
								<div class="avatar-placeholder">
									{conversation.participantName.charAt(0)}
								</div>
								{#if conversation.isOnline}
									<div class="online-indicator"></div>
								{/if}
							</div>

							<div class="conversation-info">
								<div class="conversation-header">
									<div class="participant-name">{conversation.participantName}</div>
									<div class="message-time">{formatTime(conversation.lastMessageTime)}</div>
								</div>
								
								<div class="last-message">
									{conversation.lastMessage}
								</div>
								
								<div class="conversation-meta">
									<div 
										class="community-tag"
										style="background-color: {getCommunityColor(conversation.community)}20; color: {getCommunityColor(conversation.community)}"
									>
										{conversation.community}
									</div>
									{#if conversation.unreadCount > 0}
										<div class="unread-badge">{conversation.unreadCount}</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}

					{#if conversations.length === 0}
						<div class="empty-conversations">
							<p>No conversations yet</p>
							<button class="btn btn-primary" on:click={startNewConversation}>
								<i class="fas fa-plus"></i> Start Chatting
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Message Thread -->
			<div class="message-thread-container">
				{#if selectedConversation}
					<div class="thread-header">
						<div class="thread-participant">
							<div class="thread-avatar">
								{selectedConversation.participantName.charAt(0)}
								{#if selectedConversation.isOnline}
									<div class="online-indicator"></div>
								{/if}
							</div>
							<div class="thread-info">
								<h3 class="thread-name">{selectedConversation.participantName}</h3>
								<div class="thread-status">
									{#if selectedConversation.isOnline}
										<span class="status-online">🟢 Online</span>
									{:else}
										<span class="status-offline">⚫ Offline</span>
									{/if}
									<span class="community-info">{selectedConversation.community}</span>
								</div>
							</div>
						</div>
						
						<div class="thread-actions">
							<button class="btn btn-secondary btn-sm">
								<i class="fas fa-video"></i> Video Call
							</button>
							<button class="btn btn-secondary btn-sm">
								<i class="fas fa-gamepad"></i> Invite to Game
							</button>
						</div>
					</div>

					<MessageThread {messages} currentUserId={$user?.id || '1'} />
					<MessageComposer onSend={sendMessage} />
				{:else}
					<div class="no-conversation">
						<div class="no-conversation-content">
							<i class="fas fa-comments empty-icon"></i>
							<h3>Select a conversation</h3>
							<p>Choose a conversation from the sidebar to start chatting with fellow TCG streamers.</p>
							<button class="btn btn-primary" on:click={startNewConversation}>
								<i class="fas fa-plus"></i> Start New Conversation
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>

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

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	/* Messages Container */
	.messages-container {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 0;
		height: 600px;
		max-width: 1200px;
		margin: 0 auto;
		border-radius: 18px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	/* Conversations Sidebar */
	.conversations-sidebar {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		backdrop-filter: blur(15px);
		border-right: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
	}

	.sidebar-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.sidebar-title h2 {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0;
		color: white;
	}

	.sidebar-controls {
		display: flex;
		justify-content: center;
	}

	.conversations-list {
		flex: 1;
		overflow-y: auto;
	}

	.conversation-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.conversation-item:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.conversation-item.active {
		background: rgba(45, 212, 191, 0.2);
		border-left: 3px solid #2DD4BF;
	}

	.conversation-avatar {
		position: relative;
		flex-shrink: 0;
	}

	.avatar-placeholder {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
		color: white;
	}

	.online-indicator {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #10B981;
		border: 2px solid white;
	}

	.conversation-info {
		flex: 1;
		min-width: 0;
	}

	.conversation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.3rem;
	}

	.participant-name {
		font-weight: 600;
		color: white;
		font-size: 0.95rem;
	}

	.message-time {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.last-message {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.3;
		margin-bottom: 0.5rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.conversation-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.community-tag {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		font-weight: 500;
	}

	.unread-badge {
		background: #EF4444;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 600;
	}

	/* Message Thread Container */
	.message-thread-container {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
		backdrop-filter: blur(15px);
		display: flex;
		flex-direction: column;
	}

	.thread-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
	}

	.thread-participant {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.thread-avatar {
		position: relative;
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
		color: white;
	}

	.thread-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.thread-name {
		font-family: 'Nunito', sans-serif;
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: white;
	}

	.thread-status {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.8rem;
	}

	.status-online {
		color: #10B981;
	}

	.status-offline {
		color: #6B7280;
	}

	.community-info {
		color: rgba(255, 255, 255, 0.7);
	}

	.thread-actions {
		display: flex;
		gap: 1rem;
	}

	/* No Conversation State */
	.no-conversation {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.no-conversation-content {
		text-align: center;
		color: white;
	}

	.empty-icon {
		font-size: 4rem;
		color: rgba(255, 255, 255, 0.3);
		margin-bottom: 1rem;
	}

	.no-conversation-content h3 {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.no-conversation-content p {
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 2rem;
		max-width: 300px;
	}

	/* Empty Conversations */
	.empty-conversations {
		padding: 2rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.8);
	}

	.empty-conversations p {
		margin-bottom: 1rem;
	}

	/* Button Styles */
	.btn-sm {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
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

		.messages-container {
			grid-template-columns: 1fr;
			height: auto;
			min-height: 500px;
		}

		.conversations-sidebar {
			display: none;
		}

		.thread-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.thread-actions {
			flex-wrap: wrap;
		}
	}
</style>