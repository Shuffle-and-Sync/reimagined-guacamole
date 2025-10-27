/**
 * AuditLogger Tests
 */

import { AuditLogger } from "../../../src/auth/AuditLogger";
import { AuditLogEntry } from "../../../src/auth/types";

describe("AuditLogger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger();
  });

  describe("log", () => {
    it("should log an authorization decision", async () => {
      const entry: AuditLogEntry = {
        userId: "user-1",
        sessionId: "session-1",
        gameId: "game-1",
        action: "game.action.move",
        result: true,
        timestamp: Date.now(),
      };

      await logger.log(entry);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(entry);
    });

    it("should log multiple entries", async () => {
      const entries: AuditLogEntry[] = [
        {
          userId: "user-1",
          action: "game.action.move",
          result: true,
          timestamp: Date.now(),
        },
        {
          userId: "user-2",
          action: "game.view.hand",
          result: false,
          reason: "Not authorized",
          timestamp: Date.now(),
        },
      ];

      for (const entry of entries) {
        await logger.log(entry);
      }

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
    });

    it("should trim logs when exceeding max", async () => {
      const smallLogger = new AuditLogger(3);

      for (let i = 0; i < 5; i++) {
        await smallLogger.log({
          userId: `user-${i}`,
          action: "test",
          result: true,
          timestamp: Date.now() + i,
        });
      }

      const logs = smallLogger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].userId).toBe("user-2"); // First two were dropped
    });

    it("should call persist callback if provided", async () => {
      const persistCallback = jest.fn().mockResolvedValue(undefined);
      const loggerWithCallback = new AuditLogger(100, persistCallback);

      const entry: AuditLogEntry = {
        userId: "user-1",
        action: "test",
        result: true,
        timestamp: Date.now(),
      };

      await loggerWithCallback.log(entry);

      expect(persistCallback).toHaveBeenCalledWith(entry);
    });

    it("should handle persist callback errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const persistCallback = jest
        .fn()
        .mockRejectedValue(new Error("Persist failed"));
      const loggerWithCallback = new AuditLogger(100, persistCallback);

      const entry: AuditLogEntry = {
        userId: "user-1",
        action: "test",
        result: true,
        timestamp: Date.now(),
      };

      await expect(loggerWithCallback.log(entry)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getLogs", () => {
    it("should return a copy of all logs", async () => {
      await logger.log({
        userId: "user-1",
        action: "test",
        result: true,
        timestamp: Date.now(),
      });

      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();

      expect(logs1).toEqual(logs2);
      expect(logs1).not.toBe(logs2); // Different arrays
    });
  });

  describe("getLogsByUser", () => {
    it("should filter logs by user ID", async () => {
      await logger.log({
        userId: "user-1",
        action: "test1",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-2",
        action: "test2",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-1",
        action: "test3",
        result: false,
        timestamp: Date.now(),
      });

      const user1Logs = logger.getLogsByUser("user-1");
      expect(user1Logs).toHaveLength(2);
      expect(user1Logs.every((log) => log.userId === "user-1")).toBe(true);
    });
  });

  describe("getLogsByGame", () => {
    it("should filter logs by game ID", async () => {
      await logger.log({
        userId: "user-1",
        gameId: "game-1",
        action: "test1",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-2",
        gameId: "game-2",
        action: "test2",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-1",
        gameId: "game-1",
        action: "test3",
        result: false,
        timestamp: Date.now(),
      });

      const game1Logs = logger.getLogsByGame("game-1");
      expect(game1Logs).toHaveLength(2);
      expect(game1Logs.every((log) => log.gameId === "game-1")).toBe(true);
    });
  });

  describe("getLogsByTimeRange", () => {
    it("should filter logs by time range", async () => {
      const now = Date.now();

      await logger.log({
        userId: "user-1",
        action: "test1",
        result: true,
        timestamp: now - 3000,
      });

      await logger.log({
        userId: "user-2",
        action: "test2",
        result: true,
        timestamp: now - 1000,
      });

      await logger.log({
        userId: "user-3",
        action: "test3",
        result: true,
        timestamp: now,
      });

      const recentLogs = logger.getLogsByTimeRange(now - 2000, now);
      expect(recentLogs).toHaveLength(2);
    });
  });

  describe("getFailedAttempts", () => {
    it("should return only failed authorization attempts", async () => {
      await logger.log({
        userId: "user-1",
        action: "test1",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-2",
        action: "test2",
        result: false,
        reason: "Not authorized",
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-3",
        action: "test3",
        result: false,
        reason: "Insufficient permissions",
        timestamp: Date.now(),
      });

      const failed = logger.getFailedAttempts();
      expect(failed).toHaveLength(2);
      expect(failed.every((log) => !log.result)).toBe(true);
    });
  });

  describe("getFailedAttemptsByUser", () => {
    it("should return failed attempts for specific user", async () => {
      await logger.log({
        userId: "user-1",
        action: "test1",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-1",
        action: "test2",
        result: false,
        reason: "Not authorized",
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-2",
        action: "test3",
        result: false,
        reason: "Not authorized",
        timestamp: Date.now(),
      });

      const user1Failed = logger.getFailedAttemptsByUser("user-1");
      expect(user1Failed).toHaveLength(1);
      expect(user1Failed[0].userId).toBe("user-1");
      expect(user1Failed[0].result).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all logs", async () => {
      await logger.log({
        userId: "user-1",
        action: "test",
        result: true,
        timestamp: Date.now(),
      });

      expect(logger.getLogs()).toHaveLength(1);

      logger.clear();

      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", async () => {
      await logger.log({
        userId: "user-1",
        action: "test1",
        result: true,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-2",
        action: "test2",
        result: false,
        timestamp: Date.now(),
      });

      await logger.log({
        userId: "user-3",
        action: "test3",
        result: true,
        timestamp: Date.now(),
      });

      const stats = logger.getStats();
      expect(stats.total).toBe(3);
      expect(stats.authorized).toBe(2);
      expect(stats.denied).toBe(1);
      expect(stats.denialRate).toBeCloseTo(1 / 3);
    });

    it("should handle empty logs", () => {
      const stats = logger.getStats();
      expect(stats.total).toBe(0);
      expect(stats.authorized).toBe(0);
      expect(stats.denied).toBe(0);
      expect(stats.denialRate).toBe(0);
    });
  });
});
