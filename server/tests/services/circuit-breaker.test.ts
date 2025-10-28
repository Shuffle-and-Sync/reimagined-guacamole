/**
 * Circuit Breaker Service Tests
 *
 * Tests for resilient platform API calls with circuit breaker pattern.
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { db } from "@shared/database-unified";
import { CircuitBreakerOpenError } from "../../errors/tournament-errors";
import { circuitBreakerService } from "../../services/circuit-breaker.service";

// Mock database
jest.mock("@shared/database-unified", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Circuit Breaker Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    test("should execute operation when circuit is closed", async () => {
      const mockBreaker = {
        id: "breaker-1",
        platform: "twitch",
        endpoint: "/streams",
        state: "closed",
        failureCount: 0,
        successCount: 0,
      };

      const mockSelect = jest.fn().mockImplementation(() => {
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockBreaker]),
            }),
          }),
        };
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockImplementation(mockSelect);
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      const mockOperation = jest.fn().mockResolvedValue({ data: "success" });

      const result = await circuitBreakerService.execute({
        platform: "twitch",
        endpoint: "/streams",
        operation: mockOperation,
      });

      expect(result).toEqual({ data: "success" });
      expect(mockOperation).toHaveBeenCalled();
    });

    test("should use fallback when circuit is open", async () => {
      const mockBreaker = {
        id: "breaker-1",
        platform: "twitch",
        endpoint: "/streams",
        state: "open",
        nextRetryAt: new Date(Date.now() + 30000),
        failureCount: 5,
        successCount: 0,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockOperation = jest.fn().mockResolvedValue({ data: "success" });
      const mockFallback = jest.fn().mockResolvedValue({ data: "cached" });

      const result = await circuitBreakerService.execute({
        platform: "twitch",
        endpoint: "/streams",
        operation: mockOperation,
        fallback: mockFallback,
      });

      expect(result).toEqual({ data: "cached" });
      expect(mockOperation).not.toHaveBeenCalled();
      expect(mockFallback).toHaveBeenCalled();
    });

    test("should throw CircuitBreakerOpenError when open and no fallback", async () => {
      const mockBreaker = {
        id: "breaker-1",
        platform: "twitch",
        endpoint: "/streams",
        state: "open",
        nextRetryAt: new Date(Date.now() + 30000),
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockOperation = jest.fn().mockResolvedValue({ data: "success" });

      await expect(
        circuitBreakerService.execute({
          platform: "twitch",
          endpoint: "/streams",
          operation: mockOperation,
        }),
      ).rejects.toThrow(CircuitBreakerOpenError);
    });

    test("should transition to half-open when retry time reached", async () => {
      const mockBreaker = {
        id: "breaker-1",
        platform: "twitch",
        endpoint: "/streams",
        state: "open",
        nextRetryAt: new Date(Date.now() - 1000), // Past retry time
        failureCount: 5,
        successCount: 0,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      const mockOperation = jest.fn().mockResolvedValue({ data: "success" });

      await circuitBreakerService.execute({
        platform: "twitch",
        endpoint: "/streams",
        operation: mockOperation,
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should record failure and use fallback on operation error", async () => {
      const mockBreaker = {
        id: "breaker-1",
        platform: "twitch",
        endpoint: "/streams",
        state: "closed",
        failureCount: 0,
        successCount: 0,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const mockOperation = jest.fn().mockRejectedValue(new Error("API Error"));
      const mockFallback = jest.fn().mockResolvedValue({ data: "fallback" });

      const result = await circuitBreakerService.execute({
        platform: "twitch",
        endpoint: "/streams",
        operation: mockOperation,
        fallback: mockFallback,
      });

      expect(result).toEqual({ data: "fallback" });
      expect(mockFallback).toHaveBeenCalled();
    });
  });

  describe("recordSuccess", () => {
    test("should close circuit after success threshold in half-open state", async () => {
      const mockBreaker = {
        id: "breaker-1",
        state: "half_open",
        successCount: 1,
        platform: "twitch",
        endpoint: "/streams",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      await circuitBreakerService.recordSuccess("breaker-1");

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should increment success count when below threshold", async () => {
      const mockBreaker = {
        id: "breaker-1",
        state: "closed",
        successCount: 5,
        failureCount: 0,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      await circuitBreakerService.recordSuccess("breaker-1");

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("recordFailure", () => {
    test("should open circuit when failure threshold reached", async () => {
      const mockBreaker = {
        id: "breaker-1",
        state: "closed",
        failureCount: 4,
        successCount: 10,
        platform: "twitch",
        endpoint: "/streams",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      await circuitBreakerService.recordFailure("breaker-1");

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should increment failure count when below threshold", async () => {
      const mockBreaker = {
        id: "breaker-1",
        state: "closed",
        failureCount: 1,
        successCount: 10,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBreaker]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      await circuitBreakerService.recordFailure("breaker-1");

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    test("should reset circuit breaker to closed state", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      await circuitBreakerService.reset("twitch", "/streams");

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("getAllBreakers", () => {
    test("should return all circuit breakers", async () => {
      const mockBreakers = [
        { id: "breaker-1", platform: "twitch", state: "closed" },
        { id: "breaker-2", platform: "youtube", state: "open" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockResolvedValue(mockBreakers),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result = await circuitBreakerService.getAllBreakers();

      expect(result).toEqual(mockBreakers);
      expect(result.length).toBe(2);
    });
  });

  describe("getBreakersByState", () => {
    test("should return circuit breakers filtered by state", async () => {
      const mockBreakers = [
        { id: "breaker-1", platform: "twitch", state: "open" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockBreakers),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result = await circuitBreakerService.getBreakersByState("open");

      expect(result).toEqual(mockBreakers);
    });
  });
});
