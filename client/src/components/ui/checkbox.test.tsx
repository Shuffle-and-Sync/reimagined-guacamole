/**
 * Checkbox Component Tests
 *
 * Tests for the Checkbox UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Checkbox } from "./checkbox";

describe("Checkbox Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderWithProviders(<Checkbox aria-label="Test checkbox" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      renderWithProviders(
        <Checkbox className="custom-class" aria-label="Test checkbox" />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("custom-class");
    });

    it("renders unchecked by default", () => {
      renderWithProviders(<Checkbox aria-label="Test checkbox" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("renders checked when defaultChecked is true", () => {
      renderWithProviders(
        <Checkbox defaultChecked aria-label="Test checkbox" />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("Interactions", () => {
    it("toggles checked state on click", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Checkbox aria-label="Test checkbox" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("calls onCheckedChange when clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Checkbox onCheckedChange={handleChange} aria-label="Test checkbox" />,
      );

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("calls onCheckedChange with false when unchecked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Checkbox
          defaultChecked
          onCheckedChange={handleChange}
          aria-label="Test checkbox"
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("does not toggle when disabled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Checkbox
          disabled
          onCheckedChange={handleChange}
          aria-label="Test checkbox"
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(handleChange).not.toHaveBeenCalled();
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("States", () => {
    it("can be disabled", () => {
      renderWithProviders(<Checkbox disabled aria-label="Test checkbox" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });

    it("applies disabled opacity class", () => {
      renderWithProviders(<Checkbox disabled aria-label="Test checkbox" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("disabled:opacity-50");
    });

    it("supports indeterminate state", () => {
      renderWithProviders(
        <Checkbox checked="indeterminate" aria-label="Test checkbox" />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("data-state", "indeterminate");
    });
  });

  describe("Controlled Component", () => {
    it("works as a controlled component", async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);

        return (
          <div>
            <Checkbox
              checked={checked}
              onCheckedChange={setChecked}
              aria-label="Test checkbox"
            />
            <span data-testid="status">
              {checked ? "Checked" : "Unchecked"}
            </span>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("status")).toHaveTextContent("Unchecked");

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(screen.getByTestId("status")).toHaveTextContent("Checked");
    });

    it("respects controlled checked state", () => {
      renderWithProviders(
        <Checkbox checked={true} aria-label="Test checkbox" />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("Accessibility", () => {
    it("has proper role", () => {
      renderWithProviders(<Checkbox aria-label="Test checkbox" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      renderWithProviders(<Checkbox aria-label="Accept terms" />);
      expect(screen.getByLabelText("Accept terms")).toBeInTheDocument();
    });

    it("supports id for label association", () => {
      renderWithProviders(
        <div>
          <Checkbox id="terms-checkbox" />
          <label htmlFor="terms-checkbox">Accept Terms</label>
        </div>,
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("id", "terms-checkbox");
    });

    it("forwards additional HTML attributes", () => {
      renderWithProviders(
        <Checkbox data-testid="custom-checkbox" aria-label="Test" />,
      );
      expect(screen.getByTestId("custom-checkbox")).toBeInTheDocument();
    });
  });
});
