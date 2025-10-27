/**
 * Operation Tests
 *
 * Tests for operation creation, validation, and utility functions.
 */

import { describe, test, expect } from "@jest/globals";
import {
  createMoveCardOperation,
  createTapCardOperation,
  createDrawCardOperation,
  createPlayCardOperation,
  createAddCounterOperation,
  validateCardOperation,
  affectsSameCard,
} from "../../../src/ot/operations/CardOperations";
import {
  createChangePhaseOperation,
  createEndTurnOperation,
} from "../../../src/ot/operations/GameOperations";
import {
  createUpdateLifeOperation,
  validateUpdateLifeOperation,
} from "../../../src/ot/operations/PlayerOperations";
import type { VectorClock } from "../../../src/ot/types";

describe("Card Operation Creation", () => {
  const version: VectorClock = { client1: 1 };

  describe("createMoveCardOperation", () => {
    test("should create valid MOVE_CARD operation", () => {
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      expect(op.type).toBe("MOVE_CARD");
      expect(op.clientId).toBe("client1");
      expect(op.data.cardId).toBe("card1");
      expect(op.data.from).toBe("hand");
      expect(op.data.to).toBe("battlefield");
      expect(op.version).toEqual(version);
      expect(op.timestamp).toBeDefined();
    });
  });

  describe("createTapCardOperation", () => {
    test("should create valid TAP_CARD operation", () => {
      const op = createTapCardOperation("client1", "card1", true, version);

      expect(op.type).toBe("TAP_CARD");
      expect(op.clientId).toBe("client1");
      expect(op.data.cardId).toBe("card1");
      expect(op.data.tapped).toBe(true);
      expect(op.version).toEqual(version);
    });

    test("should handle untap operation", () => {
      const op = createTapCardOperation("client1", "card1", false, version);
      expect(op.data.tapped).toBe(false);
    });
  });

  describe("createDrawCardOperation", () => {
    test("should create valid DRAW_CARD operation", () => {
      const op = createDrawCardOperation("client1", "player1", version);

      expect(op.type).toBe("DRAW_CARD");
      expect(op.clientId).toBe("client1");
      expect(op.data.playerId).toBe("player1");
      expect(op.version).toEqual(version);
    });

    test("should accept optional cardId", () => {
      const op = createDrawCardOperation(
        "client1",
        "player1",
        version,
        "card1",
      );
      expect(op.data.cardId).toBe("card1");
    });
  });

  describe("createPlayCardOperation", () => {
    test("should create valid PLAY_CARD operation", () => {
      const position = { x: 100, y: 200 };
      const op = createPlayCardOperation("client1", "card1", position, version);

      expect(op.type).toBe("PLAY_CARD");
      expect(op.clientId).toBe("client1");
      expect(op.data.cardId).toBe("card1");
      expect(op.data.position).toEqual(position);
    });

    test("should handle position with zIndex", () => {
      const position = { x: 100, y: 200, zIndex: 5 };
      const op = createPlayCardOperation("client1", "card1", position, version);
      expect(op.data.position.zIndex).toBe(5);
    });
  });

  describe("createAddCounterOperation", () => {
    test("should create valid ADD_COUNTER operation", () => {
      const op = createAddCounterOperation(
        "client1",
        "card1",
        "+1/+1",
        2,
        version,
      );

      expect(op.type).toBe("ADD_COUNTER");
      expect(op.clientId).toBe("client1");
      expect(op.data.cardId).toBe("card1");
      expect(op.data.counterType).toBe("+1/+1");
      expect(op.data.amount).toBe(2);
    });

    test("should handle different counter types", () => {
      const types = ["loyalty", "charge", "-1/-1", "poison"];
      types.forEach((type) => {
        const op = createAddCounterOperation(
          "client1",
          "card1",
          type,
          1,
          version,
        );
        expect(op.data.counterType).toBe(type);
      });
    });
  });
});

describe("Card Operation Validation", () => {
  const version: VectorClock = { client1: 1 };

  test("should validate correct MOVE_CARD operation", () => {
    const op = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    expect(validateCardOperation(op)).toBe(true);
  });

  test("should reject MOVE_CARD with invalid zone", () => {
    const op = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    op.data.to = "invalid" as any;
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should reject MOVE_CARD with missing cardId", () => {
    const op = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    delete (op.data as any).cardId;
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should validate correct TAP_CARD operation", () => {
    const op = createTapCardOperation("client1", "card1", true, version);
    expect(validateCardOperation(op)).toBe(true);
  });

  test("should reject TAP_CARD with missing tapped field", () => {
    const op = createTapCardOperation("client1", "card1", true, version);
    delete (op.data as any).tapped;
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should validate correct DRAW_CARD operation", () => {
    const op = createDrawCardOperation("client1", "player1", version);
    expect(validateCardOperation(op)).toBe(true);
  });

  test("should reject DRAW_CARD with missing playerId", () => {
    const op = createDrawCardOperation("client1", "player1", version);
    delete (op.data as any).playerId;
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should validate correct PLAY_CARD operation", () => {
    const op = createPlayCardOperation(
      "client1",
      "card1",
      { x: 100, y: 200 },
      version,
    );
    expect(validateCardOperation(op)).toBe(true);
  });

  test("should reject PLAY_CARD with invalid position", () => {
    const op = createPlayCardOperation(
      "client1",
      "card1",
      { x: 100, y: 200 },
      version,
    );
    delete (op.data.position as any).x;
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should validate correct ADD_COUNTER operation", () => {
    const op = createAddCounterOperation(
      "client1",
      "card1",
      "+1/+1",
      2,
      version,
    );
    expect(validateCardOperation(op)).toBe(true);
  });

  test("should reject ADD_COUNTER with missing amount", () => {
    const op = createAddCounterOperation(
      "client1",
      "card1",
      "+1/+1",
      2,
      version,
    );
    delete (op.data as any).amount;
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should reject operation with missing type", () => {
    const op: any = {
      clientId: "client1",
      timestamp: Date.now(),
      version,
      data: { cardId: "card1" },
    };
    expect(validateCardOperation(op)).toBe(false);
  });

  test("should reject unknown operation type", () => {
    const op: any = {
      type: "UNKNOWN_TYPE",
      clientId: "client1",
      timestamp: Date.now(),
      version,
      data: { cardId: "card1" },
    };
    expect(validateCardOperation(op)).toBe(false);
  });
});

describe("affectsSameCard", () => {
  const version: VectorClock = { client1: 1 };

  test("should detect same card", () => {
    const op1 = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    const op2 = createTapCardOperation("client2", "card1", true, version);

    expect(affectsSameCard(op1, op2)).toBe(true);
  });

  test("should detect different cards", () => {
    const op1 = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    const op2 = createMoveCardOperation(
      "client2",
      "card2",
      "hand",
      "battlefield",
      version,
    );

    expect(affectsSameCard(op1, op2)).toBe(false);
  });

  test("should handle operations without cardId", () => {
    const op1 = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    const op2 = createDrawCardOperation("client2", "player1", version);

    expect(affectsSameCard(op1, op2 as any)).toBe(false);
  });
});

describe("Player Operation Creation", () => {
  const version: VectorClock = { client1: 1 };

  describe("createUpdateLifeOperation", () => {
    test("should create valid UPDATE_LIFE operation", () => {
      const op = createUpdateLifeOperation("client1", "player1", 5, version);

      expect(op.type).toBe("UPDATE_LIFE");
      expect(op.clientId).toBe("client1");
      expect(op.data.playerId).toBe("player1");
      expect(op.data.delta).toBe(5);
      expect(op.version).toEqual(version);
    });

    test("should handle negative delta", () => {
      const op = createUpdateLifeOperation("client1", "player1", -3, version);
      expect(op.data.delta).toBe(-3);
    });
  });

  describe("validateUpdateLifeOperation", () => {
    test("should validate correct operation", () => {
      const op = createUpdateLifeOperation("client1", "player1", 5, version);
      expect(validateUpdateLifeOperation(op)).toBe(true);
    });

    test("should reject operation with missing playerId", () => {
      const op = createUpdateLifeOperation("client1", "player1", 5, version);
      delete (op.data as any).playerId;
      expect(validateUpdateLifeOperation(op)).toBe(false);
    });

    test("should reject operation with invalid delta", () => {
      const op = createUpdateLifeOperation("client1", "player1", 5, version);
      (op.data as any).delta = "invalid";
      expect(validateUpdateLifeOperation(op)).toBe(false);
    });
  });
});

describe("Game Operation Creation", () => {
  const version: VectorClock = { client1: 1 };

  describe("createChangePhaseOperation", () => {
    test("should create valid CHANGE_PHASE operation", () => {
      const op = createChangePhaseOperation(
        "client1",
        "main",
        "combat",
        version,
      );

      expect(op.type).toBe("CHANGE_PHASE");
      expect(op.clientId).toBe("client1");
      expect(op.data.fromPhase).toBe("main");
      expect(op.data.toPhase).toBe("combat");
      expect(op.version).toEqual(version);
    });
  });

  describe("createEndTurnOperation", () => {
    test("should create valid END_TURN operation", () => {
      const op = createEndTurnOperation(
        "client1",
        "player1",
        "player2",
        version,
      );

      expect(op.type).toBe("END_TURN");
      expect(op.clientId).toBe("client1");
      expect(op.data.currentPlayerId).toBe("player1");
      expect(op.data.nextPlayerId).toBe("player2");
      expect(op.version).toEqual(version);
    });
  });
});
