import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DayEvents } from "./DayEvents";

describe("DayEvents", () => {
  const mockEvents = [
    {
      id: "1",
      title: "Team Meeting",
      startTime: new Date("2025-01-15T10:00:00"),
    },
    {
      id: "2",
      title: "Code Review",
      startTime: new Date("2025-01-15T14:00:00"),
    },
    {
      id: "3",
      title: "Sprint Planning",
      startTime: new Date("2025-01-15T16:00:00"),
    },
    {
      id: "4",
      title: "Standup",
      startTime: new Date("2025-01-15T09:00:00"),
    },
  ];

  it("renders visible events", () => {
    render(<DayEvents events={mockEvents.slice(0, 3)} />);

    expect(screen.getByText(/Team Meeting/)).toBeInTheDocument();
    expect(screen.getByText(/Code Review/)).toBeInTheDocument();
    expect(screen.getByText(/Sprint Planning/)).toBeInTheDocument();
  });

  it("limits visible events to maxVisible", () => {
    render(<DayEvents events={mockEvents} maxVisible={2} />);

    expect(screen.getByText(/Team Meeting/)).toBeInTheDocument();
    expect(screen.getByText(/Code Review/)).toBeInTheDocument();
    expect(screen.queryByText(/Sprint Planning/)).not.toBeInTheDocument();
  });

  it('shows "+X more" indicator when there are more events', () => {
    render(<DayEvents events={mockEvents} maxVisible={2} />);

    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("calls onEventClick when event is clicked", () => {
    const handleEventClick = vi.fn();
    render(
      <DayEvents
        events={mockEvents.slice(0, 1)}
        onEventClick={handleEventClick}
      />,
    );

    const eventButton = screen.getByText(/Team Meeting/);
    fireEvent.click(eventButton);

    expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('calls onMoreClick when "+X more" is clicked', () => {
    const handleMoreClick = vi.fn();
    render(
      <DayEvents
        events={mockEvents}
        maxVisible={2}
        onMoreClick={handleMoreClick}
      />,
    );

    const moreButton = screen.getByText("+2 more");
    fireEvent.click(moreButton);

    expect(handleMoreClick).toHaveBeenCalledTimes(1);
  });

  it("displays event time when startTime is provided", () => {
    render(<DayEvents events={mockEvents.slice(0, 1)} />);

    // Should show time in HH:MM format
    expect(screen.getByText(/10:00|10:00 AM/)).toBeInTheDocument();
  });

  it("handles events without startTime", () => {
    const eventsWithoutTime = [
      {
        id: "1",
        title: "All Day Event",
        startTime: null,
      },
    ];

    render(<DayEvents events={eventsWithoutTime} />);

    expect(screen.getByText("All Day Event")).toBeInTheDocument();
  });

  it("renders nothing when events array is empty", () => {
    const { container } = render(<DayEvents events={[]} />);

    expect(container.querySelector(".day-events")).toBeEmptyDOMElement();
  });
});
