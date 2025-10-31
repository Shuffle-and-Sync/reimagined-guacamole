import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Event } from "@shared/schema";
import { useConflictDetection } from "./useConflictDetection";

describe("useConflictDetection", () => {
  const createMockEvent = (
    id: string,
    startTime: Date,
    endTime?: Date,
  ): Event => ({
    id,
    title: `Event ${id}`,
    description: null,
    type: "tournament",
    status: "active",
    startTime,
    endTime: endTime || null,
    timezone: "UTC",
    displayTimezone: null,
    location: null,
    isVirtual: false,
    maxAttendees: null,
    playerSlots: null,
    alternateSlots: null,
    isPublic: true,
    gameFormat: null,
    powerLevel: null,
    isRecurring: false,
    recurrencePattern: null,
    recurrenceInterval: null,
    recurrenceEndDate: null,
    parentEventId: null,
    creatorId: "user-1",
    hostId: null,
    coHostId: null,
    communityId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it("detects conflicts when events overlap", () => {
    const event1 = createMockEvent(
      "event-1",
      new Date("2025-11-15T14:00:00"),
      new Date("2025-11-15T16:00:00"),
    );
    const event2 = createMockEvent(
      "event-2",
      new Date("2025-11-15T15:00:00"),
      new Date("2025-11-15T17:00:00"),
    );

    const { result } = renderHook(() => useConflictDetection([event1, event2]));
    const conflicts = result.current.detectConflicts(event1);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("event-2");
  });

  it("does not detect conflicts when events do not overlap", () => {
    const event1 = createMockEvent(
      "event-1",
      new Date("2025-11-15T14:00:00"),
      new Date("2025-11-15T16:00:00"),
    );
    const event2 = createMockEvent(
      "event-2",
      new Date("2025-11-15T17:00:00"),
      new Date("2025-11-15T19:00:00"),
    );

    const { result } = renderHook(() => useConflictDetection([event1, event2]));
    const conflicts = result.current.detectConflicts(event1);

    expect(conflicts).toHaveLength(0);
  });

  it("does not detect conflicts with itself", () => {
    const event1 = createMockEvent(
      "event-1",
      new Date("2025-11-15T14:00:00"),
      new Date("2025-11-15T16:00:00"),
    );

    const { result } = renderHook(() => useConflictDetection([event1]));
    const conflicts = result.current.detectConflicts(event1);

    expect(conflicts).toHaveLength(0);
  });

  it("detects conflicts when one event starts exactly when another ends", () => {
    const event1 = createMockEvent(
      "event-1",
      new Date("2025-11-15T14:00:00"),
      new Date("2025-11-15T16:00:00"),
    );
    const event2 = createMockEvent(
      "event-2",
      new Date("2025-11-15T16:00:00"),
      new Date("2025-11-15T18:00:00"),
    );

    const { result } = renderHook(() => useConflictDetection([event1, event2]));
    const conflicts = result.current.detectConflicts(event1);

    // Events that touch exactly at the boundary should not conflict
    expect(conflicts).toHaveLength(0);
  });

  it("uses default 1-hour duration when endTime is missing", () => {
    const event1 = createMockEvent("event-1", new Date("2025-11-15T14:00:00"));
    const event2 = createMockEvent(
      "event-2",
      new Date("2025-11-15T14:30:00"),
      new Date("2025-11-15T15:30:00"),
    );

    const { result } = renderHook(() => useConflictDetection([event1, event2]));
    const conflicts = result.current.detectConflicts(event1);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("event-2");
  });

  it("handles multiple conflicts", () => {
    const event1 = createMockEvent(
      "event-1",
      new Date("2025-11-15T14:00:00"),
      new Date("2025-11-15T18:00:00"),
    );
    const event2 = createMockEvent(
      "event-2",
      new Date("2025-11-15T15:00:00"),
      new Date("2025-11-15T16:00:00"),
    );
    const event3 = createMockEvent(
      "event-3",
      new Date("2025-11-15T16:30:00"),
      new Date("2025-11-15T17:30:00"),
    );

    const { result } = renderHook(() =>
      useConflictDetection([event1, event2, event3]),
    );
    const conflicts = result.current.detectConflicts(event1);

    expect(conflicts).toHaveLength(2);
    expect(conflicts.map((c) => c.id)).toContain("event-2");
    expect(conflicts.map((c) => c.id)).toContain("event-3");
  });

  it("returns empty array when event has no startTime", () => {
    const event1 = createMockEvent("event-1", new Date("2025-11-15T14:00:00"));
    const event2 = { ...event1, id: "event-2", startTime: null };

    const { result } = renderHook(() =>
      useConflictDetection([event1, event2 as Event]),
    );
    const conflicts = result.current.detectConflicts(event2 as Event);

    expect(conflicts).toHaveLength(0);
  });

  it("ignores events without startTime when checking conflicts", () => {
    const event1 = createMockEvent(
      "event-1",
      new Date("2025-11-15T14:00:00"),
      new Date("2025-11-15T16:00:00"),
    );
    const event2 = { ...event1, id: "event-2", startTime: null };

    const { result } = renderHook(() =>
      useConflictDetection([event1, event2 as Event]),
    );
    const conflicts = result.current.detectConflicts(event1);

    expect(conflicts).toHaveLength(0);
  });
});
