import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TodayEvents } from "./TodayEvents";

const mockEventTypes = [
  {
    id: "tournament",
    name: "Tournament",
    icon: "fas fa-trophy",
    color: "bg-yellow-500",
  },
];

const mockEvent = {
  id: "1",
  title: "Test Tournament",
  type: "tournament",
  date: new Date().toISOString().split("T")[0],
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

describe("TodayEvents", () => {
  it("renders today's events heading with terminology", () => {
    render(
      <TodayEvents
        events={[]}
        eventTypes={mockEventTypes}
        eventsTerminology="Tournaments"
      />,
    );

    expect(screen.getByText("Today's Tournaments")).toBeInTheDocument();
  });

  it("displays empty state when no events", () => {
    render(
      <TodayEvents
        events={[]}
        eventTypes={mockEventTypes}
        eventsTerminology="Events"
      />,
    );

    expect(
      screen.getByText("No events scheduled for today"),
    ).toBeInTheDocument();
  });

  it("renders event cards when events exist", () => {
    render(
      <TodayEvents
        events={[mockEvent]}
        eventTypes={mockEventTypes}
        eventsTerminology="Events"
      />,
    );

    expect(screen.getByText("Test Tournament")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <TodayEvents
        events={[]}
        eventTypes={mockEventTypes}
        eventsTerminology="Events"
        isLoading={true}
      />,
    );

    expect(screen.getByText("Loading events...")).toBeInTheDocument();
  });

  it("renders multiple events in grid layout", () => {
    const events = [
      { ...mockEvent, id: "1", title: "Event 1" },
      { ...mockEvent, id: "2", title: "Event 2" },
      { ...mockEvent, id: "3", title: "Event 3" },
    ];

    render(
      <TodayEvents
        events={events}
        eventTypes={mockEventTypes}
        eventsTerminology="Events"
      />,
    );

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
    expect(screen.getByText("Event 3")).toBeInTheDocument();
  });
});
