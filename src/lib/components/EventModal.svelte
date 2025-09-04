<script lang="ts">
	export let event: any = null;
	export let isCreatingEvent: boolean = false;
	export let onSave: (eventData: any) => void;
	export let onClose: () => void;
	export let onJoin: (eventId: string) => void;

	// Form data
	let formData = {
		title: '',
		description: '',
		date: '',
		time: '',
		endDate: '',
		endTime: '',
		type: 'gaming',
		community: 'Magic: The Gathering',
		location: '',
		maxParticipants: 8,
		isRecurring: false,
		recurringPattern: 'weekly',
		streamLink: '',
		prizePool: ''
	};

	// Populate form when editing existing event
	$: if (event && !isCreatingEvent) {
		formData = {
			title: event.title || '',
			description: event.description || '',
			date: event.date ? event.date.toISOString().split('T')[0] : '',
			time: event.date ? event.date.toTimeString().substring(0, 5) : '',
			endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : '',
			endTime: event.endDate ? event.endDate.toTimeString().substring(0, 5) : '',
			type: event.type || 'gaming',
			community: event.community || 'Magic: The Gathering',
			location: event.location || '',
			maxParticipants: event.maxParticipants || 8,
			isRecurring: event.isRecurring || false,
			recurringPattern: event.recurringPattern || 'weekly',
			streamLink: event.streamLink || '',
			prizePool: event.prizePool || ''
		};
	}

	const eventTypes = [
		{ value: 'gaming', label: '🎮 Gaming Session', color: '#2DD4BF' },
		{ value: 'tournament', label: '🏆 Tournament', color: '#EF4444' },
		{ value: 'educational', label: '📚 Educational', color: '#F59E0B' },
		{ value: 'community', label: '👥 Community Event', color: '#7C3AED' }
	];

	const communities = [
		'Magic: The Gathering',
		'Pokemon TCG',
		'Yu-Gi-Oh!',
		'Disney Lorcana',
		'Flesh and Blood',
		'Multi-TCG'
	];

	const recurringPatterns = [
		{ value: 'daily', label: 'Daily' },
		{ value: 'weekly', label: 'Weekly' },
		{ value: 'biweekly', label: 'Every 2 weeks' },
		{ value: 'monthly', label: 'Monthly' }
	];

	function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!formData.title.trim()) {
			alert('⚠️ Please enter an event title.');
			return;
		}

		if (!formData.date || !formData.time) {
			alert('⚠️ Please select a date and time for the event.');
			return;
		}

		// Combine date and time
		const startDateTime = new Date(`${formData.date}T${formData.time}`);
		const endDateTime = formData.endDate && formData.endTime 
			? new Date(`${formData.endDate}T${formData.endTime}`)
			: new Date(startDateTime.getTime() + (3 * 60 * 60 * 1000)); // Default 3 hours later

		const eventData = {
			title: formData.title.trim(),
			description: formData.description.trim(),
			date: startDateTime,
			endDate: endDateTime,
			type: formData.type,
			community: formData.community,
			location: formData.location.trim(),
			maxParticipants: parseInt(formData.maxParticipants.toString()),
			isRecurring: formData.isRecurring,
			recurringPattern: formData.isRecurring ? formData.recurringPattern : null,
			streamLink: formData.streamLink.trim(),
			prizePool: formData.prizePool.trim()
		};

		onSave(eventData);
	}

	function handleJoin() {
		if (event && event.id) {
			onJoin(event.id);
		}
	}

	function getEventTypeColor(type: string): string {
		const eventType = eventTypes.find(t => t.value === type);
		return eventType ? eventType.color : '#6B7280';
	}

	function formatDateTime(date: Date): string {
		return date.toLocaleDateString([], { 
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="modal-overlay" on:click={onClose}>
	<div class="modal" on:click|stopPropagation>
		{#if isCreatingEvent || (event && event.organizer === 'You')}
			<!-- Create/Edit Event Form -->
			<form class="event-form" on:submit={handleSubmit}>
				<div class="form-header">
					<h2 class="form-title">
						{isCreatingEvent ? '📅 Create Event' : '✏️ Edit Event'}
					</h2>
					<button type="button" class="close-btn" on:click={onClose}>
						<i class="fas fa-times"></i>
					</button>
				</div>

				<div class="form-content">
					<!-- Basic Info -->
					<div class="form-section">
						<h3 class="section-title">📋 Basic Information</h3>
						
						<div class="form-row">
							<div class="form-group">
								<label for="title">Event Title</label>
								<input 
									type="text" 
									id="title" 
									bind:value={formData.title}
									placeholder="e.g., Weekly Commander Pod Night"
									required
								/>
							</div>
						</div>

						<div class="form-group">
							<label for="description">Description</label>
							<textarea 
								id="description" 
								bind:value={formData.description}
								rows="3"
								placeholder="Describe your event, format, rules, etc."
							></textarea>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="type">Event Type</label>
								<select id="type" bind:value={formData.type}>
									{#each eventTypes as eventType}
										<option value={eventType.value}>{eventType.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-group">
								<label for="community">Community</label>
								<select id="community" bind:value={formData.community}>
									{#each communities as community}
										<option value={community}>{community}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<!-- Date & Time -->
					<div class="form-section">
						<h3 class="section-title">🕐 Date & Time</h3>
						
						<div class="form-row">
							<div class="form-group">
								<label for="date">Start Date</label>
								<input 
									type="date" 
									id="date" 
									bind:value={formData.date}
									min={new Date().toISOString().split('T')[0]}
									required
								/>
							</div>

							<div class="form-group">
								<label for="time">Start Time</label>
								<input 
									type="time" 
									id="time" 
									bind:value={formData.time}
									required
								/>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="endDate">End Date</label>
								<input 
									type="date" 
									id="endDate" 
									bind:value={formData.endDate}
									min={formData.date || new Date().toISOString().split('T')[0]}
								/>
							</div>

							<div class="form-group">
								<label for="endTime">End Time</label>
								<input 
									type="time" 
									id="endTime" 
									bind:value={formData.endTime}
								/>
							</div>
						</div>

						<!-- Recurring Options -->
						<div class="form-group">
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									bind:checked={formData.isRecurring}
								/>
								<span class="checkbox-text">🔁 Recurring Event</span>
							</label>
						</div>

						{#if formData.isRecurring}
							<div class="form-group">
								<label for="recurringPattern">Recurring Pattern</label>
								<select id="recurringPattern" bind:value={formData.recurringPattern}>
									{#each recurringPatterns as pattern}
										<option value={pattern.value}>{pattern.label}</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<!-- Event Details -->
					<div class="form-section">
						<h3 class="section-title">🎯 Event Details</h3>
						
						<div class="form-row">
							<div class="form-group">
								<label for="location">Location/Platform</label>
								<input 
									type="text" 
									id="location" 
									bind:value={formData.location}
									placeholder="e.g., Discord Voice, Tabletop Simulator"
								/>
							</div>

							<div class="form-group">
								<label for="maxParticipants">Max Participants</label>
								<select id="maxParticipants" bind:value={formData.maxParticipants}>
									<option value={4}>4 Players</option>
									<option value={6}>6 Players</option>
									<option value={8}>8 Players</option>
									<option value={12}>12 Players</option>
									<option value={16}>16 Players</option>
									<option value={32}>32 Players</option>
									<option value={64}>64 Players</option>
									<option value={100}>100+ Participants</option>
								</select>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="streamLink">Stream Link (Optional)</label>
								<input 
									type="url" 
									id="streamLink" 
									bind:value={formData.streamLink}
									placeholder="https://twitch.tv/yourusername"
								/>
							</div>

							<div class="form-group">
								<label for="prizePool">Prize Pool (Optional)</label>
								<input 
									type="text" 
									id="prizePool" 
									bind:value={formData.prizePool}
									placeholder="e.g., $100 + Booster Packs"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="form-actions">
					<button type="button" class="btn btn-secondary" on:click={onClose}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						<i class="fas fa-save"></i>
						{isCreatingEvent ? 'Create Event' : 'Save Changes'}
					</button>
				</div>
			</form>
		{:else}
			<!-- View Event Details -->
			<div class="event-details">
				<div class="details-header">
					<div class="event-type-badge" style="background-color: {getEventTypeColor(event.type)}">
						{eventTypes.find(t => t.value === event.type)?.label || event.type}
					</div>
					<button type="button" class="close-btn" on:click={onClose}>
						<i class="fas fa-times"></i>
					</button>
				</div>

				<h2 class="event-title">{event.title}</h2>
				
				<div class="event-meta">
					<div class="meta-item">
						<i class="fas fa-calendar"></i>
						<span>{formatDateTime(event.date)}</span>
					</div>
					
					{#if event.endDate}
						<div class="meta-item">
							<i class="fas fa-clock"></i>
							<span>Ends {event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						</div>
					{/if}
					
					<div class="meta-item">
						<i class="fas fa-crown"></i>
						<span>Hosted by {event.organizer}</span>
					</div>
					
					<div class="meta-item">
						<i class="fas fa-users"></i>
						<span>{event.participants}/{event.maxParticipants} participants</span>
					</div>

					{#if event.location}
						<div class="meta-item">
							<i class="fas fa-map-marker-alt"></i>
							<span>{event.location}</span>
						</div>
					{/if}
				</div>

				{#if event.description}
					<div class="event-description">
						<h3>📝 Description</h3>
						<p>{event.description}</p>
					</div>
				{/if}

				{#if event.prizePool}
					<div class="event-prize">
						<h3>🏆 Prize Pool</h3>
						<p>{event.prizePool}</p>
					</div>
				{/if}

				{#if event.streamLink}
					<div class="event-stream">
						<h3>📺 Stream Link</h3>
						<a href={event.streamLink} target="_blank" rel="noopener noreferrer" class="stream-link">
							{event.streamLink}
						</a>
					</div>
				{/if}

				{#if event.isRecurring}
					<div class="recurring-info">
						<i class="fas fa-redo"></i>
						<span>Recurring {event.recurringPattern}</span>
					</div>
				{/if}

				<div class="event-actions">
					{#if event.participants < event.maxParticipants}
						<button class="btn btn-primary" on:click={handleJoin}>
							<i class="fas fa-plus"></i> Join Event
						</button>
					{:else}
						<button class="btn btn-secondary" disabled>
							<i class="fas fa-lock"></i> Event Full
						</button>
					{/if}
					
					<button class="btn btn-secondary">
						<i class="fas fa-share"></i> Share Event
					</button>
					
					{#if event.streamLink}
						<a href={event.streamLink} target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
							<i class="fas fa-eye"></i> Watch Stream
						</a>
					{/if}
				</div>
			</div>
		{/if}
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
		max-width: 700px;
		max-height: 90vh;
		overflow-y: auto;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		color: white;
	}

	/* Form Styles */
	.event-form {
		padding: 0;
	}

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

	.form-content {
		padding: 2rem;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #2DD4BF;
		border-bottom: 1px solid rgba(45, 212, 191, 0.3);
		padding-bottom: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
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

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1rem 2rem 2rem 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* Event Details Styles */
	.event-details {
		padding: 2rem;
	}

	.details-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.event-type-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 600;
		font-size: 0.9rem;
		color: white;
	}

	.event-title {
		font-family: 'Nunito', sans-serif;
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: white;
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.meta-item i {
		width: 20px;
		color: #2DD4BF;
	}

	.event-description,
	.event-prize,
	.event-stream {
		margin-bottom: 2rem;
	}

	.event-description h3,
	.event-prize h3,
	.event-stream h3 {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #2DD4BF;
	}

	.event-description p,
	.event-prize p {
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
	}

	.stream-link {
		color: #2DD4BF;
		text-decoration: none;
		font-weight: 500;
	}

	.stream-link:hover {
		text-decoration: underline;
	}

	.recurring-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 2rem;
		padding: 1rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
	}

	.event-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
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
			flex-direction: column;
		}

		.event-actions {
			flex-direction: column;
		}

		.form-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.details-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>