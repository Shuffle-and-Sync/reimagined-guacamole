import { useState, useMemo, useCallback } from "react";

interface Event {
  id: string;
  title: string;
  startTime?: Date | string | null;
  type?: string;
  tags?: string[];
}

interface EventFilters {
  search: string;
  categories: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  tags: string[];
}

export const useEventFilters = (events: Event[]) => {
  const [filters, setFilters] = useState<EventFilters>({
    search: "",
    categories: [],
    dateRange: { start: null, end: null },
    tags: [],
  });

  // Update individual filters
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      categories: [],
      dateRange: { start: null, end: null },
      tags: [],
    });
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (
        filters.search &&
        !event.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (
        filters.categories.length > 0 &&
        (!event.type || !filters.categories.includes(event.type))
      ) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && event.startTime) {
        const eventDate = new Date(event.startTime);
        if (eventDate < filters.dateRange.start) {
          return false;
        }
      }
      if (filters.dateRange.end && event.startTime) {
        const eventDate = new Date(event.startTime);
        if (eventDate > filters.dateRange.end) {
          return false;
        }
      }

      // Tag filter
      if (filters.tags.length > 0) {
        if (
          !event.tags ||
          !filters.tags.some((tag) => event.tags?.includes(tag))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  // Available options for filters
  const availableCategories = useMemo(() => {
    const categories = new Set(
      events.map((e) => e.type).filter(Boolean) as string[],
    );
    return Array.from(categories);
  }, [events]);

  const availableTags = useMemo(() => {
    const tags = new Set(events.flatMap((e) => e.tags || []));
    return Array.from(tags);
  }, [events]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.categories.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null
    );
  }, [filters]);

  return {
    filters,
    filteredEvents,
    availableCategories,
    availableTags,
    hasActiveFilters,
    setSearch,
    toggleCategory,
    setDateRange,
    toggleTag,
    clearFilters,
  };
};
