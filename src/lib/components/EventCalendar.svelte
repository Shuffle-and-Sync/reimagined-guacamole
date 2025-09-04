<script lang="ts">
	export let events: any[];
	export let selectedDate: Date;
	export let viewMode: string; // 'month', 'week', 'day'
	export let onSelectDate: (date: Date) => void;
	export let onViewEvent: (eventId: string) => void;

	// Calendar utilities
	function getMonthCalendar(date: Date) {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
		
		const calendar = [];
		let currentDate = new Date(startDate);
		
		// Generate 6 weeks (42 days) to fill the calendar
		for (let week = 0; week < 6; week++) {
			const weekDays = [];
			for (let day = 0; day < 7; day++) {
				weekDays.push({
					date: new Date(currentDate),
					isCurrentMonth: currentDate.getMonth() === month,
					isToday: currentDate.toDateString() === new Date().toDateString(),
					isSelected: currentDate.toDateString() === selectedDate.toDateString(),
					events: getEventsForDate(currentDate)
				});
				currentDate.setDate(currentDate.getDate() + 1);
			}
			calendar.push(weekDays);
		}
		
		return calendar;
	}

	function getWeekCalendar(date: Date) {
		const startOfWeek = new Date(date);
		startOfWeek.setDate(date.getDate() - date.getDay()); // Go to Sunday
		
		const week = [];
		for (let i = 0; i < 7; i++) {
			const dayDate = new Date(startOfWeek);
			dayDate.setDate(startOfWeek.getDate() + i);
			week.push({
				date: dayDate,
				isToday: dayDate.toDateString() === new Date().toDateString(),
				isSelected: dayDate.toDateString() === selectedDate.toDateString(),
				events: getEventsForDate(dayDate)
			});
		}
		
		return week;
	}

	function getEventsForDate(date: Date) {
		return events.filter(event => {
			const eventDate = new Date(event.date);
			return eventDate.toDateString() === date.toDateString();
		});
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

	function formatMonthYear(date: Date): string {
		return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
	}

	function formatWeekRange(startDate: Date): string {
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + 6);
		
		const startMonth = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
		const endMonth = endDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
		
		return `${startMonth} - ${endMonth}`;
	}

	function formatDayHeader(date: Date): string {
		return date.toLocaleDateString([], { 
			weekday: 'long', 
			month: 'long', 
			day: 'numeric', 
			year: 'numeric' 
		});
	}

	$: monthCalendar = getMonthCalendar(selectedDate);
	$: weekCalendar = getWeekCalendar(selectedDate);
	$: dayEvents = getEventsForDate(selectedDate);
</script>

<div class="calendar-wrapper">
	{#if viewMode === 'month'}
		<!-- Month View -->
		<div class="calendar-header">
			<h2 class="calendar-title">{formatMonthYear(selectedDate)}</h2>
		</div>
		
		<div class="month-calendar">
			<div class="weekdays">
				{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
					<div class="weekday">{day}</div>
				{/each}
			</div>
			
			<div class="calendar-grid">
				{#each monthCalendar as week}
					{#each week as dayCell}
						<div 
							class="calendar-day"
							class:other-month={!dayCell.isCurrentMonth}
							class:today={dayCell.isToday}
							class:selected={dayCell.isSelected}
							class:has-events={dayCell.events.length > 0}
							on:click={() => onSelectDate(dayCell.date)}
							on:keydown={(e) => e.key === 'Enter' && onSelectDate(dayCell.date)}
							role="button"
							tabindex="0"
						>
							<div class="day-number">{dayCell.date.getDate()}</div>
							{#if dayCell.events.length > 0}
								<div class="day-events">
									{#each dayCell.events.slice(0, 3) as event}
										<div 
											class="event-dot"
											style="background-color: {getEventTypeColor(event.type)}"
											title="{event.title} - {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"
											on:click|stopPropagation={() => onViewEvent(event.id)}
											on:keydown={(e) => e.key === 'Enter' && onViewEvent(event.id)}
											role="button"
											tabindex="0"
										></div>
									{/each}
									{#if dayCell.events.length > 3}
										<div class="more-events">+{dayCell.events.length - 3}</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				{/each}
			</div>
		</div>

	{:else if viewMode === 'week'}
		<!-- Week View -->
		<div class="calendar-header">
			<h2 class="calendar-title">{formatWeekRange(weekCalendar[0].date)}</h2>
		</div>
		
		<div class="week-calendar">
			<div class="week-header">
				{#each weekCalendar as dayCell}
					<div 
						class="week-day-header"
						class:today={dayCell.isToday}
						class:selected={dayCell.isSelected}
						on:click={() => onSelectDate(dayCell.date)}
						on:keydown={(e) => e.key === 'Enter' && onSelectDate(dayCell.date)}
						role="button"
						tabindex="0"
					>
						<div class="week-day-name">
							{dayCell.date.toLocaleDateString([], { weekday: 'short' })}
						</div>
						<div class="week-day-number">{dayCell.date.getDate()}</div>
					</div>
				{/each}
			</div>
			
			<div class="week-events">
				{#each weekCalendar as dayCell}
					<div class="week-day-column">
						{#each dayCell.events as event}
							<div 
								class="week-event"
								style="border-left-color: {getEventTypeColor(event.type)}"
								on:click={() => onViewEvent(event.id)}
								on:keydown={(e) => e.key === 'Enter' && onViewEvent(event.id)}
								role="button"
								tabindex="0"
							>
								<div class="week-event-time">
									{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								<div class="week-event-title">
									{getEventTypeIcon(event.type)} {event.title}
								</div>
								<div class="week-event-organizer">{event.organizer}</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

	{:else if viewMode === 'day'}
		<!-- Day View -->
		<div class="calendar-header">
			<h2 class="calendar-title">{formatDayHeader(selectedDate)}</h2>
		</div>
		
		<div class="day-calendar">
			{#if dayEvents.length > 0}
				<div class="day-events-list">
					{#each dayEvents.sort((a, b) => a.date.getTime() - b.date.getTime()) as event}
						<div 
							class="day-event"
							style="border-left-color: {getEventTypeColor(event.type)}"
							on:click={() => onViewEvent(event.id)}
							on:keydown={(e) => e.key === 'Enter' && onViewEvent(event.id)}
							role="button"
							tabindex="0"
						>
							<div class="day-event-header">
								<div class="day-event-time">
									<span class="event-icon" style="color: {getEventTypeColor(event.type)}">
										{getEventTypeIcon(event.type)}
									</span>
									{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
									{event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
								<div class="day-event-type" style="color: {getEventTypeColor(event.type)}">
									{event.type}
								</div>
							</div>
							<div class="day-event-title">{event.title}</div>
							<div class="day-event-details">
								<div class="day-event-organizer">Hosted by {event.organizer}</div>
								<div class="day-event-participants">
									{event.participants}/{event.maxParticipants} participants
								</div>
							</div>
							<div class="day-event-description">{event.description}</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-day">
					<i class="fas fa-calendar-day empty-icon"></i>
					<p>No events scheduled for this day</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.calendar-wrapper {
		color: white;
	}

	.calendar-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.calendar-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.8rem;
		font-weight: 700;
		color: white;
		margin: 0;
	}

	/* Month View */
	.month-calendar {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		overflow: hidden;
	}

	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: rgba(45, 212, 191, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.weekday {
		padding: 1rem;
		text-align: center;
		font-weight: 600;
		color: #2DD4BF;
		font-size: 0.9rem;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-auto-rows: 120px;
	}

	.calendar-day {
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.8rem;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		position: relative;
		min-height: 120px;
	}

	.calendar-day:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.calendar-day.other-month {
		opacity: 0.4;
	}

	.calendar-day.today {
		background: rgba(45, 212, 191, 0.15);
		border-color: rgba(45, 212, 191, 0.5);
	}

	.calendar-day.selected {
		background: rgba(124, 58, 237, 0.2);
		border-color: rgba(124, 58, 237, 0.6);
	}

	.calendar-day.has-events {
		background: rgba(255, 255, 255, 0.05);
	}

	.day-number {
		font-weight: 600;
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.day-events {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: auto;
	}

	.event-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.event-dot:hover {
		transform: scale(1.5);
		box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
	}

	.more-events {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	/* Week View */
	.week-calendar {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		overflow: hidden;
	}

	.week-header {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: rgba(45, 212, 191, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.week-day-header {
		padding: 1rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.week-day-header:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.week-day-header.today {
		background: rgba(45, 212, 191, 0.2);
	}

	.week-day-header.selected {
		background: rgba(124, 58, 237, 0.2);
	}

	.week-day-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: #2DD4BF;
		margin-bottom: 0.3rem;
	}

	.week-day-number {
		font-size: 1.2rem;
		font-weight: 700;
	}

	.week-events {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		min-height: 400px;
	}

	.week-day-column {
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.week-day-column:last-child {
		border-right: none;
	}

	.week-event {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		padding: 0.8rem;
		border-left: 3px solid;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.week-event:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
	}

	.week-event-time {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 0.3rem;
	}

	.week-event-title {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.3rem;
	}

	.week-event-organizer {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Day View */
	.day-calendar {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 2rem;
		min-height: 400px;
	}

	.day-events-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.day-event {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 1.5rem;
		border-left: 4px solid;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.day-event:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
	}

	.day-event-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.day-event-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: white;
	}

	.event-icon {
		font-size: 1.2rem;
	}

	.day-event-type {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.day-event-title {
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.day-event-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.day-event-organizer,
	.day-event-participants {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.day-event-description {
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
	}

	.empty-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.6);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		color: rgba(255, 255, 255, 0.3);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.calendar-grid {
			grid-auto-rows: 80px;
		}

		.calendar-day {
			padding: 0.5rem;
			min-height: 80px;
		}

		.day-number {
			font-size: 0.9rem;
		}

		.weekday {
			padding: 0.8rem;
			font-size: 0.8rem;
		}

		.week-events {
			min-height: 300px;
		}

		.week-day-column {
			padding: 0.8rem 0.3rem;
		}

		.week-event {
			padding: 0.6rem;
		}

		.day-event {
			padding: 1rem;
		}

		.day-event-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.day-event-details {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>