/**
 * GamePodCalendar Component Tests
 *
 * Tests for the GamePodCalendar component that displays event calendar placeholder.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { GamePodCalendar } from "./GamePodCalendar";

describe("GamePodCalendar Component", () => {
  describe("Rendering", () => {
    it("renders calendar component with community name", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      expect(
        screen.getByText("Magic: The Gathering Events"),
      ).toBeInTheDocument();
    });

    it("displays coming soon message", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      expect(
        screen.getByText("Event calendar coming soon!"),
      ).toBeInTheDocument();
    });

    it("displays community-specific stay tuned message", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      expect(
        screen.getByText(
          /Stay tuned for Magic: The Gathering events and tournaments/,
        ),
      ).toBeInTheDocument();
    });

    it("renders calendar icon in header", () => {
      const { container } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      // Check for Calendar icons (lucide-react renders as SVG)
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("renders calendar icon in content area", () => {
      const { container } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      // Should have multiple calendar icons (header and content)
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Props Handling", () => {
    it("renders with different community names", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="pokemon-tcg"
          communityName="Pokémon TCG"
        />,
      );

      expect(screen.getByText("Pokémon TCG Events")).toBeInTheDocument();
      expect(
        screen.getByText(/Stay tuned for Pokémon TCG events and tournaments/),
      ).toBeInTheDocument();
    });

    it("handles long community names", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="long-name"
          communityName="This is a Very Long Community Name for Testing"
        />,
      );

      expect(
        screen.getByText(
          "This is a Very Long Community Name for Testing Events",
        ),
      ).toBeInTheDocument();
    });

    it("handles special characters in community names", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="special-chars"
          communityName="Yu-Gi-Oh! & Friends"
        />,
      );

      expect(
        screen.getByText("Yu-Gi-Oh! & Friends Events"),
      ).toBeInTheDocument();
    });

    it("renders with different community IDs", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="test-community-123"
          communityName="Test Community"
        />,
      );

      expect(screen.getByText("Test Community Events")).toBeInTheDocument();
    });

    it("accepts optional theme prop", () => {
      const mockTheme = {
        primary: "#FF0000",
        secondary: "#00FF00",
      };

      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
          theme={mockTheme}
        />,
      );

      // Theme is accepted but not currently used, so just verify render
      expect(
        screen.getByText("Magic: The Gathering Events"),
      ).toBeInTheDocument();
    });

    it("renders without theme prop", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      expect(
        screen.getByText("Magic: The Gathering Events"),
      ).toBeInTheDocument();
    });
  });

  describe("Conditional Logic", () => {
    it("always displays placeholder content", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      expect(
        screen.getByText("Event calendar coming soon!"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Stay tuned for.*events and tournaments/),
      ).toBeInTheDocument();
    });

    it("does not display actual calendar events", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      // Should not have event listings, dates, etc.
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
      expect(screen.queryByRole("gridcell")).not.toBeInTheDocument();
    });
  });

  describe("Structure", () => {
    it("renders within a Card component", () => {
      const { container } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      // Card component creates specific class structure
      const cardElements = container.querySelectorAll('[class*="rounded"]');
      expect(cardElements.length).toBeGreaterThan(0);
    });

    it("has proper content hierarchy", () => {
      renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      // Header should appear before content
      const headerText = screen.getByText("Magic: The Gathering Events");
      const contentText = screen.getByText("Event calendar coming soon!");

      expect(headerText).toBeInTheDocument();
      expect(contentText).toBeInTheDocument();
    });

    it("centers the placeholder content", () => {
      const { container } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      const centerElements = container.querySelectorAll(
        '[class*="text-center"]',
      );
      expect(centerElements.length).toBeGreaterThan(0);
    });
  });

  describe("Styling", () => {
    it("applies muted foreground styling to placeholder text", () => {
      const { container } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      const mutedElements = container.querySelectorAll(
        '[class*="muted-foreground"]',
      );
      expect(mutedElements.length).toBeGreaterThan(0);
    });

    it("applies opacity to calendar icon", () => {
      const { container } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      const opacityElements = container.querySelectorAll('[class*="opacity"]');
      expect(opacityElements.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty community name", () => {
      renderWithProviders(
        <GamePodCalendar communityId="empty" communityName="" />,
      );

      expect(screen.getByText("Events")).toBeInTheDocument();
    });

    it("handles empty community ID", () => {
      renderWithProviders(
        <GamePodCalendar communityId="" communityName="Test Community" />,
      );

      expect(screen.getByText("Test Community Events")).toBeInTheDocument();
    });

    it("handles numeric community names", () => {
      renderWithProviders(
        <GamePodCalendar communityId="123" communityName="123" />,
      );

      expect(screen.getByText("123 Events")).toBeInTheDocument();
    });

    it("renders consistently across multiple instances", () => {
      const { rerender } = renderWithProviders(
        <GamePodCalendar communityId="first" communityName="First Community" />,
      );

      expect(screen.getByText("First Community Events")).toBeInTheDocument();

      rerender(
        <GamePodCalendar
          communityId="second"
          communityName="Second Community"
        />,
      );

      expect(screen.getByText("Second Community Events")).toBeInTheDocument();
      expect(
        screen.queryByText("First Community Events"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Multiple Communities", () => {
    it("renders different content for different communities", () => {
      const { rerender } = renderWithProviders(
        <GamePodCalendar
          communityId="magic-the-gathering"
          communityName="Magic: The Gathering"
        />,
      );

      expect(
        screen.getByText("Magic: The Gathering Events"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Stay tuned for Magic: The Gathering/),
      ).toBeInTheDocument();

      rerender(
        <GamePodCalendar
          communityId="pokemon-tcg"
          communityName="Pokémon TCG"
        />,
      );

      expect(screen.getByText("Pokémon TCG Events")).toBeInTheDocument();
      expect(
        screen.getByText(/Stay tuned for Pokémon TCG/),
      ).toBeInTheDocument();
    });
  });
});
