/**
 * Switch Component Tests
 *
 * Tests for the Switch UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Switch } from "./switch";

describe("Switch Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderWithProviders(<Switch aria-label="Test switch" />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      renderWithProviders(
        <Switch className="custom-class" aria-label="Test switch" />,
      );
      const switchElement = screen.getByRole("switch");
      expect(switchElement).toHaveClass("custom-class");
    });

    it("renders unchecked by default", () => {
      renderWithProviders(<Switch aria-label="Test switch" />);
      const switchElement = screen.getByRole("switch");
      expect(switchElement).not.toBeChecked();
    });

    it("renders checked when defaultChecked is true", () => {
      renderWithProviders(<Switch defaultChecked aria-label="Test switch" />);
      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeChecked();
    });
  });

  describe("Interactions", () => {
    it("toggles checked state on click", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Switch aria-label="Test switch" />);

      const switchElement = screen.getByRole("switch");
      expect(switchElement).not.toBeChecked();

      await user.click(switchElement);
      expect(switchElement).toBeChecked();

      await user.click(switchElement);
      expect(switchElement).not.toBeChecked();
    });

    it("calls onCheckedChange when clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Switch onCheckedChange={handleChange} aria-label="Test switch" />,
      );

      const switchElement = screen.getByRole("switch");
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("calls onCheckedChange with false when turned off", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Switch
          defaultChecked
          onCheckedChange={handleChange}
          aria-label="Test switch"
        />,
      );

      const switchElement = screen.getByRole("switch");
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("does not toggle when disabled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Switch
          disabled
          onCheckedChange={handleChange}
          aria-label="Test switch"
        />,
      );

      const switchElement = screen.getByRole("switch");
      await user.click(switchElement);

      expect(handleChange).not.toHaveBeenCalled();
      expect(switchElement).not.toBeChecked();
    });
  });

  describe("States", () => {
    it("can be disabled", () => {
      renderWithProviders(<Switch disabled aria-label="Test switch" />);
      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeDisabled();
    });

    it("applies disabled cursor class", () => {
      renderWithProviders(<Switch disabled aria-label="Test switch" />);
      const switchElement = screen.getByRole("switch");
      expect(switchElement).toHaveClass("disabled:cursor-not-allowed");
    });
  });

  describe("Controlled Component", () => {
    it("works as a controlled component", async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false);

        return (
          <div>
            <Switch
              checked={checked}
              onCheckedChange={setChecked}
              aria-label="Test switch"
            />
            <span data-testid="status">{checked ? "On" : "Off"}</span>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("status")).toHaveTextContent("Off");

      const switchElement = screen.getByRole("switch");
      await user.click(switchElement);

      expect(screen.getByTestId("status")).toHaveTextContent("On");
    });

    it("respects controlled checked state", () => {
      renderWithProviders(<Switch checked={true} aria-label="Test switch" />);
      const switchElement = screen.getByRole("switch");
      expect(switchElement).toBeChecked();
    });
  });

  describe("Accessibility", () => {
    it("has proper role", () => {
      renderWithProviders(<Switch aria-label="Test switch" />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      renderWithProviders(<Switch aria-label="Enable notifications" />);
      expect(screen.getByLabelText("Enable notifications")).toBeInTheDocument();
    });

    it("supports id for label association", () => {
      renderWithProviders(
        <div>
          <Switch id="notifications-switch" />
          <label htmlFor="notifications-switch">Enable Notifications</label>
        </div>,
      );

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toHaveAttribute("id", "notifications-switch");
    });

    it("forwards additional HTML attributes", () => {
      renderWithProviders(
        <Switch data-testid="custom-switch" aria-label="Test" />,
      );
      expect(screen.getByTestId("custom-switch")).toBeInTheDocument();
    });

    it("indicates checked state to screen readers", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Switch aria-label="Test switch" />);

      const switchElement = screen.getByRole("switch");
      expect(switchElement).toHaveAttribute("aria-checked", "false");

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute("aria-checked", "true");
    });
  });
});
