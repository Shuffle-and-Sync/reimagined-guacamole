import type { Event } from "@shared/schema";

export function useConflictDetection(events: Event[]) {
  const detectConflicts = (checkEvent: Event): Event[] => {
    if (!checkEvent.startTime) return [];

    return events.filter((existingEvent) => {
      if (existingEvent.id === checkEvent.id) return false;
      if (!existingEvent.startTime) return false;

      const newStart = new Date(checkEvent.startTime);
      const newEnd = checkEvent.endTime
        ? new Date(checkEvent.endTime)
        : new Date(newStart.getTime() + 3600000); // Default 1 hour

      const existingStart = new Date(existingEvent.startTime);
      const existingEnd = existingEvent.endTime
        ? new Date(existingEvent.endTime)
        : new Date(existingStart.getTime() + 3600000);

      // Check for overlap: events conflict if one starts before the other ends
      return newStart < existingEnd && existingStart < newEnd;
    });
  };

  return { detectConflicts };
}
