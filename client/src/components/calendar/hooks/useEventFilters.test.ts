import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useEventFilters } from "./useEventFilters";

describe("useEventFilters", () => {
  const mockEvents = [
    {
      id: "1",
      title: "Magic Tournament",
      startTime: new Date("2025-01-15"),
      type: "tournament",
      tags: ["magic", "competitive"],
    },
    {
      id: "2",
      title: "Pokemon Game Night",
      startTime: new Date("2025-01-20"),
      type: "game_pod",
      tags: ["pokemon", "casual"],
    },
    {
      id: "3",
      title: "Yu-Gi-Oh Tournament",
      startTime: new Date("2025-01-25"),
      type: "tournament",
      tags: ["yugioh", "competitive"],
    },
  ];

  it("returns all events initially", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    expect(result.current.filteredEvents).toHaveLength(3);
  });

  it("filters events by search term", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.setSearch("Pokemon");
    });

    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe("Pokemon Game Night");
  });

  it("filters events by category", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.toggleCategory("tournament");
    });

    expect(result.current.filteredEvents).toHaveLength(2);
    expect(
      result.current.filteredEvents.every((e) => e.type === "tournament"),
    ).toBe(true);
  });

  it("filters events by date range", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.setDateRange(
        new Date("2025-01-10"),
        new Date("2025-01-20"),
      );
    });

    expect(result.current.filteredEvents).toHaveLength(2);
  });

  it("filters events by tags", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.toggleTag("competitive");
    });

    expect(result.current.filteredEvents).toHaveLength(2);
  });

  it("combines multiple filters", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.toggleCategory("tournament");
      result.current.toggleTag("magic");
    });

    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe("Magic Tournament");
  });

  it("clears all filters", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.setSearch("Pokemon");
      result.current.toggleCategory("tournament");
      result.current.toggleTag("competitive");
    });

    expect(result.current.filteredEvents.length).toBeLessThan(3);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filteredEvents).toHaveLength(3);
  });

  it("returns available categories", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    expect(result.current.availableCategories).toContain("tournament");
    expect(result.current.availableCategories).toContain("game_pod");
  });

  it("returns available tags", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    expect(result.current.availableTags).toContain("magic");
    expect(result.current.availableTags).toContain("pokemon");
    expect(result.current.availableTags).toContain("competitive");
  });

  it("tracks hasActiveFilters correctly", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setSearch("test");
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("toggles category on/off", () => {
    const { result } = renderHook(() => useEventFilters(mockEvents));

    act(() => {
      result.current.toggleCategory("tournament");
    });

    expect(result.current.filters.categories).toContain("tournament");

    act(() => {
      result.current.toggleCategory("tournament");
    });

    expect(result.current.filters.categories).not.toContain("tournament");
  });
});
