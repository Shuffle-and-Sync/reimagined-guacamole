<script lang="ts">
	import { goto } from '$app/navigation';
	
	let email = '';
	let password = '';
	let confirmPassword = '';
	let username = '';
	let firstName = '';
	let lastName = '';
	let acceptTerms = false;
	let loading = false;
	let error = '';
	let showPassword = false;
	let showConfirmPassword = false;
	
	// Form validation state
	let validationErrors: Record<string, string> = {};
	
	function validateForm() {
		validationErrors = {};
		
		if (!email) validationErrors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			validationErrors.email = 'Please enter a valid email';
		}
		
		if (!username) validationErrors.username = 'Username is required';
		else if (username.length < 3) {
			validationErrors.username = 'Username must be at least 3 characters';
		}
		
		if (!password) validationErrors.password = 'Password is required';
		else if (password.length < 8) {
			validationErrors.password = 'Password must be at least 8 characters';
		}
		
		if (!confirmPassword) validationErrors.confirmPassword = 'Please confirm your password';
		else if (password !== confirmPassword) {
			validationErrors.confirmPassword = 'Passwords do not match';
		}
		
		if (!firstName) validationErrors.firstName = 'First name is required';
		if (!lastName) validationErrors.lastName = 'Last name is required';
		
		if (!acceptTerms) validationErrors.terms = 'You must accept the terms and conditions';
		
		return Object.keys(validationErrors).length === 0;
	}
	
	async function handleRegister() {
		if (!validateForm()) {
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					password,
					username,
					firstName,
					lastName
				}),
			});
			
			const result = await response.json();
			
			if (response.ok) {
				// Successful registration, redirect to login or verification page
				goto('/login?message=registration-success');
			} else {
				error = result.message || 'Registration failed';
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
	
	function toggleConfirmPassword() {
		showConfirmPassword = !showConfirmPassword;
	}
</script>

<svelte:head>
	<title>Join the Guild - Shuffle & Sync</title>
	<meta name="description" content="Create your Shuffle & Sync account and join the TCG streaming community" />
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<!-- Logo Header -->
		<div class="auth-header">
			<a href="/" class="logo">
				<span class="logo-text">Shuffle <span class="amp-symbol">&</span> Sync</span>
			</a>
			<h1 class="auth-title">Join the Guild!</h1>
			<p class="auth-subtitle">Build your legend in the TCG streaming realm</p>
		</div>
		
		<!-- Registration Form -->
		<form class="auth-form" on:submit|preventDefault={handleRegister}>
			{#if error}
				<div class="error-message">
					<i class="fas fa-exclamation-triangle"></i>
					{error}
				</div>
			{/if}
			
			<!-- Name Fields -->
			<div class="form-row">
				<div class="form-group">
					<label for="firstName" class="form-label">
						<i class="fas fa-user"></i>
						First Name
					</label>
					<input
						type="text"
						id="firstName"
						class="form-input"
						class:error={validationErrors.firstName}
						placeholder="Your first name"
						bind:value={firstName}
						required
					/>
					{#if validationErrors.firstName}
						<span class="field-error">{validationErrors.firstName}</span>
					{/if}
				</div>
				
				<div class="form-group">
					<label for="lastName" class="form-label">
						<i class="fas fa-user"></i>
						Last Name
					</label>
					<input
						type="text"
						id="lastName"
						class="form-input"
						class:error={validationErrors.lastName}
						placeholder="Your last name"
						bind:value={lastName}
						required
					/>
					{#if validationErrors.lastName}
						<span class="field-error">{validationErrors.lastName}</span>
					{/if}
				</div>
			</div>
			
			<!-- Username Field -->
			<div class="form-group">
				<label for="username" class="form-label">
					<i class="fas fa-at"></i>
					Username
				</label>
				<input
					type="text"
					id="username"
					class="form-input"
					class:error={validationErrors.username}
					placeholder="Your unique streamer handle"
					bind:value={username}
					required
				/>
				{#if validationErrors.username}
					<span class="field-error">{validationErrors.username}</span>
				{/if}
			</div>
			
			<!-- Email Field -->
			<div class="form-group">
				<label for="email" class="form-label">
					<i class="fas fa-envelope"></i>
					Email Address
				</label>
				<input
					type="email"
					id="email"
					class="form-input"
					class:error={validationErrors.email}
					placeholder="your.email@example.com"
					bind:value={email}
					required
				/>
				{#if validationErrors.email}
					<span class="field-error">{validationErrors.email}</span>
				{/if}
			</div>
			
			<!-- Password Fields -->
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
						class:error={validationErrors.password}
						placeholder="Create a strong password"
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
				{#if validationErrors.password}
					<span class="field-error">{validationErrors.password}</span>
				{/if}
			</div>
			
			<div class="form-group">
				<label for="confirmPassword" class="form-label">
					<i class="fas fa-lock"></i>
					Confirm Password
				</label>
				<div class="password-input-container">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						class="form-input password-input"
						class:error={validationErrors.confirmPassword}
						placeholder="Confirm your password"
						bind:value={confirmPassword}
						required
					/>
					<button
						type="button"
						class="password-toggle"
						on:click={toggleConfirmPassword}
						aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
					>
						<i class="fas {showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
					</button>
				</div>
				{#if validationErrors.confirmPassword}
					<span class="field-error">{validationErrors.confirmPassword}</span>
				{/if}
			</div>
			
			<!-- Terms and Conditions -->
			<div class="form-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						class="checkbox-input"
						bind:checked={acceptTerms}
						required
					/>
					<div class="checkbox-custom"></div>
					<span class="checkbox-text">
						I agree to the <a href="/terms" class="link" target="_blank">Terms of Service</a>
						and <a href="/privacy" class="link" target="_blank">Privacy Policy</a>
					</span>
				</label>
				{#if validationErrors.terms}
					<span class="field-error">{validationErrors.terms}</span>
				{/if}
			</div>
			
			<!-- Submit Button -->
			<div class="form-actions">
				<button type="submit" class="btn-primary" class:loading disabled={loading}>
					{#if loading}
						<i class="fas fa-spinner fa-spin"></i>
						Forging your legend...
					{:else}
						<i class="fas fa-user-plus"></i>
						Join the Guild
					{/if}
				</button>
			</div>
		</form>
		
		<!-- Login Link -->
		<div class="auth-footer">
			<p class="auth-switch">
				Already have an account? 
				<a href="/login" class="link-primary">
					<i class="fas fa-sign-in-alt"></i>
					Sign In
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
		max-width: 500px;
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
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
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
	
	.form-input.error {
		border-color: #DC2626;
		background: #FEF2F2;
	}
	
	.field-error {
		display: block;
		color: #DC2626;
		font-size: 0.875rem;
		font-weight: 500;
		margin-top: 0.5rem;
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
	
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		line-height: 1.5;
	}
	
	.checkbox-input {
		display: none;
	}
	
	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid #E2E8F0;
		border-radius: 4px;
		background: #FAFAFA;
		transition: all 0.3s ease;
		flex-shrink: 0;
		margin-top: 2px;
		position: relative;
	}
	
	.checkbox-input:checked + .checkbox-custom {
		background: #4C63D2;
		border-color: #4C63D2;
	}
	
	.checkbox-input:checked + .checkbox-custom::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 12px;
		font-weight: bold;
	}
	
	.checkbox-text {
		color: #4A5568;
		font-size: 0.9rem;
	}
	
	.form-actions {
		margin-top: 2rem;
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
	
	.link {
		color: #4C63D2;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
	}
	
	.link:hover {
		color: #7C3AED;
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
		
		.form-row {
			grid-template-columns: 1fr;
			gap: 0;
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