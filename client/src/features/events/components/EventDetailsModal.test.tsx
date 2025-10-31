import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { Event } from "@shared/schema";
import { EventDetailsModal } from "./EventDetailsModal";

describe("EventDetailsModal", () => {
  const mockEvent: Event = {
    id: "test-event-1",
    title: "Test Tournament",
    description: "A great tournament event",
    type: "tournament",
    status: "active",
    startTime: new Date("2025-11-15T14:00:00"),
    endTime: new Date("2025-11-15T18:00:00"),
    timezone: "America/New_York",
    displayTimezone: null,
    location: "Game Store",
    isVirtual: false,
    maxAttendees: 32,
    playerSlots: null,
    alternateSlots: null,
    isPublic: true,
    gameFormat: "commander",
    powerLevel: 7,
    isRecurring: false,
    recurrencePattern: null,
    recurrenceInterval: null,
    recurrenceEndDate: null,
    parentEventId: null,
    creatorId: "user-1",
    hostId: null,
    coHostId: null,
    communityId: "community-1",
    createdAt: new Date("2025-11-01"),
    updatedAt: new Date("2025-11-01"),
  };

  const mockEventWithExtra = {
    ...mockEvent,
    organizerName: "John Doe",
    attendeeCount: 16,
    communityName: "Magic Community",
  };

  it("renders event details correctly", () => {
    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Test Tournament")).toBeInTheDocument();
    expect(screen.getByText(/Game Store/)).toBeInTheDocument();
    expect(screen.getByText(/A great tournament event/)).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays attendee count correctly", () => {
    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/16 \/ 32 attendees/)).toBeInTheDocument();
  });

  it("shows recurring event badge when event is recurring", () => {
    const recurringEvent = {
      ...mockEventWithExtra,
      isRecurring: true,
      recurrencePattern: "weekly",
    };

    render(
      <EventDetailsModal
        event={recurringEvent}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("weekly")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
        onEdit={onEdit}
      />,
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockEventWithExtra);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockEventWithExtra);
  });

  it("calls onExport when export button is clicked", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
        onExport={onExport}
      />,
    );

    const exportButton = screen.getByRole("button", { name: /export/i });
    await user.click(exportButton);

    expect(onExport).toHaveBeenCalledWith(mockEventWithExtra);
  });

  it("displays conflict warning when conflicts are present", () => {
    const conflictingEvent: Event = {
      ...mockEvent,
      id: "conflict-event",
      title: "Conflicting Event",
      startTime: new Date("2025-11-15T15:00:00"),
      endTime: new Date("2025-11-15T17:00:00"),
    };

    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
        allEvents={[mockEvent, conflictingEvent]}
      />,
    );

    expect(screen.getByText(/Scheduling Conflicts/)).toBeInTheDocument();
    expect(screen.getByText(/Conflicting Event/)).toBeInTheDocument();
  });

  it("does not display conflict warning when no conflicts", () => {
    render(
      <EventDetailsModal
        event={mockEventWithExtra}
        open={true}
        onOpenChange={vi.fn()}
        allEvents={[mockEvent]}
      />,
    );

    expect(screen.queryByText(/Scheduling Conflicts/)).not.toBeInTheDocument();
  });

  it("displays game format and power level for game pods", () => {
    const gamePodEvent = {
      ...mockEventWithExtra,
      type: "game_pod",
      gameFormat: "commander",
      powerLevel: 7,
    };

    render(
      <EventDetailsModal
        event={gamePodEvent}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/commander/i)).toBeInTheDocument();
    expect(screen.getByText(/7\/10/)).toBeInTheDocument();
  });

  it("returns null when event is null", () => {
    const { container } = render(
      <EventDetailsModal event={null} open={true} onOpenChange={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
