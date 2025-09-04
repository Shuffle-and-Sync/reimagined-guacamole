// Comprehensive WebSocket store for all real-time platform features
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { WebSocketMessage } from '../types';

// Core WebSocket connection stores
export const wsConnected = writable<boolean>(false);
export const wsMessages = writable<WebSocketMessage[]>([]);
export const wsReconnecting = writable<boolean>(false);
export const wsLastHeartbeat = writable<Date>(new Date());

// Global notification store for cross-feature alerts
export const globalNotifications = writable<any[]>([]);
export const unreadCounts = writable<{
        messages: number;
        notifications: number;
        matchmaking: number;
        tournaments: number;
        forums: number;
}>({
        messages: 0,
        notifications: 0,
        matchmaking: 0,
        tournaments: 0,
        forums: 0
});

// User presence and status
export const userPresence = writable<{
        status: 'online' | 'away' | 'busy' | 'offline';
        activity: string;
        currentPage: string;
}>({
        status: 'online',
        activity: 'browsing',
        currentPage: '/'
});

// Real-time features flags
export const realtimeFeatures = writable<{
        messaging: boolean;
        tournaments: boolean;
        matchmaking: boolean;
        notifications: boolean;
        social: boolean;
        analytics: boolean;
}>({
        messaging: true,
        tournaments: true,
        matchmaking: true,
        notifications: true,
        social: true,
        analytics: true
});

// Game room data structure
interface GameRoomState {
        players: any[];
        spectators: any[];
        gameState: string;
        messages: any[];
}

// Game room WebSocket store factory
export function createGameRoomStore(roomId: string) {
        const { subscribe, set, update } = writable<GameRoomState>({
                players: [],
                spectators: [],
                gameState: 'waiting',
                messages: []
        });

        let socket: WebSocket | null = null;

        const connect = () => {
                if (!browser) return;

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const socketUrl = `${protocol}//${window.location.host}/api/ws/game-room/${roomId}`;
                
                socket = new WebSocket(socketUrl);
                
                socket.onopen = () => {
                        wsConnected.set(true);
                        console.log(`Connected to game room ${roomId}`);
                };
                
                socket.onmessage = (event) => {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        
                        // Update room state based on message type
                        if (message.type === 'room_update') {
                                update(state => ({ ...state, ...message.data }));
                        } else if (message.type === 'player_joined') {
                                update(state => ({
                                        ...state,
                                        players: [...state.players, message.data.player]
                                }));
                        } else if (message.type === 'player_left') {
                                update(state => ({
                                        ...state,
                                        players: state.players.filter((p: any) => p.id !== message.data.playerId)
                                }));
                        } else if (message.type === 'chat_message') {
                                update(state => ({
                                        ...state,
                                        messages: [...state.messages, message.data]
                                }));
                        }
                };
                
                socket.onclose = () => {
                        wsConnected.set(false);
                        console.log(`Disconnected from game room ${roomId}`);
                };
                
                socket.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        wsConnected.set(false);
                };
        };

        const disconnect = () => {
                if (socket) {
                        socket.close();
                        socket = null;
                }
        };

        const sendMessage = (type: string, data: any) => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                                type,
                                data,
                                timestamp: new Date(),
                                roomId
                        }));
                }
        };

        return {
                subscribe,
                connect,
                disconnect,
                sendMessage
        };
}

// Tournament data structure
interface TournamentState {
        bracket: any[];
        participants: any[];
        currentRound: number;
        status: string;
}

// Tournament WebSocket store factory
export function createTournamentStore(tournamentId: string) {
        const { subscribe, set, update } = writable<TournamentState>({
                bracket: [],
                participants: [],
                currentRound: 0,
                status: 'upcoming'
        });

        let socket: WebSocket | null = null;

        const connect = () => {
                if (!browser) return;

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const socketUrl = `${protocol}//${window.location.host}/api/ws/tournament/${tournamentId}`;
                
                socket = new WebSocket(socketUrl);
                
                socket.onopen = () => {
                        console.log(`Connected to tournament ${tournamentId}`);
                };
                
                socket.onmessage = (event) => {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        
                        if (message.type === 'bracket_update') {
                                update(state => ({ ...state, bracket: message.data.bracket }));
                        } else if (message.type === 'match_result') {
                                update(state => ({
                                        ...state,
                                        bracket: state.bracket.map((match: any) => 
                                                match.id === message.data.matchId 
                                                        ? { ...match, ...message.data.result }
                                                        : match
                                        )
                                }));
                        } else if (message.type === 'tournament_status') {
                                update(state => ({ ...state, status: message.data.status }));
                        }
                };
                
                socket.onclose = () => {
                        console.log(`Disconnected from tournament ${tournamentId}`);
                };
        };

        const disconnect = () => {
                if (socket) {
                        socket.close();
                        socket = null;
                }
        };

        const sendMatchResult = (matchId: string, winner: string) => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                                type: 'match_result',
                                data: { matchId, winner },
                                timestamp: new Date(),
                                tournamentId
                        }));
                }
        };

        return {
                subscribe,
                connect,
                disconnect,
                sendMatchResult
        };
}

// Comprehensive Platform WebSocket Manager
class PlatformWebSocketManager {
        private socket: WebSocket | null = null;
        private reconnectTimeout: number | null = null;
        private heartbeatInterval: number | null = null;
        private reconnectAttempts = 0;
        private maxReconnectAttempts = 5;
        private reconnectDelay = 1000;
        
        private subscriptions = new Set<string>();
        private messageHandlers = new Map<string, Function[]>();

        constructor() {
                if (browser) {
                        this.connect();
                        // Auto-reconnect on page visibility change
                        document.addEventListener('visibilitychange', () => {
                                if (!document.hidden && !this.isConnected()) {
                                        this.connect();
                                }
                        });
                }
        }

        connect() {
                if (!browser) return;
                if (this.socket?.readyState === WebSocket.OPEN) return;

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const socketUrl = `${protocol}//${window.location.host}/ws`;
                
                wsReconnecting.set(true);
                this.socket = new WebSocket(socketUrl);
                
                this.socket.onopen = () => {
                        console.log('🔗 Connected to Shuffle & Sync WebSocket');
                        wsConnected.set(true);
                        wsReconnecting.set(false);
                        this.reconnectAttempts = 0;
                        
                        // Start heartbeat
                        this.startHeartbeat();
                        
                        // Re-subscribe to all active subscriptions
                        this.subscriptions.forEach(subscription => {
                                this.send('subscribe', { channel: subscription });
                        });
                        
                        // Send user presence
                        userPresence.subscribe(presence => {
                                this.send('user_presence', presence);
                        });
                };
                
                this.socket.onmessage = (event) => {
                        try {
                                const message: WebSocketMessage = JSON.parse(event.data);
                                this.handleMessage(message);
                        } catch (error) {
                                console.error('Failed to parse WebSocket message:', error);
                        }
                };
                
                this.socket.onclose = () => {
                        console.log('🔌 Disconnected from Shuffle & Sync WebSocket');
                        wsConnected.set(false);
                        wsReconnecting.set(false);
                        
                        if (this.heartbeatInterval) {
                                clearInterval(this.heartbeatInterval);
                                this.heartbeatInterval = null;
                        }
                        
                        // Auto-reconnect with exponential backoff
                        if (this.reconnectAttempts < this.maxReconnectAttempts) {
                                const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
                                this.reconnectTimeout = setTimeout(() => {
                                        this.reconnectAttempts++;
                                        this.connect();
                                }, delay) as any;
                        }
                };
                
                this.socket.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        wsConnected.set(false);
                };
        }

        disconnect() {
                if (this.reconnectTimeout) {
                        clearTimeout(this.reconnectTimeout);
                        this.reconnectTimeout = null;
                }
                
                if (this.heartbeatInterval) {
                        clearInterval(this.heartbeatInterval);
                        this.heartbeatInterval = null;
                }
                
                if (this.socket) {
                        this.socket.close();
                        this.socket = null;
                }
        }

        isConnected(): boolean {
                return this.socket?.readyState === WebSocket.OPEN;
        }

        send(type: string, data: any) {
                if (this.isConnected()) {
                        this.socket!.send(JSON.stringify({
                                type,
                                data,
                                timestamp: new Date().toISOString()
                        }));
                }
        }

        subscribe(channel: string, handler?: Function) {
                this.subscriptions.add(channel);
                
                if (handler) {
                        if (!this.messageHandlers.has(channel)) {
                                this.messageHandlers.set(channel, []);
                        }
                        this.messageHandlers.get(channel)!.push(handler);
                }
                
                if (this.isConnected()) {
                        this.send('subscribe', { channel });
                }
        }

        unsubscribe(channel: string) {
                this.subscriptions.delete(channel);
                this.messageHandlers.delete(channel);
                
                if (this.isConnected()) {
                        this.send('unsubscribe', { channel });
                }
        }

        private startHeartbeat() {
                this.heartbeatInterval = setInterval(() => {
                        if (this.isConnected()) {
                                this.send('heartbeat', {});
                                wsLastHeartbeat.set(new Date());
                        }
                }, 30000) as any;
        }

        private handleMessage(message: WebSocketMessage) {
                // Global message logging
                wsMessages.update(messages => [...messages.slice(-99), message]);
                
                // Route message to specific handlers
                const handlers = this.messageHandlers.get(message.type);
                if (handlers) {
                        handlers.forEach(handler => handler(message));
                }
                
                // Handle common message types
                switch (message.type) {
                        case 'notification':
                                this.handleNotification(message);
                                break;
                        case 'unread_counts':
                                unreadCounts.set(message.data);
                                break;
                        case 'user_status_update':
                                this.handleUserStatusUpdate(message);
                                break;
                        case 'system_announcement':
                                this.handleSystemAnnouncement(message);
                                break;
                        case 'heartbeat_ack':
                                wsLastHeartbeat.set(new Date());
                                break;
                }
        }

        private handleNotification(message: WebSocketMessage) {
                const notification = {
                        id: Date.now().toString(),
                        ...message.data,
                        timestamp: new Date(),
                        read: false
                };
                
                globalNotifications.update(notifications => [notification, ...notifications]);
                
                // Show browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(`🎮 Shuffle & Sync`, {
                                body: notification.message,
                                icon: '/favicon.ico',
                                tag: notification.type
                        });
                }
        }

        private handleUserStatusUpdate(message: WebSocketMessage) {
                // Handle real-time user status updates
                console.log('User status update:', message.data);
        }

        private handleSystemAnnouncement(message: WebSocketMessage) {
                // Handle system-wide announcements
                this.handleNotification({
                        ...message,
                        data: {
                                ...message.data,
                                type: 'system',
                                priority: 'high'
                        }
                });
        }
}

// Global WebSocket manager instance
export const platformWS = browser ? new PlatformWebSocketManager() : null;

// Convenience functions for common operations
export function subscribeToChannel(channel: string, handler?: Function) {
        platformWS?.subscribe(channel, handler);
}

export function unsubscribeFromChannel(channel: string) {
        platformWS?.unsubscribe(channel);
}

export function sendRealtimeMessage(type: string, data: any) {
        platformWS?.send(type, data);
}

// Feature-specific WebSocket integrations

// Messaging WebSocket Integration
export function initializeMessagingWebSocket(userId: string) {
        subscribeToChannel(`messages:${userId}`, (message: WebSocketMessage) => {
                if (message.type === 'new_message') {
                        // Handle new message
                        console.log('New message received:', message.data);
                } else if (message.type === 'message_read') {
                        // Handle message read status
                        console.log('Message read:', message.data);
                }
        });
}

// Matchmaking WebSocket Integration
export function initializeMatchmakingWebSocket(userId: string) {
        subscribeToChannel(`matchmaking:${userId}`, (message: WebSocketMessage) => {
                if (message.type === 'match_found') {
                        // Handle match found
                        console.log('Match found!', message.data);
                } else if (message.type === 'queue_update') {
                        // Handle queue position update
                        console.log('Queue update:', message.data);
                }
        });
}

// Tournament WebSocket Integration
export function initializeTournamentWebSocket(tournamentId: string) {
        subscribeToChannel(`tournament:${tournamentId}`, (message: WebSocketMessage) => {
                if (message.type === 'bracket_update') {
                        // Handle bracket update
                        console.log('Bracket updated:', message.data);
                } else if (message.type === 'match_result') {
                        // Handle match result
                        console.log('Match result:', message.data);
                } else if (message.type === 'tournament_chat') {
                        // Handle tournament chat
                        console.log('Tournament chat:', message.data);
                }
        });
}

// Social Media WebSocket Integration
export function initializeSocialWebSocket(userId: string) {
        subscribeToChannel(`social:${userId}`, (message: WebSocketMessage) => {
                if (message.type === 'post_scheduled') {
                        // Handle scheduled post
                        console.log('Post scheduled:', message.data);
                } else if (message.type === 'analytics_update') {
                        // Handle analytics update
                        console.log('Analytics update:', message.data);
                }
        });
}

// Forums WebSocket Integration
export function initializeForumsWebSocket(userId: string) {
        subscribeToChannel(`forums:${userId}`, (message: WebSocketMessage) => {
                if (message.type === 'new_post') {
                        // Handle new forum post
                        console.log('New forum post:', message.data);
                } else if (message.type === 'post_reply') {
                        // Handle post reply
                        console.log('New reply:', message.data);
                }
        });
}

// Calendar WebSocket Integration
export function initializeCalendarWebSocket(userId: string) {
        subscribeToChannel(`calendar:${userId}`, (message: WebSocketMessage) => {
                if (message.type === 'event_reminder') {
                        // Handle event reminder
                        console.log('Event reminder:', message.data);
                } else if (message.type === 'event_update') {
                        // Handle event update
                        console.log('Event updated:', message.data);
                }
        });
}

// Analytics WebSocket Integration
export function initializeAnalyticsWebSocket(userId: string) {
        subscribeToChannel(`analytics:${userId}`, (message: WebSocketMessage) => {
                if (message.type === 'live_metrics') {
                        // Handle live metrics update
                        console.log('Live metrics:', message.data);
                } else if (message.type === 'goal_achieved') {
                        // Handle goal achievement
                        console.log('Goal achieved!', message.data);
                }
        });
}

// Utility function to initialize all WebSocket features for a user
export function initializeAllWebSocketFeatures(userId: string) {
        if (!platformWS) return;
        
        initializeMessagingWebSocket(userId);
        initializeMatchmakingWebSocket(userId);
        initializeSocialWebSocket(userId);
        initializeForumsWebSocket(userId);
        initializeCalendarWebSocket(userId);
        initializeAnalyticsWebSocket(userId);
        
        // Subscribe to general user notifications
        subscribeToChannel(`user:${userId}`);
}

// Connection status derived store
export const connectionStatus = derived(
        [wsConnected, wsReconnecting],
        ([$connected, $reconnecting]) => {
                if ($connected) return 'connected';
                if ($reconnecting) return 'reconnecting';
                return 'disconnected';
        }
);