import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UpcomingEvents } from "./UpcomingEvents";

const mockEventTypes = [
  {
    id: "tournament",
    name: "Tournament",
    icon: "fas fa-trophy",
    color: "bg-yellow-500",
  },
];

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  username: "testuser",
};

const mockEvent = {
  id: "1",
  title: "Future Tournament",
  type: "tournament",
  date: "2099-12-31",
  time: "18:00",
  location: "Test Location",
  description: "Test Description",
  communityId: "test-community",
  creator: null,
  community: null,
  attendeeCount: 5,
  isUserAttending: false,
  mainPlayers: 8,
  alternates: 2,
} as any; // Simplified mock for testing

describe("UpcomingEvents", () => {
  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onJoinLeave: vi.fn(),
    onGenerateGraphics: vi.fn(),
    onLoginRequired: vi.fn(),
  };

  it("renders upcoming events heading with terminology", () => {
    render(
      <UpcomingEvents
        events={[]}
        eventTypes={mockEventTypes}
        eventsTerminology="Tournaments"
        {...mockHandlers}
      />,
    );

    expect(screen.getByText("Upcoming Tournaments")).toBeInTheDocument();
  });

  it("displays empty state when no events", () => {
    render(
      <UpcomingEvents
        events={[]}
        eventTypes={mockEventTypes}
        eventsTerminology="Events"
        {...mockHandlers}
      />,
    );

    expect(
      screen.getByText("No upcoming events scheduled"),
    ).toBeInTheDocument();
  });

  it("renders event cards when events exist", () => {
    render(
      <UpcomingEvents
        events={[mockEvent]}
        eventTypes={mockEventTypes}
        user={mockUser}
        eventsTerminology="Events"
        {...mockHandlers}
      />,
    );

    expect(screen.getByText("Future Tournament")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <UpcomingEvents
        events={[]}
        eventTypes={mockEventTypes}
        eventsTerminology="Events"
        isLoading={true}
        {...mockHandlers}
      />,
    );

    expect(screen.getByText("Loading events...")).toBeInTheDocument();
  });

  it("renders multiple events in vertical layout", () => {
    const events = [
      { ...mockEvent, id: "1", title: "Event 1" },
      { ...mockEvent, id: "2", title: "Event 2" },
      { ...mockEvent, id: "3", title: "Event 3" },
    ];

    render(
      <UpcomingEvents
        events={events}
        eventTypes={mockEventTypes}
        user={mockUser}
        eventsTerminology="Events"
        {...mockHandlers}
      />,
    );

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
    expect(screen.getByText("Event 3")).toBeInTheDocument();
  });

  it("passes user prop to event cards", () => {
    render(
      <UpcomingEvents
        events={[mockEvent]}
        eventTypes={mockEventTypes}
        user={mockUser}
        eventsTerminology="Events"
        {...mockHandlers}
      />,
    );

    // Card renders when user is present
    expect(screen.getByText("Future Tournament")).toBeInTheDocument();
  });
});
