/**
 * OT Engine Usage Example
 *
 * This file demonstrates how to integrate the OT engine into a
 * real-time collaborative card game session.
 */

import {
  OTEngine,
  createMoveCardOperation,
  createTapCardOperation,
  createAddCounterOperation,
  createUpdateLifeOperation,
  type Operation,
  type VectorClock,
  type Zone,
} from "./index";

/**
 * Example: Simple Game Session with OT
 */
class GameSession {
  private engine: OTEngine;
  private vectorClock: VectorClock;
  private clientId: string;
  private pendingOperations: Operation[] = [];

  constructor(clientId: string, allClientIds: string[]) {
    this.engine = new OTEngine();
    this.clientId = clientId;

    // Initialize vector clock with all client IDs
    this.vectorClock = allClientIds.reduce((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {} as VectorClock);
  }

  /**
   * Perform a local operation (initiated by this client)
   */
  public moveCard(cardId: string, from: Zone, to: Zone): Operation {
    // Increment local clock
    this.vectorClock[this.clientId]++;

    // Create operation with current vector clock
    const op = createMoveCardOperation(this.clientId, cardId, from, to, {
      ...this.vectorClock,
    });

    // Apply locally
    this.engine.apply(op);

    // In a real app, you would broadcast this to other clients
    this.broadcastToOthers(op);

    return op;
  }

  /**
   * Handle an operation received from another client
   */
  public onRemoteOperation(remoteOp: Operation): void {
    // Update vector clock based on remote operation
    for (const clientId in remoteOp.version) {
      this.vectorClock[clientId] = Math.max(
        this.vectorClock[clientId] || 0,
        remoteOp.version[clientId],
      );
    }

    // Transform remote operation against any pending local operations
    const transformed = this.engine.transform(remoteOp, this.pendingOperations);

    // Apply transformed operation
    const success = this.engine.apply(transformed);

    if (success) {
      // eslint-disable-next-line no-console
      console.log(`Applied remote operation: ${transformed.type}`);
    } else {
      console.warn(`Failed to apply operation: ${transformed.type}`);
    }
  }

  /**
   * Tap or untap a card
   */
  public tapCard(cardId: string, tapped: boolean): Operation {
    this.vectorClock[this.clientId]++;

    const op = createTapCardOperation(this.clientId, cardId, tapped, {
      ...this.vectorClock,
    });

    this.engine.apply(op);
    this.broadcastToOthers(op);

    return op;
  }

  /**
   * Add counters to a card
   */
  public addCounters(
    cardId: string,
    counterType: string,
    amount: number,
  ): Operation {
    this.vectorClock[this.clientId]++;

    const op = createAddCounterOperation(
      this.clientId,
      cardId,
      counterType,
      amount,
      { ...this.vectorClock },
    );

    this.engine.apply(op);
    this.broadcastToOthers(op);

    return op;
  }

  /**
   * Update player life
   */
  public updateLife(playerId: string, delta: number): Operation {
    this.vectorClock[this.clientId]++;

    const op = createUpdateLifeOperation(this.clientId, playerId, delta, {
      ...this.vectorClock,
    });

    this.engine.apply(op);
    this.broadcastToOthers(op);

    return op;
  }

  /**
   * Get engine statistics
   */
  public getStats() {
    return this.engine.getStats();
  }

  /**
   * Placeholder for broadcasting to other clients
   * In a real implementation, this would use WebSockets
   */
  private broadcastToOthers(op: Operation): void {
    // In a real app, send via WebSocket:
    // this.websocket.send(JSON.stringify(op));

    // For demo purposes, operations would be broadcast here
    // eslint-disable-next-line no-console
    console.log(`Broadcasting operation: ${op.type} by ${op.clientId}`);
  }

  /**
   * Add an operation to pending queue
   */
  private addPending(op: Operation): void {
    this.pendingOperations.push(op);
  }

  /**
   * Clear pending operations
   */
  public clearPending(): void {
    this.pendingOperations = [];
  }
}

/**
 * Example: Two players playing together
 */
/* eslint-disable no-console */
function exampleTwoPlayerGame() {
  console.log("\n=== Two Player Game Example ===\n");

  // Create two game sessions
  const player1 = new GameSession("player1", ["player1", "player2"]);
  const player2 = new GameSession("player2", ["player1", "player2"]);

  // Player 1 moves a card
  console.log("Player 1: Moving card from hand to battlefield");
  const op1 = player1.moveCard("card-1", "hand", "battlefield");

  // Player 2 simultaneously tries to move the same card
  console.log("Player 2: Moving same card from hand to graveyard");
  const op2 = player2.moveCard("card-1", "hand", "graveyard");

  // Player 1 receives Player 2's operation
  console.log("\nPlayer 1 receives Player 2's operation");
  player1.onRemoteOperation(op2);

  // Player 2 receives Player 1's operation
  console.log("Player 2 receives Player 1's operation");
  player2.onRemoteOperation(op1);

  // Check stats
  console.log("\nPlayer 1 stats:", player1.getStats());
  console.log("Player 2 stats:", player2.getStats());
}

/**
 * Example: Concurrent operations
 */
function exampleConcurrentOperations() {
  console.log("\n=== Concurrent Operations Example ===\n");

  const session = new GameSession("player1", ["player1", "player2", "player3"]);

  // Simulate concurrent operations from different clients
  console.log("Receiving concurrent operations from multiple clients:");

  const concurrentOps = [
    createMoveCardOperation("player2", "card-1", "hand", "battlefield", {
      player1: 0,
      player2: 1,
      player3: 0,
    }),
    createTapCardOperation("player3", "card-1", true, {
      player1: 0,
      player2: 1,
      player3: 1,
    }),
  ];

  concurrentOps.forEach((op) => {
    console.log(`  - ${op.type} from ${op.clientId}`);
    session.onRemoteOperation(op);
  });

  console.log("\nFinal stats:", session.getStats());
}

/**
 * Example: Game flow with multiple operations
 */
function exampleGameFlow() {
  console.log("\n=== Game Flow Example ===\n");

  const player = new GameSession("player1", ["player1", "player2"]);

  // Simulate a turn
  console.log("Turn 1:");
  console.log("1. Draw a card");
  // In real game, would call drawCard()

  console.log("2. Play a card from hand");
  player.moveCard("creature-1", "hand", "battlefield");

  console.log("3. Tap the creature");
  player.tapCard("creature-1", true);

  console.log("4. Add +1/+1 counter");
  player.addCounters("creature-1", "+1/+1", 1);

  console.log("5. Attack - opponent loses life");
  player.updateLife("player2", -3);

  console.log("\nTurn stats:", player.getStats());
}
/* eslint-enable no-console */

// Run examples if this file is executed directly
if (require.main === module) {
  exampleTwoPlayerGame();
  exampleConcurrentOperations();
  exampleGameFlow();
}

export { GameSession };
