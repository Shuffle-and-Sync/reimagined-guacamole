/**
 * VectorClock Tests
 *
 * Tests for vector clock operations including comparison,
 * increment, merge, and causal ordering.
 */

import { describe, test, expect } from "@jest/globals";
import { ClockComparison } from "../types";
import { VectorClock } from "../VectorClock";

describe("VectorClock", () => {
  describe("create", () => {
    test("should create empty vector clock", () => {
      const clock = VectorClock.create();
      expect(clock).toEqual({});
    });

    test("should create vector clock with initial client", () => {
      const clock = VectorClock.create("client1");
      expect(clock).toEqual({ client1: 0 });
    });
  });

  describe("increment", () => {
    test("should increment existing client counter", () => {
      const clock = { client1: 5, client2: 3 };
      const incremented = VectorClock.increment(clock, "client1");
      expect(incremented).toEqual({ client1: 6, client2: 3 });
    });

    test("should initialize new client counter", () => {
      const clock = { client1: 5 };
      const incremented = VectorClock.increment(clock, "client2");
      expect(incremented).toEqual({ client1: 5, client2: 1 });
    });

    test("should not mutate original clock", () => {
      const clock = { client1: 5 };
      VectorClock.increment(clock, "client1");
      expect(clock).toEqual({ client1: 5 });
    });
  });

  describe("merge", () => {
    test("should take maximum of each component", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 3, client2: 7 };
      const merged = VectorClock.merge(clock1, clock2);
      expect(merged).toEqual({ client1: 5, client2: 7 });
    });

    test("should handle missing clients in first clock", () => {
      const clock1 = { client1: 5 };
      const clock2 = { client1: 3, client2: 7 };
      const merged = VectorClock.merge(clock1, clock2);
      expect(merged).toEqual({ client1: 5, client2: 7 });
    });

    test("should handle missing clients in second clock", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 3 };
      const merged = VectorClock.merge(clock1, clock2);
      expect(merged).toEqual({ client1: 5, client2: 3 });
    });
  });

  describe("compare", () => {
    test("should detect EQUAL clocks", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 5, client2: 3 };
      expect(VectorClock.compare(clock1, clock2)).toBe(ClockComparison.EQUAL);
    });

    test("should detect BEFORE relationship", () => {
      const clock1 = { client1: 3, client2: 2 };
      const clock2 = { client1: 5, client2: 3 };
      expect(VectorClock.compare(clock1, clock2)).toBe(ClockComparison.BEFORE);
    });

    test("should detect AFTER relationship", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 3, client2: 2 };
      expect(VectorClock.compare(clock1, clock2)).toBe(ClockComparison.AFTER);
    });

    test("should detect CONCURRENT clocks", () => {
      const clock1 = { client1: 5, client2: 2 };
      const clock2 = { client1: 3, client2: 4 };
      expect(VectorClock.compare(clock1, clock2)).toBe(
        ClockComparison.CONCURRENT,
      );
    });

    test("should handle clocks with different clients", () => {
      const clock1 = { client1: 5 };
      const clock2 = { client2: 3 };
      expect(VectorClock.compare(clock1, clock2)).toBe(
        ClockComparison.CONCURRENT,
      );
    });
  });

  describe("isBefore", () => {
    test("should return true when clock1 is before clock2", () => {
      const clock1 = { client1: 3, client2: 2 };
      const clock2 = { client1: 5, client2: 3 };
      expect(VectorClock.isBefore(clock1, clock2)).toBe(true);
    });

    test("should return false when clock1 is after clock2", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 3, client2: 2 };
      expect(VectorClock.isBefore(clock1, clock2)).toBe(false);
    });
  });

  describe("isAfter", () => {
    test("should return true when clock1 is after clock2", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 3, client2: 2 };
      expect(VectorClock.isAfter(clock1, clock2)).toBe(true);
    });

    test("should return false when clock1 is before clock2", () => {
      const clock1 = { client1: 3, client2: 2 };
      const clock2 = { client1: 5, client2: 3 };
      expect(VectorClock.isAfter(clock1, clock2)).toBe(false);
    });
  });

  describe("isConcurrent", () => {
    test("should return true for concurrent clocks", () => {
      const clock1 = { client1: 5, client2: 2 };
      const clock2 = { client1: 3, client2: 4 };
      expect(VectorClock.isConcurrent(clock1, clock2)).toBe(true);
    });

    test("should return false for ordered clocks", () => {
      const clock1 = { client1: 3, client2: 2 };
      const clock2 = { client1: 5, client2: 3 };
      expect(VectorClock.isConcurrent(clock1, clock2)).toBe(false);
    });
  });

  describe("isEqual", () => {
    test("should return true for identical clocks", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 5, client2: 3 };
      expect(VectorClock.isEqual(clock1, clock2)).toBe(true);
    });

    test("should return false for different clocks", () => {
      const clock1 = { client1: 5, client2: 3 };
      const clock2 = { client1: 5, client2: 4 };
      expect(VectorClock.isEqual(clock1, clock2)).toBe(false);
    });
  });

  describe("toString", () => {
    test("should convert clock to string", () => {
      const clock = { client1: 5, client2: 3 };
      const str = VectorClock.toString(clock);
      expect(str).toBe("client1:5,client2:3");
    });

    test("should sort clients alphabetically", () => {
      const clock = { client2: 3, client1: 5 };
      const str = VectorClock.toString(clock);
      expect(str).toBe("client1:5,client2:3");
    });
  });

  describe("fromString", () => {
    test("should parse clock from string", () => {
      const str = "client1:5,client2:3";
      const clock = VectorClock.fromString(str);
      expect(clock).toEqual({ client1: 5, client2: 3 });
    });

    test("should handle empty string", () => {
      const clock = VectorClock.fromString("");
      expect(clock).toEqual({});
    });
  });

  describe("sum", () => {
    test("should calculate sum of all clock values", () => {
      const clock = { client1: 5, client2: 3, client3: 2 };
      expect(VectorClock.sum(clock)).toBe(10);
    });

    test("should return 0 for empty clock", () => {
      const clock = {};
      expect(VectorClock.sum(clock)).toBe(0);
    });
  });

  describe("causal ordering scenarios", () => {
    test("should maintain transitivity", () => {
      const clock1 = { client1: 1 };
      const clock2 = { client1: 2 };
      const clock3 = { client1: 3 };

      expect(VectorClock.isBefore(clock1, clock2)).toBe(true);
      expect(VectorClock.isBefore(clock2, clock3)).toBe(true);
      expect(VectorClock.isBefore(clock1, clock3)).toBe(true);
    });

    test("should detect concurrent events from different clients", () => {
      const clock1 = { client1: 1, client2: 0 };
      const clock2 = { client1: 0, client2: 1 };

      expect(VectorClock.isConcurrent(clock1, clock2)).toBe(true);
    });
  });
});
