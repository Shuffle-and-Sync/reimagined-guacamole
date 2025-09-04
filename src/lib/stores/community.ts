// Community selection and theming store
import { writable } from 'svelte/store';
import type { Community } from '../types';

// Selected community state
export const selectedCommunity = writable<Community | null>(null);

// Available communities
export const communities = writable<Community[]>([
	{
		id: 'scry-gather',
		name: 'Scry & Gather',
		displayName: 'Magic: The Gathering',
		themeColor: '#FF6B35',
		iconClass: 'fas fa-fire',
		isActive: true,
		createdAt: new Date()
	},
	{
		id: 'pokestream-hub',
		name: 'PokeStream Hub', 
		displayName: 'Pokemon TCG',
		themeColor: '#FFD23F',
		iconClass: 'fas fa-bolt',
		isActive: true,
		createdAt: new Date()
	},
	{
		id: 'duelcraft',
		name: 'Duelcraft',
		displayName: 'Yu-Gi-Oh!',
		themeColor: '#7C3AED',
		iconClass: 'fas fa-eye',
		isActive: true,
		createdAt: new Date()
	},
	{
		id: 'decksong',
		name: 'Decksong',
		displayName: 'Disney Lorcana',
		themeColor: '#EC4899',
		iconClass: 'fas fa-crown',
		isActive: true,
		createdAt: new Date()
	},
	{
		id: 'deckmaster',
		name: 'Deckmaster',
		displayName: 'Strategic Games',
		themeColor: '#10B981',
		iconClass: 'fas fa-chess',
		isActive: true,
		createdAt: new Date()
	},
	{
		id: 'bladeforge',
		name: 'Bladeforge',
		displayName: 'Combat Cards',
		themeColor: '#EF4444',
		iconClass: 'fas fa-swords',
		isActive: true,
		createdAt: new Date()
	}
]);

// Community functions
export const communityStore = {
	// Set selected community
	select(community: Community) {
		selectedCommunity.set(community);
		
		// Apply theme color to document
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty('--community-primary', community.themeColor);
		}
	},

	// Clear selection
	clear() {
		selectedCommunity.set(null);
		
		// Reset theme to default
		if (typeof document !== 'undefined') {
			document.documentElement.style.removeProperty('--community-primary');
		}
	}
};