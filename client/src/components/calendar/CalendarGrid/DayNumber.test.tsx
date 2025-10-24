import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DayNumber } from "./DayNumber";

describe("DayNumber", () => {
  const mockDate = new Date("2025-01-15");

  it("renders the day number", () => {
    render(
      <DayNumber
        date={mockDate}
        isCurrentMonth={true}
        isToday={false}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("applies current month styling", () => {
    render(
      <DayNumber
        date={mockDate}
        isCurrentMonth={true}
        isToday={false}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-gray-900");
  });

  it("applies today styling", () => {
    render(
      <DayNumber
        date={mockDate}
        isCurrentMonth={true}
        isToday={true}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("font-bold");
  });

  it("applies selected styling", () => {
    render(
      <DayNumber
        date={mockDate}
        isCurrentMonth={true}
        isToday={false}
        isSelected={true}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("ring-2");
    expect(button).toHaveClass("ring-primary");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <DayNumber
        date={mockDate}
        isCurrentMonth={true}
        isToday={false}
        isSelected={false}
        onClick={handleClick}
      />,
    );

    const button = screen.getByRole("button");
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility attributes", () => {
    render(
      <DayNumber
        date={mockDate}
        isCurrentMonth={true}
        isToday={true}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
    expect(button).toHaveAttribute("aria-current", "date");
  });
});
