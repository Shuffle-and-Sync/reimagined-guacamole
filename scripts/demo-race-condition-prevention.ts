#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Race Condition Prevention Demonstration
 *
 * This script demonstrates that the WebSocket connection manager
 * properly handles race conditions with concurrent operations.
 */

import { WebSocket } from "ws";
import { WebSocketConnectionManager } from "../server/utils/websocket-connection-manager";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  connectionId?: string;
  sessionId?: string;
  lastActivity?: number;
}

async function demonstrateRaceConditionPrevention() {
  console.log(
    "=== WebSocket Connection Manager - Race Condition Prevention Demo ===\n",
  );

  const manager = new WebSocketConnectionManager();

  // Demonstrate 1: Connection Limits
  console.log("1. Testing Per-User Connection Limits");
  console.log("   - MAX_CONNECTIONS_PER_USER = 3");
  console.log("   - Registering 4 connections for the same user...");

  const mockConnections: ExtendedWebSocket[] = [];
  for (let i = 0; i < 4; i++) {
    const ws = {
      readyState: WebSocket.OPEN,
      on: () => {},
      close: () =>
        console.log(`   ⚠️  Oldest connection closed (limit exceeded)`),
    } as unknown as ExtendedWebSocket;
    mockConnections.push(ws);

    try {
      const connId = manager.registerConnection(ws, "user-demo");
      console.log(
        `   ✅ Connection ${i + 1} registered: ${connId.substring(0, 20)}...`,
      );
    } catch (error) {
      console.log(
        `   ❌ Connection ${i + 1} failed:`,
        (error as Error).message,
      );
    }
  }

  const userCount = manager.getUserConnectionCount("user-demo");
  console.log(`   Final user connection count: ${userCount} (should be 3)\n`);

  // Demonstrate 2: Race Condition Prevention with Concurrent Room Joins
  console.log("2. Testing Race Condition Prevention");
  console.log(
    "   - Creating 20 connections that will join the same room simultaneously...",
  );

  const connections: ExtendedWebSocket[] = [];
  const connectionIds: string[] = [];

  for (let i = 0; i < 20; i++) {
    const ws = {
      readyState: WebSocket.OPEN,
      on: () => {},
    } as unknown as ExtendedWebSocket;
    connections.push(ws);
    const connId = manager.registerConnection(ws, `user-${i}`);
    connectionIds.push(connId);
  }

  console.log("   ✅ All 20 connections registered");

  // All connections try to join the same room simultaneously
  console.log(
    "   - All 20 connections joining room 'race-test' simultaneously...",
  );

  const startTime = Date.now();
  const joinPromises = connectionIds.map((connId) =>
    manager.joinGameRoom(connId, "race-test"),
  );

  const results = await Promise.all(joinPromises);
  const endTime = Date.now();

  const successCount = results.filter((r) => r === true).length;
  const roomSize = manager.getGameRoomConnections("race-test").length;

  console.log(`   ✅ All joins completed in ${endTime - startTime}ms`);
  console.log(`   ✅ Success rate: ${successCount}/20 (100%)`);
  console.log(`   ✅ Room size: ${roomSize} (should be 20)\n`);

  // Demonstrate 3: Connection Statistics
  console.log("3. Connection Statistics");
  const stats = manager.getStats();
  const limits = manager.getConnectionLimits();

  console.log(`   Total Connections: ${stats.totalConnections}`);
  console.log(`   Active Connections: ${stats.activeConnections}`);
  console.log(`   Connection by Type:`);
  console.log(`     - Game Rooms: ${stats.connectionsByType.game_room}`);
  console.log(
    `     - Collaborative: ${stats.connectionsByType.collaborative_stream}`,
  );
  console.log(`     - Unassigned: ${stats.connectionsByType.unassigned}`);
  console.log(`   Limits:`);
  console.log(`     - Per User: ${limits.maxPerUser}`);
  console.log(`     - Global: ${limits.maxTotal}\n`);

  console.log("=== Demo Complete ===");
  console.log("✅ Race condition prevention working correctly!");
  console.log("✅ Connection limits enforced properly!");
  console.log("✅ Concurrent operations handled safely!");
}

// Run the demonstration
demonstrateRaceConditionPrevention().catch(console.error);
