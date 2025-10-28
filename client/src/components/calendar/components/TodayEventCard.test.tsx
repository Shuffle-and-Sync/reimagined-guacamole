import { render, screen } from "@testing-library/react";
import type { Event, Community } from "@shared/schema";
import { TodayEventCard } from "./TodayEventCard";

const mockEvent: Event & {
  community: Community | null;
  attendeeCount: number;
  time?: string;
} = {
  id: "test-event-1",
  title: "Test Tournament",
  description: "A test tournament description",
  location: "Online",
  type: "tournament",
  startTime: new Date("2025-01-15T10:00:00Z"),
  endTime: new Date("2025-01-15T18:00:00Z"),
  hostId: "user-1",
  communityId: "community-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "upcoming",
  isVirtual: true,
  isPublic: true,
  time: "10:00 AM",
  attendeeCount: 15,
  community: {
    id: "community-1",
    name: "Magic: The Gathering",
    displayName: "Magic",
    description: "MTG community",
    createdAt: new Date(),
    isActive: true,
    themeColor: "#ff6b35",
    iconClass: "fas fa-magic",
  },
};

const mockEventType = {
  id: "tournament",
  name: "Tournament",
  icon: "fas fa-trophy",
  color: "bg-yellow-500",
};

describe("TodayEventCard", () => {
  it("renders event information correctly", () => {
    render(<TodayEventCard event={mockEvent} eventType={mockEventType} />);

    expect(screen.getByText("Test Tournament")).toBeInTheDocument();
    expect(
      screen.getByText("A test tournament description"),
    ).toBeInTheDocument();
    expect(screen.getByText("📍 Online")).toBeInTheDocument();
    expect(screen.getByText("👥 15")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
  });

  it("renders community badge", () => {
    render(<TodayEventCard event={mockEvent} eventType={mockEventType} />);

    expect(screen.getByText("Magic: The Gathering")).toBeInTheDocument();
  });

  it("displays default icon when eventType is undefined", () => {
    const { container } = render(
      <TodayEventCard event={mockEvent} eventType={undefined} />,
    );

    const iconElement = container.querySelector(".fas.fa-calendar");
    expect(iconElement).toBeInTheDocument();
  });

  it("formats attendee count correctly", () => {
    const eventWithManyAttendees = {
      ...mockEvent,
      attendeeCount: 1234,
    };

    render(
      <TodayEventCard
        event={eventWithManyAttendees}
        eventType={mockEventType}
      />,
    );

    expect(screen.getByText("👥 1,234")).toBeInTheDocument();
  });

  it("handles missing optional fields gracefully", () => {
    const minimalEvent = {
      ...mockEvent,
      description: null,
      time: undefined,
    };

    render(<TodayEventCard event={minimalEvent} eventType={mockEventType} />);

    // Should still render without errors
    expect(screen.getByText("Test Tournament")).toBeInTheDocument();
  });

  it("applies correct CSS classes for event type", () => {
    const { container } = render(
      <TodayEventCard event={mockEvent} eventType={mockEventType} />,
    );

    const colorElement = container.querySelector(".bg-yellow-500");
    expect(colorElement).toBeInTheDocument();
  });
});
