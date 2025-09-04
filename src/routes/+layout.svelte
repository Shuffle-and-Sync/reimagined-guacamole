<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	// Track page changes for analytics or other purposes
	$: if ($page.url) {
		// Can add page tracking here later
	}
</script>

<!-- Global layout for all pages -->
<main>
	<slot />
</main>

<style>
	main {
		position: relative;
		z-index: 10;
	}
</style>