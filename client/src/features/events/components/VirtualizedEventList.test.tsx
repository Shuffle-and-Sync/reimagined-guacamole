import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VirtualizedEventList } from "./VirtualizedEventList";
import type { ExtendedEvent } from "../types";

describe("VirtualizedEventList", () => {
  const createMockEvent = (i: number): ExtendedEvent =>
    ({
      id: `event-${i}`,
      title: `Event ${i}`,
      type: "tournament",
      creator: null,
      community: null,
      attendeeCount: 5,
    }) as ExtendedEvent;

  const mockEvents: ExtendedEvent[] = Array.from({ length: 100 }, (_, i) =>
    createMockEvent(i)
  );

  it("should render the virtualized list container", () => {
    const renderEvent = (event: ExtendedEvent) => (
      <div key={event.id}>{event.title}</div>
    );

    const { container } = render(
      <VirtualizedEventList events={mockEvents} renderEvent={renderEvent} />
    );

    // Check that the container exists
    expect(container.firstChild).toBeTruthy();
  });

  it("should accept custom estimatedItemHeight", () => {
    const renderEvent = (event: ExtendedEvent) => (
      <div key={event.id}>{event.title}</div>
    );

    const { container } = render(
      <VirtualizedEventList
        events={mockEvents}
        renderEvent={renderEvent}
        estimatedItemHeight={150}
      />
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("should render with empty events array", () => {
    const renderEvent = (event: ExtendedEvent) => (
      <div key={event.id}>{event.title}</div>
    );

    const { container } = render(
      <VirtualizedEventList events={[]} renderEvent={renderEvent} />
    );

    expect(container.firstChild).toBeTruthy();
  });

  it("should apply custom className", () => {
    const renderEvent = (event: ExtendedEvent) => (
      <div key={event.id}>{event.title}</div>
    );

    const { container } = render(
      <VirtualizedEventList
        events={mockEvents}
        renderEvent={renderEvent}
        className="custom-class"
      />
    );

    const element = container.firstChild as HTMLElement;
    expect(element.className).toContain("custom-class");
  });
});
