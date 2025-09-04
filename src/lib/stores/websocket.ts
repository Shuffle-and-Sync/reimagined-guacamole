// WebSocket store for real-time features
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { WebSocketMessage } from '../types';

// WebSocket connection store
export const wsConnected = writable<boolean>(false);
export const wsMessages = writable<WebSocketMessage[]>([]);

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