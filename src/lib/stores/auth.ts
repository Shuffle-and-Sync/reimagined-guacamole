// Authentication store for SvelteKit app
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '../types';

export interface AuthUser extends User {
        communities?: any[];
        authType?: 'custom' | 'replit';
}

// User authentication state
export const user = writable<AuthUser | null>(null);
export const isAuthenticated = writable<boolean>(false);
export const isLoading = writable<boolean>(true);

// Authentication functions
export const authStore = {
        // Check authentication status
        async checkAuth() {
                if (!browser) return;
                
                isLoading.set(true);
                try {
                        const response = await fetch('/api/auth/user', {
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

        // Login (redirect to SvelteKit login page)
        login() {
                if (browser) {
                        window.location.href = '/login';
                }
        },

        // Register (redirect to SvelteKit register page)
        register() {
                if (browser) {
                        window.location.href = '/register';
                }
        },

        // Logout
        async logout() {
                if (!browser) return;
                
                try {
                        const response = await fetch('/api/auth/logout', {
                                method: 'POST',
                                credentials: 'include'
                        });
                        
                        if (response.ok) {
                                user.set(null);
                                isAuthenticated.set(false);
                                window.location.href = '/';
                        }
                } catch (error) {
                        console.error('Logout failed:', error);
                        // Force logout locally and redirect anyway
                        user.set(null);
                        isAuthenticated.set(false);
                        window.location.href = '/';
                }
        }
};

// Initialize auth check when store is created
if (browser) {
        authStore.checkAuth();
}