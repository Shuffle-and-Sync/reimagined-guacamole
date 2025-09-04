<script lang="ts">
	export let community: {
		id: string;
		icon: string;
		name: string;
		game: string;
	};

	function handleCommunityClick() {
		// Show community-specific alert with TCG theming
		alert(`${community.icon} ${community.name} community! ${community.game} awaits.`);
	}
</script>

<div 
	class="community-card" 
	on:click={handleCommunityClick}
	on:keydown={(e) => e.key === 'Enter' && handleCommunityClick()}
	role="button"
	tabindex="0"
>
	<div class="community-icon">{community.icon}</div>
	<div class="community-name">{community.name}</div>
	<div class="community-game">{community.game}</div>
</div>

<style>
	/* Styles are inherited from global app.css */
</style>