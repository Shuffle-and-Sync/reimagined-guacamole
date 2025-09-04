// Shared TypeScript types for the Shuffle & Sync platform

export interface Community {
	id: string;
	name: string;
	displayName: string;
	description?: string;
	themeColor: string;
	iconClass: string;
	isActive: boolean;
	createdAt: Date;
}

export interface User {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	profileImageUrl?: string;
	primaryCommunity?: string;
	username?: string;
	bio?: string;
	location?: string;
	website?: string;
	status: 'offline' | 'online' | 'away' | 'busy' | 'gaming';
	statusMessage?: string;
	timezone?: string;
	isPrivate: boolean;
	showOnlineStatus: 'everyone' | 'friends_only';
	allowDirectMessages: 'everyone' | 'friends_only';
	createdAt: Date;
	updatedAt: Date;
}

export interface GameSession {
	id: string;
	eventId: string;
	hostId: string;
	coHostId?: string;
	status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
	currentPlayers: number;
	maxPlayers: number;
	spectators: number;
	gameData?: any;
	communityId?: string;
	createdAt: Date;
	startedAt?: Date;
	endedAt?: Date;
}

export interface Tournament {
	id: string;
	name: string;
	description?: string;
	gameFormat: string;
	communityId: string;
	organizerId: string;
	maxParticipants: number;
	currentParticipants: number;
	status: 'upcoming' | 'active' | 'completed' | 'cancelled';
	startDate?: Date;
	endDate?: Date;
	bracketData?: any;
	prizePool?: string;
	rules?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Event {
	id: string;
	title: string;
	description?: string;
	type: 'tournament' | 'convention' | 'release' | 'stream' | 'community' | 'personal' | 'game_pod';
	date: string; // YYYY-MM-DD format
	time: string; // HH:MM format
	location: string;
	communityId?: string;
	creatorId: string;
	hostId: string;
	coHostId?: string;
	maxAttendees?: number;
	isPublic: boolean;
	status: 'active' | 'cancelled' | 'completed';
	playerSlots: number;
	alternateSlots: number;
	gameFormat?: string;
	powerLevel?: number;
	isRecurring: boolean;
	recurrencePattern?: 'daily' | 'weekly' | 'monthly';
	recurrenceInterval: number;
	recurrenceEndDate?: string;
	parentEventId?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface WebSocketMessage {
	type: string;
	data: any;
	timestamp: Date;
	userId?: string;
	roomId?: string;
}