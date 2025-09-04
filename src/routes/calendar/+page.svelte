<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import EventCalendar from '$lib/components/EventCalendar.svelte';
	import EventModal from '$lib/components/EventModal.svelte';

	// Mock calendar events data
	let events = [
		{
			id: '1',
			title: 'Commander Pod Night',
			description: 'Weekly casual Commander games with deck tech discussion',
			date: new Date('2024-12-08T18:00:00'),
			endDate: new Date('2024-12-08T22:00:00'),
			type: 'gaming',
			community: 'Magic: The Gathering',
			organizer: 'MagicMike_Streams',
			participants: 8,
			maxParticipants: 12,
			isRecurring: true,
			recurringPattern: 'weekly',
			location: 'Virtual - Discord Voice',
			streamLink: 'twitch.tv/magicmike_streams'
		},
		{
			id: '2',
			title: 'Pokemon Draft Tournament',
			description: 'Monthly championship with prizes and live commentary',
			date: new Date('2024-12-15T15:00:00'),
			endDate: new Date('2024-12-15T21:00:00'),
			type: 'tournament',
			community: 'Pokemon TCG',
			organizer: 'PikachuPower_YT',
			participants: 24,
			maxParticipants: 32,
			isRecurring: true,
			recurringPattern: 'monthly',
			location: 'Online Tournament Platform',
			prizePool: '$200 + Booster Packs'
		},
		{
			id: '3',
			title: 'Yu-Gi-Oh! Deck Building Workshop',
			description: 'Learn to build competitive decks with pro tips',
			date: new Date('2024-12-10T20:00:00'),
			endDate: new Date('2024-12-10T22:00:00'),
			type: 'educational',
			community: 'Yu-Gi-Oh!',
			organizer: 'DuelKing_2024',
			participants: 15,
			maxParticipants: 20,
			isRecurring: false,
			location: 'YouTube Live',
			streamLink: 'youtube.com/@duelking2024'
		},
		{
			id: '4',
			title: 'TCG Community Meetup',
			description: 'Cross-community discussion and networking event',
			date: new Date('2024-12-20T19:00:00'),
			endDate: new Date('2024-12-20T21:00:00'),
			type: 'community',
			community: 'Multi-TCG',
			organizer: 'StreamLord_TCG',
			participants: 45,
			maxParticipants: 100,
			isRecurring: true,
			recurringPattern: 'monthly',
			location: 'Virtual - Main Hall'
		},
		{
			id: '5',
			title: 'Lorcana Sealed Draft',
			description: 'Disney Lorcana sealed draft with themed discussion',
			date: new Date('2024-12-12T17:00:00'),
			endDate: new Date('2024-12-12T20:00:00'),
			type: 'gaming',
			community: 'Disney Lorcana',
			organizer: 'DisneyCardMaster',
			participants: 6,
			maxParticipants: 8,
			isRecurring: false,
			location: 'Tabletop Simulator'
		}
	];

	let selectedDate = new Date();
	let viewMode = 'month'; // month, week, day
	let showEventModal = false;
	let selectedEvent = null;
	let isCreatingEvent = false;

	onMount(() => {
		authStore.checkAuth();
	});

	function selectDate(date: Date) {
		selectedDate = date;
	}

	function viewEvent(eventId: string) {
		selectedEvent = events.find(e => e.id === eventId);
		isCreatingEvent = false;
		showEventModal = true;
	}

	function createEvent() {
		selectedEvent = null;
		isCreatingEvent = true;
		showEventModal = true;
	}

	function closeModal() {
		showEventModal = false;
		selectedEvent = null;
		isCreatingEvent = false;
	}

	function joinEvent(eventId: string) {
		const event = events.find(e => e.id === eventId);
		if (event && event.participants < event.maxParticipants) {
			event.participants += 1;
			alert(`🎮 Joined "${event.title}"! You'll receive reminders and coordination updates.`);
		}
	}

	function saveEvent(eventData) {
		if (isCreatingEvent) {
			// Create new event
			const newEvent = {
				id: Date.now().toString(),
				...eventData,
				organizer: $user?.username || 'You',
				participants: 1
			};
			events = [...events, newEvent];
			alert(`📅 Event "${eventData.title}" created successfully!`);
		} else if (selectedEvent) {
			// Update existing event
			const index = events.findIndex(e => e.id === selectedEvent.id);
			if (index !== -1) {
				events[index] = { ...events[index], ...eventData };
				alert(`✏️ Event "${eventData.title}" updated successfully!`);
			}
		}
		closeModal();
	}

	function getEventsForDate(date: Date) {
		return events.filter(event => {
			const eventDate = new Date(event.date);
			return eventDate.toDateString() === date.toDateString();
		});
	}

	function getUpcomingEvents() {
		const now = new Date();
		return events
			.filter(event => event.date > now)
			.sort((a, b) => a.date.getTime() - b.date.getTime())
			.slice(0, 5);
	}

	function getEventTypeColor(type: string): string {
		switch (type) {
			case 'tournament': return '#EF4444';
			case 'gaming': return '#2DD4BF';
			case 'educational': return '#F59E0B';
			case 'community': return '#7C3AED';
			default: return '#6B7280';
		}
	}

	function getEventTypeIcon(type: string): string {
		switch (type) {
			case 'tournament': return '🏆';
			case 'gaming': return '🎮';
			case 'educational': return '📚';
			case 'community': return '👥';
			default: return '📅';
		}
	}

	$: upcomingEvents = getUpcomingEvents();
	$: todayEvents = getEventsForDate(new Date());
</script>

<svelte:head>
	<title>Calendar - Shuffle & Sync</title>
	<meta name="description" content="Schedule and coordinate TCG gaming events with your streaming community" />
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
				<a href="/profile" class="nav-link">Profile</a>
			</div>
		{/if}
	</nav>

	<main>
		<header class="page-header">
			<h1 class="hero-title">📅 Event Calendar</h1>
			<p class="hero-subtitle">
				Coordinate TCG gaming sessions, tournaments, and community events
			</p>
			
			<div class="header-actions">
				<button class="btn btn-primary" on:click={createEvent}>
					<i class="fas fa-plus"></i> Create Event
				</button>
			</div>
		</header>

		<div class="calendar-container">
			<!-- Calendar Sidebar -->
			<div class="calendar-sidebar">
				<!-- Today's Events -->
				<div class="sidebar-section">
					<h3 class="sidebar-title">📋 Today's Events</h3>
					{#if todayEvents.length > 0}
						<div class="today-events">
							{#each todayEvents as event}
								<div class="event-card mini" on:click={() => viewEvent(event.id)}>
									<div class="event-header">
										<span class="event-icon" style="color: {getEventTypeColor(event.type)}">
											{getEventTypeIcon(event.type)}
										</span>
										<div class="event-time">
											{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</div>
									</div>
									<div class="event-title">{event.title}</div>
									<div class="event-organizer">{event.organizer}</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-section">
							<p>No events today</p>
						</div>
					{/if}
				</div>

				<!-- Upcoming Events -->
				<div class="sidebar-section">
					<h3 class="sidebar-title">⏰ Upcoming Events</h3>
					{#if upcomingEvents.length > 0}
						<div class="upcoming-events">
							{#each upcomingEvents as event}
								<div class="event-card mini" on:click={() => viewEvent(event.id)}>
									<div class="event-header">
										<span class="event-icon" style="color: {getEventTypeColor(event.type)}">
											{getEventTypeIcon(event.type)}
										</span>
										<div class="event-date">
											{event.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
										</div>
									</div>
									<div class="event-title">{event.title}</div>
									<div class="event-meta">
										<span class="event-community">{event.community}</span>
										<span class="event-participants">{event.participants}/{event.maxParticipants}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-section">
							<p>No upcoming events</p>
						</div>
					{/if}
				</div>

				<!-- Quick Stats -->
				<div class="sidebar-section">
					<h3 class="sidebar-title">📊 Quick Stats</h3>
					<div class="quick-stats">
						<div class="stat-item">
							<div class="stat-value">{events.length}</div>
							<div class="stat-label">Total Events</div>
						</div>
						<div class="stat-item">
							<div class="stat-value">{events.filter(e => e.organizer === ($user?.username || 'You')).length}</div>
							<div class="stat-label">Your Events</div>
						</div>
						<div class="stat-item">
							<div class="stat-value">{upcomingEvents.length}</div>
							<div class="stat-label">This Week</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Calendar -->
			<div class="calendar-main">
				<div class="calendar-controls">
					<div class="view-controls">
						<button 
							class="view-btn"
							class:active={viewMode === 'month'}
							on:click={() => viewMode = 'month'}
						>
							Month
						</button>
						<button 
							class="view-btn"
							class:active={viewMode === 'week'}
							on:click={() => viewMode = 'week'}
						>
							Week
						</button>
						<button 
							class="view-btn"
							class:active={viewMode === 'day'}
							on:click={() => viewMode = 'day'}
						>
							Day
						</button>
					</div>

					<div class="date-controls">
						<button class="btn btn-secondary btn-sm">
							<i class="fas fa-chevron-left"></i>
						</button>
						<button class="btn btn-secondary btn-sm" on:click={() => selectedDate = new Date()}>
							Today
						</button>
						<button class="btn btn-secondary btn-sm">
							<i class="fas fa-chevron-right"></i>
						</button>
					</div>
				</div>

				<EventCalendar 
					{events} 
					{selectedDate}
					{viewMode}
					onSelectDate={selectDate}
					onViewEvent={viewEvent}
				/>
			</div>
		</div>
	</main>
</div>

<!-- Event Modal -->
{#if showEventModal}
	<EventModal 
		event={selectedEvent}
		{isCreatingEvent}
		onSave={saveEvent}
		onClose={closeModal}
		onJoin={joinEvent}
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

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.header-actions {
		margin-top: 2rem;
	}

	/* Calendar Container */
	.calendar-container {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Calendar Sidebar */
	.calendar-sidebar {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.sidebar-section {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.sidebar-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #2DD4BF;
	}

	.event-card.mini {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		padding: 1rem;
		margin-bottom: 0.8rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.event-card.mini:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
	}

	.event-card.mini:last-child {
		margin-bottom: 0;
	}

	.event-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.event-icon {
		font-size: 1.2rem;
	}

	.event-time,
	.event-date {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 600;
	}

	.event-title {
		font-weight: 600;
		color: white;
		margin-bottom: 0.3rem;
		font-size: 0.9rem;
	}

	.event-organizer {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.event-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8rem;
	}

	.event-community {
		color: rgba(255, 255, 255, 0.7);
	}

	.event-participants {
		color: #2DD4BF;
		font-weight: 600;
	}

	.empty-section {
		text-align: center;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
	}

	.quick-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.stat-item {
		text-align: center;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		padding: 1rem;
	}

	.stat-value {
		font-family: 'Nunito', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: #2DD4BF;
	}

	.stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 0.3rem;
	}

	/* Calendar Main */
	.calendar-main {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.calendar-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.view-controls {
		display: flex;
		gap: 0.5rem;
	}

	.view-btn {
		padding: 0.6rem 1.2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.view-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.view-btn.active {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		border-color: #2DD4BF;
	}

	.date-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-sm {
		padding: 0.6rem 1rem;
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

		.calendar-container {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.calendar-sidebar {
			order: 2;
		}

		.calendar-main {
			order: 1;
		}

		.calendar-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.view-controls {
			justify-content: center;
		}

		.date-controls {
			justify-content: center;
		}

		.quick-stats {
			grid-template-columns: 1fr;
		}
	}
</style>