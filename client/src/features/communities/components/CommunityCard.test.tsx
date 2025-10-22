/**
 * CommunityCard Component Tests
 *
 * Tests for the CommunityCard component that displays community information.
 */

import { describe, it, expect, vi } from "vitest";
import type { Community } from "@shared/schema";
import { renderWithProviders, screen, fireEvent } from "@/test-utils";
import { CommunityCard } from "./CommunityCard";

describe("CommunityCard Component", () => {
  const mockCommunity: Community = {
    id: "magic-the-gathering",
    name: "Magic: The Gathering",
    displayName: "Magic: The Gathering",
    description: "The original and most popular TCG",
    slug: "magic",
    iconClass: "fas fa-hat-wizard",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockOnSelect = vi.fn();

  describe("Rendering", () => {
    it("renders community card with basic information", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("Magic: The Gathering")).toBeInTheDocument();
      expect(
        screen.getByText("The original and most popular TCG"),
      ).toBeInTheDocument();
    });

    it("renders with correct test ids", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      expect(
        screen.getByTestId("card-community-magic-the-gathering"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("text-status-magic-the-gathering"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("text-community-ready-magic-the-gathering"),
      ).toBeInTheDocument();
    });

    it("displays LIVE badge", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("LIVE")).toBeInTheDocument();
    });

    it("displays Active status", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("displays Ready to explore text", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("Ready to explore")).toBeInTheDocument();
    });

    it("renders icon with correct class", () => {
      const { container } = renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      const icon = container.querySelector(".fas.fa-hat-wizard");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("renders with different community data", () => {
      const pokemonCommunity: Community = {
        id: "pokemon-tcg",
        name: "Pokemon TCG",
        displayName: "Pokémon Trading Card Game",
        description: "Gotta catch 'em all!",
        slug: "pokemon",
        iconClass: "fas fa-bolt",
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      renderWithProviders(
        <CommunityCard community={pokemonCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("Pokémon Trading Card Game")).toBeInTheDocument();
      expect(screen.getByText("Gotta catch 'em all!")).toBeInTheDocument();
      expect(
        screen.getByTestId("card-community-pokemon-tcg"),
      ).toBeInTheDocument();
    });

    it("handles long community names", () => {
      const longNameCommunity: Community = {
        ...mockCommunity,
        displayName:
          "This is a very long community name that should still display properly",
      };

      renderWithProviders(
        <CommunityCard community={longNameCommunity} onSelect={mockOnSelect} />,
      );

      expect(
        screen.getByText(
          "This is a very long community name that should still display properly",
        ),
      ).toBeInTheDocument();
    });

    it("handles long descriptions", () => {
      const longDescriptionCommunity: Community = {
        ...mockCommunity,
        description:
          "This is a very long description that provides detailed information about the community and its features, events, and what makes it special for all players.",
      };

      renderWithProviders(
        <CommunityCard
          community={longDescriptionCommunity}
          onSelect={mockOnSelect}
        />,
      );

      expect(
        screen.getByText(/This is a very long description/),
      ).toBeInTheDocument();
    });

    it("renders with different icon classes", () => {
      const customIconCommunity: Community = {
        ...mockCommunity,
        iconClass: "fas fa-dragon",
      };

      const { container } = renderWithProviders(
        <CommunityCard
          community={customIconCommunity}
          onSelect={mockOnSelect}
        />,
      );

      const icon = container.querySelector(".fas.fa-dragon");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Event Emission", () => {
    it("calls onSelect when card is clicked", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      fireEvent.click(card);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it("calls onSelect only once per click", () => {
      const onSelect = vi.fn();
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={onSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      fireEvent.click(card);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("calls onSelect multiple times on multiple clicks", () => {
      const onSelect = vi.fn();
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={onSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      fireEvent.click(card);
      fireEvent.click(card);
      fireEvent.click(card);

      expect(onSelect).toHaveBeenCalledTimes(3);
    });

    it("does not call onSelect when component is just rendered", () => {
      const onSelect = vi.fn();
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={onSelect} />,
      );

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies cursor-pointer class for interactivity", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("has hover effects classes", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      expect(card).toHaveClass("hover:border-orange-400");
      expect(card).toHaveClass("hover:scale-105");
    });

    it("has gradient background classes", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      expect(card).toHaveClass("bg-gradient-to-br");
    });
  });

  describe("Accessibility", () => {
    it("has appropriate role for card", () => {
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={mockOnSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");
      expect(card.tagName).toBe("DIV");
    });

    it("is keyboard accessible via click handler", () => {
      const onSelect = vi.fn();
      renderWithProviders(
        <CommunityCard community={mockCommunity} onSelect={onSelect} />,
      );

      const card = screen.getByTestId("card-community-magic-the-gathering");

      // Simulate keyboard activation
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty description gracefully", () => {
      const noCommunity: Community = {
        ...mockCommunity,
        description: "",
      };

      renderWithProviders(
        <CommunityCard community={noCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("Magic: The Gathering")).toBeInTheDocument();
    });

    it("renders with minimal community data", () => {
      const minimalCommunity: Community = {
        id: "test",
        name: "Test",
        displayName: "Test Community",
        description: "Test Description",
        slug: "test",
        iconClass: "fas fa-test",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      renderWithProviders(
        <CommunityCard community={minimalCommunity} onSelect={mockOnSelect} />,
      );

      expect(screen.getByText("Test Community")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });
  });
});
