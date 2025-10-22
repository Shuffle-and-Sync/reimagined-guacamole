/**
 * Label Component Tests
 *
 * Tests for the Label UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Input } from "./input";
import { Label } from "./label";

describe("Label Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderWithProviders(<Label>Test Label</Label>);
      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      renderWithProviders(<Label className="custom-class">Test Label</Label>);
      const label = screen.getByText("Test Label");
      expect(label).toHaveClass("custom-class");
    });

    it("renders children content", () => {
      renderWithProviders(
        <Label>
          <span>Label with </span>
          <strong>bold text</strong>
        </Label>,
      );
      expect(screen.getByText("Label with")).toBeInTheDocument();
      expect(screen.getByText("bold text")).toBeInTheDocument();
    });
  });

  describe("Form Association", () => {
    it("associates with input using htmlFor", () => {
      renderWithProviders(
        <div>
          <Label htmlFor="test-input">Email</Label>
          <Input id="test-input" type="email" />
        </div>,
      );

      const label = screen.getByText("Email");
      const input = screen.getByRole("textbox");

      expect(label).toHaveAttribute("for", "test-input");
      expect(input).toHaveAttribute("id", "test-input");
    });

    it("clicking label focuses associated input", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <div>
          <Label htmlFor="clickable-input">Click me</Label>
          <Input id="clickable-input" />
        </div>,
      );

      const label = screen.getByText("Click me");
      const input = screen.getByRole("textbox");

      await user.click(label);

      expect(input).toHaveFocus();
    });
  });

  describe("Accessibility", () => {
    it("has correct role", () => {
      renderWithProviders(<Label>Accessible Label</Label>);
      // Label elements don't have a specific role, they're semantic HTML
      expect(screen.getByText("Accessible Label").tagName).toBe("LABEL");
    });

    it("supports custom props", () => {
      renderWithProviders(
        <Label data-testid="custom-label" data-custom="value">
          Test
        </Label>,
      );
      const label = screen.getByTestId("custom-label");
      expect(label).toHaveAttribute("data-custom", "value");
    });
  });

  describe("Styling", () => {
    it("applies base styles", () => {
      renderWithProviders(<Label>Styled Label</Label>);
      const label = screen.getByText("Styled Label");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("font-medium");
      expect(label).toHaveClass("leading-none");
    });

    it("applies peer-disabled styles", () => {
      renderWithProviders(<Label>Disabled Peer Label</Label>);
      const label = screen.getByText("Disabled Peer Label");
      expect(label).toHaveClass("peer-disabled:cursor-not-allowed");
      expect(label).toHaveClass("peer-disabled:opacity-70");
    });
  });

  describe("Common Use Cases", () => {
    it("works with required indicator", () => {
      renderWithProviders(
        <Label htmlFor="required-field">
          Password <span className="text-destructive">*</span>
        </Label>,
      );
      expect(screen.getByText("Password")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("works with helper text", () => {
      renderWithProviders(
        <div>
          <Label htmlFor="username">Username</Label>
          <span className="text-sm text-muted-foreground">
            Must be at least 3 characters
          </span>
        </div>,
      );
      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(
        screen.getByText("Must be at least 3 characters"),
      ).toBeInTheDocument();
    });
  });
});
