<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let showPassword = false;
	
	async function handleLogin() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});
			
			const result = await response.json();
			
			if (response.ok) {
				// Successful login, redirect to dashboard
				goto('/dashboard');
			} else {
				error = result.message || 'Login failed';
			}
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
	
	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Login - Shuffle & Sync</title>
	<meta name="description" content="Login to your Shuffle & Sync account and connect with fellow TCG streamers" />
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<!-- Logo Header -->
		<div class="auth-header">
			<a href="/" class="logo">
				<span class="logo-text">Shuffle <span class="amp-symbol">&</span> Sync</span>
			</a>
			<h1 class="auth-title">Welcome Back, Duelist!</h1>
			<p class="auth-subtitle">Draw into your legendary streaming sessions</p>
		</div>
		
		<!-- Login Form -->
		<form class="auth-form" on:submit|preventDefault={handleLogin}>
			{#if error}
				<div class="error-message">
					<i class="fas fa-exclamation-triangle"></i>
					{error}
				</div>
			{/if}
			
			<div class="form-group">
				<label for="email" class="form-label">
					<i class="fas fa-envelope"></i>
					Email Address
				</label>
				<input
					type="email"
					id="email"
					class="form-input"
					placeholder="your.email@example.com"
					bind:value={email}
					required
				/>
			</div>
			
			<div class="form-group">
				<label for="password" class="form-label">
					<i class="fas fa-lock"></i>
					Password
				</label>
				<div class="password-input-container">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						class="form-input password-input"
						placeholder="Your secure password"
						bind:value={password}
						required
					/>
					<button
						type="button"
						class="password-toggle"
						on:click={togglePassword}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						<i class="fas {showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
					</button>
				</div>
			</div>
			
			<div class="form-actions">
				<button type="submit" class="btn-primary" class:loading disabled={loading}>
					{#if loading}
						<i class="fas fa-spinner fa-spin"></i>
						Casting Login Spell...
					{:else}
						<i class="fas fa-hand-sparkles"></i>
						Draw Your Hand
					{/if}
				</button>
			</div>
			
			<div class="form-links">
				<a href="/forgot-password" class="link">
					<i class="fas fa-key"></i>
					Forgot your password?
				</a>
			</div>
		</form>
		
		<!-- Registration Link -->
		<div class="auth-footer">
			<p class="auth-switch">
				New to the battlefield? 
				<a href="/register" class="link-primary">
					<i class="fas fa-user-plus"></i>
					Join the Guild
				</a>
			</p>
		</div>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		background: linear-gradient(135deg, 
			rgba(76, 99, 210, 0.1) 0%,
			rgba(124, 58, 237, 0.1) 25%,
			rgba(255, 107, 107, 0.1) 50%,
			rgba(45, 212, 191, 0.1) 75%,
			rgba(251, 191, 36, 0.1) 100%
		);
		background-attachment: fixed;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}
	
	.auth-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 20px;
		padding: 3rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		width: 100%;
		max-width: 450px;
		animation: slideIn 0.6s ease-out;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.logo {
		display: inline-block;
		text-decoration: none;
		margin-bottom: 1rem;
	}
	
	.logo-text {
		font-family: 'Nunito', sans-serif;
		font-weight: 800;
		font-size: 2rem;
		background: linear-gradient(135deg, #4C63D2, #7C3AED, #FF6B6B);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: none;
	}
	
	.amp-symbol {
		color: #2DD4BF;
		font-size: 2.2rem;
		margin: 0 0.3rem;
	}
	
	.auth-title {
		font-family: 'Nunito', sans-serif;
		font-weight: 700;
		font-size: 1.8rem;
		color: #2D3748;
		margin-bottom: 0.5rem;
	}
	
	.auth-subtitle {
		color: #718096;
		font-size: 1rem;
		font-weight: 500;
	}
	
	.auth-form {
		margin-bottom: 2rem;
	}
	
	.error-message {
		background: linear-gradient(135deg, #FEF2F2, #FEE2E2);
		border: 1px solid #FECACA;
		color: #DC2626;
		padding: 1rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.error-message i {
		color: #EF4444;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	.form-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: #4A5568;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}
	
	.form-input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #E2E8F0;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		color: #2D3748;
		background: #FAFAFA;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}
	
	.form-input:focus {
		outline: none;
		border-color: #4C63D2;
		background: #FFFFFF;
		box-shadow: 0 0 0 3px rgba(76, 99, 210, 0.1);
		transform: translateY(-1px);
	}
	
	.password-input-container {
		position: relative;
	}
	
	.password-input {
		padding-right: 3rem;
	}
	
	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #718096;
		cursor: pointer;
		font-size: 1rem;
		transition: color 0.3s ease;
		padding: 0.5rem;
	}
	
	.password-toggle:hover {
		color: #4C63D2;
	}
	
	.form-actions {
		margin-top: 2rem;
		margin-bottom: 1.5rem;
	}
	
	.btn-primary {
		width: 100%;
		background: linear-gradient(135deg, #4C63D2, #7C3AED);
		color: white;
		border: none;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		box-shadow: 0 4px 12px rgba(76, 99, 210, 0.3);
	}
	
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(76, 99, 210, 0.4);
	}
	
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	
	.btn-primary.loading {
		pointer-events: none;
	}
	
	.form-links {
		text-align: center;
	}
	
	.link {
		color: #4C63D2;
		text-decoration: none;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
	}
	
	.link:hover {
		color: #7C3AED;
		transform: translateY(-1px);
	}
	
	.auth-footer {
		text-align: center;
		padding-top: 1.5rem;
		border-top: 1px solid #E2E8F0;
	}
	
	.auth-switch {
		color: #718096;
		font-weight: 500;
		margin: 0;
	}
	
	.link-primary {
		color: #4C63D2;
		text-decoration: none;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
	}
	
	.link-primary:hover {
		color: #7C3AED;
		transform: translateY(-1px);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.auth-page {
			padding: 1rem;
		}
		
		.auth-container {
			padding: 2rem;
		}
		
		.logo-text {
			font-size: 1.75rem;
		}
		
		.amp-symbol {
			font-size: 1.95rem;
		}
		
		.auth-title {
			font-size: 1.5rem;
		}
	}
</style>