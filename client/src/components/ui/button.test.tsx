/**
 * Button Component Tests
 *
 * Tests for the Button UI component using Vitest and React Testing Library.
 */

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Button } from "./button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("renders with default props", () => {
      renderWithProviders(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("renders with custom text", () => {
      renderWithProviders(<Button>Custom Button Text</Button>);
      expect(screen.getByText("Custom Button Text")).toBeInTheDocument();
    });

    it("renders as a button element by default", () => {
      renderWithProviders(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: /click me/i });
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Variants", () => {
    it("renders default variant", () => {
      renderWithProviders(<Button variant="default">Default</Button>);
      const button = screen.getByText("Default");
      expect(button).toHaveClass("bg-primary");
    });

    it("renders destructive variant", () => {
      renderWithProviders(<Button variant="destructive">Delete</Button>);
      const button = screen.getByText("Delete");
      expect(button).toHaveClass("bg-destructive");
    });

    it("renders outline variant", () => {
      renderWithProviders(<Button variant="outline">Outline</Button>);
      const button = screen.getByText("Outline");
      expect(button).toHaveClass("border");
    });

    it("renders secondary variant", () => {
      renderWithProviders(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByText("Secondary");
      expect(button).toHaveClass("bg-secondary");
    });

    it("renders ghost variant", () => {
      renderWithProviders(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByText("Ghost");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("renders link variant", () => {
      renderWithProviders(<Button variant="link">Link</Button>);
      const button = screen.getByText("Link");
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("renders default size", () => {
      renderWithProviders(<Button size="default">Default Size</Button>);
      const button = screen.getByText("Default Size");
      expect(button).toHaveClass("h-10");
    });

    it("renders small size", () => {
      renderWithProviders(<Button size="sm">Small</Button>);
      const button = screen.getByText("Small");
      expect(button).toHaveClass("h-9");
    });

    it("renders large size", () => {
      renderWithProviders(<Button size="lg">Large</Button>);
      const button = screen.getByText("Large");
      expect(button).toHaveClass("h-11");
    });

    it("renders icon size", () => {
      renderWithProviders(
        <Button size="icon" aria-label="Icon button">
          X
        </Button>,
      );
      const button = screen.getByLabelText("Icon button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
    });
  });

  describe("Interactions", () => {
    it("handles click events", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles multiple clicks", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );

      const button = screen.getByRole("button", { name: /disabled/i });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("States", () => {
    it("can be disabled", () => {
      renderWithProviders(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button", { name: /disabled/i });
      expect(button).toBeDisabled();
    });

    it("applies disabled opacity class", () => {
      renderWithProviders(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button", { name: /disabled/i });
      expect(button).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Accessibility", () => {
    it("has proper role", () => {
      renderWithProviders(<Button>Accessible Button</Button>);
      expect(
        screen.getByRole("button", { name: /accessible button/i }),
      ).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      renderWithProviders(<Button aria-label="Custom label">Icon</Button>);
      expect(screen.getByLabelText("Custom label")).toBeInTheDocument();
    });

    it("supports custom className", () => {
      renderWithProviders(
        <Button className="custom-class">Custom Class</Button>,
      );
      const button = screen.getByText("Custom Class");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Custom Props", () => {
    it("forwards additional HTML attributes", () => {
      renderWithProviders(
        <Button data-testid="custom-button" type="submit">
          Submit
        </Button>,
      );
      const button = screen.getByTestId("custom-button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("supports type attribute", () => {
      renderWithProviders(<Button type="button">Button Type</Button>);
      const button = screen.getByText("Button Type");
      expect(button).toHaveAttribute("type", "button");
    });
  });
});
