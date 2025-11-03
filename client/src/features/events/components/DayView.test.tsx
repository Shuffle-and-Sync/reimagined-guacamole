import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { Event } from "@shared/schema";
import { DayView } from "./DayView";

describe("DayView", () => {
  const mockEvents: Event[] = [
    {
      id: "event-1",
      title: "Morning Tournament",
      description: null,
      type: "tournament",
      status: "active",
      startTime: new Date("2025-11-15T09:00:00"),
      endTime: new Date("2025-11-15T12:00:00"),
      timezone: "UTC",
      displayTimezone: null,
      location: "Game Store",
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
    },
    {
      id: "event-2",
      title: "Afternoon Game Pod",
      description: null,
      type: "game_pod",
      status: "active",
      startTime: new Date("2025-11-15T14:00:00"),
      endTime: new Date("2025-11-15T16:00:00"),
      timezone: "UTC",
      displayTimezone: null,
      location: null,
      isVirtual: true,
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
    },
  ];

  it("renders day header correctly", () => {
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={vi.fn()}
        onEventClick={vi.fn()}
      />,
    );

    // Check for the formatted date - use regex for flexibility
    expect(screen.getByText(/November 15, 2025/)).toBeInTheDocument();
  });

  it("displays events on the selected day", () => {
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={vi.fn()}
        onEventClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Morning Tournament")).toBeInTheDocument();
    expect(screen.getByText("Afternoon Game Pod")).toBeInTheDocument();
  });

  it("does not display events from other days", () => {
    const selectedDate = new Date("2025-11-16T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={vi.fn()}
        onEventClick={vi.fn()}
      />,
    );

    expect(screen.queryByText("Morning Tournament")).not.toBeInTheDocument();
    expect(screen.queryByText("Afternoon Game Pod")).not.toBeInTheDocument();
  });

  it("calls onDateChange when previous day button is clicked", async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onEventClick={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const prevButton = buttons[0];
    if (prevButton) {
      await user.click(prevButton);

      expect(onDateChange).toHaveBeenCalled();
      expect(onDateChange.mock.calls.length).toBeGreaterThan(0);
      const newDate = onDateChange.mock.calls[0]?.[0];
      expect(newDate).toBeDefined();
      expect(newDate?.getDate()).toBe(14); // Previous day
    }
  });

  it("calls onDateChange when next day button is clicked", async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onEventClick={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const nextButton = buttons[1];
    if (nextButton) {
      await user.click(nextButton);

      expect(onDateChange).toHaveBeenCalled();
      expect(onDateChange.mock.calls.length).toBeGreaterThan(0);
      const newDate = onDateChange.mock.calls[0]?.[0];
      expect(newDate).toBeDefined();
      expect(newDate?.getDate()).toBe(16); // Next day
    }
  });

  it("calls onDateChange when today button is clicked", async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onEventClick={vi.fn()}
      />,
    );

    const todayButton = screen.getByRole("button", { name: /today/i });
    await user.click(todayButton);

    expect(onDateChange).toHaveBeenCalled();
  });

  it("calls onEventClick when event is clicked", async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={vi.fn()}
        onEventClick={onEventClick}
      />,
    );

    const eventButton = screen
      .getByText("Morning Tournament")
      .closest("button");
    if (eventButton) {
      await user.click(eventButton);
      expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    }
  });

  it("displays event location when provided", () => {
    const selectedDate = new Date("2025-11-15T12:00:00");

    render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={vi.fn()}
        onEventClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/Game Store/)).toBeInTheDocument();
  });

  it("renders all 24 hour markers", () => {
    const selectedDate = new Date("2025-11-15T12:00:00");

    const { container } = render(
      <DayView
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={vi.fn()}
        onEventClick={vi.fn()}
      />,
    );

    // Check that hour markers exist in the DOM
    const hourMarkers = container.querySelectorAll(
      ".text-xs.text-muted-foreground",
    );
    expect(hourMarkers.length).toBe(24); // Should have 24 hour markers
  });
});
