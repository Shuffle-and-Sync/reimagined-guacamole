<script lang="ts">
	export let feature: {
		icon: string;
		title: string;
		description: string;
	};
</script>

<div class="feature-card">
	<div class="feature-icon">
		<i class={feature.icon}></i>
	</div>
	<h3 class="feature-title">{feature.title}</h3>
	<p class="feature-desc">{feature.description}</p>
</div>

<style>
	/* Styles are inherited from global app.css */
</style>