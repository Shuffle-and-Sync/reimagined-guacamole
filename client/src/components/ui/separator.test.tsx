/**
 * Separator Component Tests
 *
 * Tests for the Separator UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { Separator } from "./separator";

describe("Separator Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderWithProviders(<Separator data-testid="separator" />);
      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      renderWithProviders(
        <Separator className="custom-class" data-testid="separator" />,
      );
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("custom-class");
    });

    it("renders horizontal separator by default", () => {
      renderWithProviders(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
    });
  });

  describe("Orientation", () => {
    it("renders horizontal separator", () => {
      renderWithProviders(
        <Separator orientation="horizontal" data-testid="separator" />,
      );
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
      expect(separator).toHaveClass("h-[1px]");
      expect(separator).toHaveClass("w-full");
    });

    it("renders vertical separator", () => {
      renderWithProviders(
        <Separator orientation="vertical" data-testid="separator" />,
      );
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
      expect(separator).toHaveClass("h-full");
      expect(separator).toHaveClass("w-[1px]");
    });
  });

  describe("Accessibility", () => {
    it("is decorative by default", () => {
      renderWithProviders(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      // Decorative separators don't have role="separator"
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
    });

    it("can be non-decorative", () => {
      renderWithProviders(
        <Separator decorative={false} data-testid="separator" />,
      );
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("role", "separator");
    });

    it("has proper orientation attribute for vertical separator", () => {
      renderWithProviders(
        <Separator orientation="vertical" data-testid="separator" />,
      );
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
    });
  });

  describe("Styling", () => {
    it("applies base styles", () => {
      renderWithProviders(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("shrink-0");
      expect(separator).toHaveClass("bg-border");
    });
  });

  describe("Use Cases", () => {
    it("works as section divider", () => {
      renderWithProviders(
        <div>
          <div>Section 1</div>
          <Separator data-testid="section-separator" />
          <div>Section 2</div>
        </div>,
      );
      expect(screen.getByTestId("section-separator")).toBeInTheDocument();
      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
    });

    it("works in navigation menu", () => {
      renderWithProviders(
        <nav>
          <a href="#">Link 1</a>
          <Separator orientation="vertical" data-testid="nav-separator" />
          <a href="#">Link 2</a>
        </nav>,
      );
      expect(screen.getByTestId("nav-separator")).toBeInTheDocument();
    });

    it("works with custom spacing", () => {
      renderWithProviders(
        <div>
          <div>Content</div>
          <Separator className="my-4" data-testid="spaced-separator" />
          <div>More Content</div>
        </div>,
      );
      const separator = screen.getByTestId("spaced-separator");
      expect(separator).toHaveClass("my-4");
    });
  });
});
