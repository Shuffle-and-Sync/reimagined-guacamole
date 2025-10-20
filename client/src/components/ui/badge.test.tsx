/**
 * Badge Component Tests
 *
 * Tests for the Badge UI component using Vitest and React Testing Library.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { Badge } from "./badge";

describe("Badge Component", () => {
  describe("Rendering", () => {
    it("renders with default props", () => {
      renderWithProviders(<Badge>Default Badge</Badge>);
      expect(screen.getByText("Default Badge")).toBeInTheDocument();
    });

    it("renders with custom text", () => {
      renderWithProviders(<Badge>Custom Text</Badge>);
      expect(screen.getByText("Custom Text")).toBeInTheDocument();
    });

    it("renders as a div element", () => {
      renderWithProviders(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge.tagName).toBe("DIV");
    });
  });

  describe("Variants", () => {
    it("renders default variant", () => {
      renderWithProviders(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("bg-primary");
      expect(badge).toHaveClass("border-transparent");
    });

    it("renders secondary variant", () => {
      renderWithProviders(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText("Secondary");
      expect(badge).toHaveClass("bg-secondary");
      expect(badge).toHaveClass("border-transparent");
    });

    it("renders destructive variant", () => {
      renderWithProviders(<Badge variant="destructive">Destructive</Badge>);
      const badge = screen.getByText("Destructive");
      expect(badge).toHaveClass("bg-destructive");
      expect(badge).toHaveClass("border-transparent");
    });

    it("renders outline variant", () => {
      renderWithProviders(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText("Outline");
      expect(badge).toHaveClass("text-foreground");
    });
  });

  describe("Styling", () => {
    it("applies default styling classes", () => {
      renderWithProviders(<Badge>Styled Badge</Badge>);
      const badge = screen.getByText("Styled Badge");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("items-center");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("text-xs");
      expect(badge).toHaveClass("font-semibold");
    });

    it("supports custom className", () => {
      renderWithProviders(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText("Custom");
      expect(badge).toHaveClass("custom-class");
    });

    it("preserves default classes when custom className is added", () => {
      renderWithProviders(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText("Custom");
      expect(badge).toHaveClass("custom-class");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("inline-flex");
    });
  });

  describe("Content", () => {
    it("renders text content", () => {
      renderWithProviders(<Badge>Text Content</Badge>);
      expect(screen.getByText("Text Content")).toBeInTheDocument();
    });

    it("renders numeric content", () => {
      renderWithProviders(<Badge>42</Badge>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("renders with child elements", () => {
      renderWithProviders(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>,
      );
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("supports role attribute", () => {
      renderWithProviders(<Badge role="status">Status Badge</Badge>);
      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      renderWithProviders(<Badge aria-label="Notification count">5</Badge>);
      expect(screen.getByLabelText("Notification count")).toBeInTheDocument();
    });

    it("supports data-testid", () => {
      renderWithProviders(<Badge data-testid="custom-badge">Test</Badge>);
      expect(screen.getByTestId("custom-badge")).toBeInTheDocument();
    });
  });

  describe("Focus", () => {
    it("has focus ring classes", () => {
      renderWithProviders(<Badge>Focusable</Badge>);
      const badge = screen.getByText("Focusable");
      expect(badge).toHaveClass("focus:outline-none");
      expect(badge).toHaveClass("focus:ring-2");
      expect(badge).toHaveClass("focus:ring-ring");
    });
  });

  describe("Use Cases", () => {
    it("renders as status indicator", () => {
      renderWithProviders(
        <Badge variant="secondary" role="status">
          Active
        </Badge>,
      );
      expect(screen.getByRole("status")).toHaveTextContent("Active");
    });

    it("renders as count badge", () => {
      renderWithProviders(<Badge variant="destructive">99+</Badge>);
      expect(screen.getByText("99+")).toBeInTheDocument();
    });

    it("renders as category tag", () => {
      renderWithProviders(<Badge variant="outline">Tournament</Badge>);
      expect(screen.getByText("Tournament")).toBeInTheDocument();
    });

    it("renders multiple badges together", () => {
      renderWithProviders(
        <div>
          <Badge variant="default">Magic</Badge>
          <Badge variant="secondary">Pokemon</Badge>
          <Badge variant="outline">Yu-Gi-Oh</Badge>
        </div>,
      );
      expect(screen.getByText("Magic")).toBeInTheDocument();
      expect(screen.getByText("Pokemon")).toBeInTheDocument();
      expect(screen.getByText("Yu-Gi-Oh")).toBeInTheDocument();
    });
  });

  describe("Custom Props", () => {
    it("forwards HTML attributes", () => {
      renderWithProviders(
        <Badge data-category="tcg" title="Trading Card Game">
          TCG
        </Badge>,
      );
      const badge = screen.getByText("TCG");
      expect(badge).toHaveAttribute("data-category", "tcg");
      expect(badge).toHaveAttribute("title", "Trading Card Game");
    });
  });
});
