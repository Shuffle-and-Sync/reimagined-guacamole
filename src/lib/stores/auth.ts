// Authentication store for SvelteKit app
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '../types';

// User authentication state
export const user = writable<User | null>(null);
export const isAuthenticated = writable<boolean>(false);
export const isLoading = writable<boolean>(true);

// Authentication functions
export const authStore = {
	// Check authentication status
	async checkAuth() {
		if (!browser) return;
		
		isLoading.set(true);
		try {
			const response = await fetch('/api/user', {
				credentials: 'include'
			});
			
			if (response.ok) {
				const userData = await response.json();
				user.set(userData);
				isAuthenticated.set(true);
			} else {
				user.set(null);
				isAuthenticated.set(false);
			}
		} catch (error) {
			console.error('Auth check failed:', error);
			user.set(null);
			isAuthenticated.set(false);
		} finally {
			isLoading.set(false);
		}
	},

	// Login (redirect to Express auth endpoint)
	login() {
		if (browser) {
			window.location.href = '/api/login';
		}
	},

	// Logout
	async logout() {
		if (!browser) return;
		
		try {
			await fetch('/api/logout', {
				method: 'POST',
				credentials: 'include'
			});
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			user.set(null);
			isAuthenticated.set(false);
		}
	}
};

// Initialize auth check when store is created
if (browser) {
	authStore.checkAuth();
}