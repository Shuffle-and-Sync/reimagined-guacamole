<script lang="ts">
	export let preferences: any;
	export let isEditing: boolean = false;

	const tcgGames = [
		'Magic: The Gathering',
		'Pokemon TCG',
		'Yu-Gi-Oh!',
		'Disney Lorcana',
		'Flesh and Blood',
		'Digimon TCG',
		'Dragon Ball Super TCG',
		'One Piece TCG'
	];

	const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'];
	const playStyles = ['Casual', 'Competitive', 'Competitive-Casual', 'Tryhard', 'Fun-focused'];
	const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const timeSlots = [
		'Morning (6-10 AM)',
		'Late Morning (10 AM-12 PM)',
		'Afternoon (12-4 PM)',
		'Evening (4-8 PM)',
		'Prime Time (6-10 PM)',
		'Night (10 PM+)',
		'Late Night (12 AM+)'
	];

	const mtgColors = ['White', 'Blue', 'Black', 'Red', 'Green'];
	const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean'];

	function toggleArrayItem(array: string[], item: string) {
		if (!isEditing) return;
		
		const index = array.indexOf(item);
		if (index > -1) {
			array.splice(index, 1);
		} else {
			array.push(item);
		}
		preferences = { ...preferences }; // Trigger reactivity
	}

	function getGameIcon(game: string): string {
		switch (game) {
			case 'Magic: The Gathering': return '🔮';
			case 'Pokemon TCG': return '⚡';
			case 'Yu-Gi-Oh!': return '⚔️';
			case 'Disney Lorcana': return '✨';
			case 'Flesh and Blood': return '🩸';
			default: return '🎮';
		}
	}

	function getColorIcon(color: string): string {
		switch (color) {
			case 'White': return '☀️';
			case 'Blue': return '💧';
			case 'Black': return '💀';
			case 'Red': return '🔥';
			case 'Green': return '🌱';
			default: return '🎨';
		}
	}
</script>

<div class="game-preferences">
	<div class="preferences-grid">
		<!-- Primary Game -->
		<div class="pref-card">
			<h3 class="card-title">🎮 Primary TCG Game</h3>
			{#if isEditing}
				<select bind:value={preferences.primaryGame} class="game-select">
					{#each tcgGames as game}
						<option value={game}>{getGameIcon(game)} {game}</option>
					{/each}
				</select>
			{:else}
				<div class="primary-game-display">
					<div class="game-icon">{getGameIcon(preferences.primaryGame)}</div>
					<div class="game-name">{preferences.primaryGame}</div>
				</div>
			{/if}
		</div>

		<!-- Skill & Play Style -->
		<div class="pref-card">
			<h3 class="card-title">🎯 Skill & Style</h3>
			<div class="skill-style-grid">
				<div class="field-group">
					<label>Skill Level</label>
					{#if isEditing}
						<select bind:value={preferences.skillLevel}>
							{#each skillLevels as level}
								<option value={level}>{level}</option>
							{/each}
						</select>
					{:else}
						<div class="display-value">{preferences.skillLevel}</div>
					{/if}
				</div>
				<div class="field-group">
					<label>Play Style</label>
					{#if isEditing}
						<select bind:value={preferences.playStyle}>
							{#each playStyles as style}
								<option value={style}>{style}</option>
							{/each}
						</select>
					{:else}
						<div class="display-value">{preferences.playStyle}</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Favorite Formats -->
		<div class="pref-card full-width">
			<h3 class="card-title">🏆 Favorite Formats</h3>
			<div class="formats-grid">
				{#each ['Commander', 'Modern', 'Standard', 'Draft', 'Sealed', 'Legacy', 'Pioneer', 'Vintage'] as format}
					<button
						class="format-chip"
						class:selected={preferences.favoriteFormats.includes(format)}
						class:disabled={!isEditing}
						on:click={() => toggleArrayItem(preferences.favoriteFormats, format)}
					>
						{format}
					</button>
				{/each}
			</div>
		</div>

		<!-- MTG Specific (if applicable) -->
		{#if preferences.primaryGame === 'Magic: The Gathering'}
			<div class="pref-card">
				<h3 class="card-title">🎨 Favorite Colors</h3>
				<div class="colors-grid">
					{#each mtgColors as color}
						<button
							class="color-chip"
							class:selected={preferences.favoriteColors.includes(color)}
							class:disabled={!isEditing}
							on:click={() => toggleArrayItem(preferences.favoriteColors, color)}
							style="--color-accent: {color.toLowerCase()}"
						>
							<span class="color-icon">{getColorIcon(color)}</span>
							<span class="color-name">{color}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="pref-card">
				<h3 class="card-title">⚡ Power Level</h3>
				{#if isEditing}
					<div class="power-level-selector">
						<input
							type="range"
							min="1"
							max="10"
							bind:value={preferences.preferredPowerLevel}
							class="power-slider"
						/>
						<div class="power-display">
							<span class="power-value">{preferences.preferredPowerLevel}</span>
							<span class="power-desc">
								{#if preferences.preferredPowerLevel <= 3}
									Casual/Precon
								{:else if preferences.preferredPowerLevel <= 6}
									Focused/Optimized
								{:else if preferences.preferredPowerLevel <= 8}
									High Power
								{:else}
									cEDH/Competitive
								{/if}
							</span>
						</div>
					</div>
				{:else}
					<div class="power-display-readonly">
						<div class="power-bar">
							<div class="power-fill" style="width: {preferences.preferredPowerLevel * 10}%"></div>
						</div>
						<div class="power-info">
							<span class="power-value">Level {preferences.preferredPowerLevel}</span>
							<span class="power-desc">
								{#if preferences.preferredPowerLevel <= 3}
									Casual/Precon
								{:else if preferences.preferredPowerLevel <= 6}
									Focused/Optimized
								{:else if preferences.preferredPowerLevel <= 8}
									High Power
								{:else}
									cEDH/Competitive
								{/if}
							</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Availability -->
		<div class="pref-card">
			<h3 class="card-title">📅 Available Days</h3>
			<div class="days-grid">
				{#each daysOfWeek as day}
					<button
						class="day-chip"
						class:selected={preferences.availableDays.includes(day)}
						class:disabled={!isEditing}
						on:click={() => toggleArrayItem(preferences.availableDays, day)}
					>
						{day.substring(0, 3)}
					</button>
				{/each}
			</div>
		</div>

		<div class="pref-card">
			<h3 class="card-title">🕐 Preferred Times</h3>
			<div class="times-grid">
				{#each timeSlots as timeSlot}
					<button
						class="time-chip"
						class:selected={preferences.preferredTimes.includes(timeSlot)}
						class:disabled={!isEditing}
						on:click={() => toggleArrayItem(preferences.preferredTimes, timeSlot)}
					>
						{timeSlot}
					</button>
				{/each}
			</div>
		</div>

		<!-- Languages -->
		<div class="pref-card full-width">
			<h3 class="card-title">🌍 Languages</h3>
			<div class="languages-grid">
				{#each languages as language}
					<button
						class="language-chip"
						class:selected={preferences.languages.includes(language)}
						class:disabled={!isEditing}
						on:click={() => toggleArrayItem(preferences.languages, language)}
					>
						{language}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.game-preferences {
		max-width: 1200px;
		margin: 0 auto;
	}

	.preferences-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.pref-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		border-radius: 14px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		color: white;
	}

	.pref-card.full-width {
		grid-column: 1 / -1;
	}

	.card-title {
		font-family: 'Nunito', sans-serif;
		font-size: 1.3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #2DD4BF;
	}

	/* Primary Game Display */
	.primary-game-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 12px;
		border-left: 4px solid #2DD4BF;
	}

	.game-icon {
		font-size: 3rem;
	}

	.game-name {
		font-size: 1.3rem;
		font-weight: 700;
		color: white;
	}

	.game-select {
		width: 100%;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	/* Skill & Style Grid */
	.skill-style-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-group label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.field-group select {
		padding: 0.8rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.display-value {
		padding: 0.8rem;
		background: rgba(45, 212, 191, 0.1);
		border-radius: 8px;
		border-left: 3px solid #2DD4BF;
		color: white;
		font-weight: 600;
	}

	/* Chip Grids */
	.formats-grid,
	.languages-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
	}

	.colors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 0.8rem;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.5rem;
	}

	.times-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* Chip Styles */
	.format-chip,
	.language-chip,
	.day-chip,
	.time-chip {
		padding: 0.6rem 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.color-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.color-icon {
		font-size: 1.5rem;
	}

	.color-name {
		font-size: 0.8rem;
	}

	.day-chip {
		padding: 0.8rem 0.5rem;
		text-align: center;
		font-size: 0.8rem;
	}

	.time-chip {
		font-size: 0.8rem;
	}

	/* Selected States */
	.format-chip.selected,
	.language-chip.selected,
	.day-chip.selected,
	.time-chip.selected,
	.color-chip.selected {
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		border-color: #2DD4BF;
		color: white;
		box-shadow: 0 2px 8px rgba(45, 212, 191, 0.3);
	}

	/* Hover States */
	.format-chip:not(.disabled):hover,
	.language-chip:not(.disabled):hover,
	.day-chip:not(.disabled):hover,
	.time-chip:not(.disabled):hover,
	.color-chip:not(.disabled):hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(45, 212, 191, 0.4);
		color: white;
		transform: translateY(-1px);
	}

	/* Disabled States */
	.format-chip.disabled,
	.language-chip.disabled,
	.day-chip.disabled,
	.time-chip.disabled,
	.color-chip.disabled {
		cursor: default;
	}

	/* Power Level Slider */
	.power-level-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.power-slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
		-webkit-appearance: none;
	}

	.power-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(45, 212, 191, 0.4);
	}

	.power-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.power-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2DD4BF;
	}

	.power-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		font-style: italic;
	}

	/* Read-only Power Display */
	.power-display-readonly {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.power-bar {
		width: 100%;
		height: 12px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		overflow: hidden;
	}

	.power-fill {
		height: 100%;
		background: linear-gradient(90deg, #10B981, #2DD4BF);
		border-radius: 6px;
		transition: width 0.3s ease;
	}

	.power-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.preferences-grid {
			grid-template-columns: 1fr;
		}

		.skill-style-grid {
			grid-template-columns: 1fr;
		}

		.colors-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.days-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.formats-grid,
		.languages-grid,
		.times-grid {
			justify-content: center;
		}

		.format-chip,
		.language-chip,
		.time-chip {
			flex: 1;
			min-width: 120px;
		}

		.day-chip {
			padding: 1rem 0.3rem;
		}
	}
</style>