/**
 * FAQ Page Integration Tests
 *
 * Tests for the FAQ page using Vitest and React Testing Library.
 * Demonstrates page-level testing with components and user interactions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import FAQ from "./faq";

// Mock window.location
const mockLocationHref = vi.fn();
const locationHrefGetter = vi.fn(() => "");
Object.defineProperty(window, "location", {
  value: {
    get href() {
      return locationHrefGetter();
    },
    set href(value) {
      mockLocationHref(value);
    },
  },
  writable: true,
});

describe("FAQ Page", () => {
  beforeEach(() => {
    mockLocationHref.mockClear();
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<FAQ />);
      expect(
        screen.getByText("Frequently Asked Questions"),
      ).toBeInTheDocument();
    });

    it("displays coming soon badge", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    });

    it("shows page description", () => {
      renderWithProviders(<FAQ />);
      expect(
        screen.getByText(
          /Get instant answers to the most common questions about Shuffle & Sync/i,
        ),
      ).toBeInTheDocument();
    });

    it("displays comprehensive Q&A database card", () => {
      renderWithProviders(<FAQ />);
      expect(
        screen.getByText("Comprehensive Q&A Database"),
      ).toBeInTheDocument();
    });
  });

  describe("Content Sections", () => {
    it("displays pricing & billing topic", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Pricing & billing")).toBeInTheDocument();
    });

    it("displays privacy & security topic", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Privacy & security")).toBeInTheDocument();
    });

    it("displays gaming setup guides topic", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Gaming setup guides")).toBeInTheDocument();
    });

    it("displays platform integrations topic", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Platform integrations")).toBeInTheDocument();
    });

    it("displays troubleshooting topic", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Troubleshooting")).toBeInTheDocument();
    });

    it("displays community guidelines topic", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByText("Community guidelines")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("renders back to home button", () => {
      renderWithProviders(<FAQ />);
      const button = screen.getByTestId("button-back-home");
      expect(button).toBeInTheDocument();
    });

    it("navigates to home when back button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<FAQ />);

      const button = screen.getByTestId("button-back-home");
      await user.click(button);

      expect(mockLocationHref).toHaveBeenCalledWith("/");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      renderWithProviders(<FAQ />);

      // Main heading should be h1
      const mainHeading = screen.getByText("Frequently Asked Questions");
      expect(mainHeading.tagName).toBe("H1");
    });

    it("button has proper test id for accessibility", () => {
      renderWithProviders(<FAQ />);
      expect(screen.getByTestId("button-back-home")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses proper container classes", () => {
      const { container } = renderWithProviders(<FAQ />);
      const main = container.querySelector("main");
      expect(main).toHaveClass("container");
      expect(main).toHaveClass("mx-auto");
    });

    it("has proper background styling", () => {
      const { container } = renderWithProviders(<FAQ />);
      const wrapper = container.querySelector(".min-h-screen");
      expect(wrapper).toHaveClass("bg-background");
    });
  });

  describe("Components Integration", () => {
    it("renders Card component", () => {
      renderWithProviders(<FAQ />);
      // Card component is present if CardTitle is rendered
      expect(
        screen.getByText("Comprehensive Q&A Database"),
      ).toBeInTheDocument();
    });

    it("renders Badge component", () => {
      renderWithProviders(<FAQ />);
      const badge = screen.getByText("Coming Soon");
      expect(badge).toBeInTheDocument();
    });

    it("renders Button component", () => {
      renderWithProviders(<FAQ />);
      const button = screen.getByTestId("button-back-home");
      expect(button).toBeInTheDocument();
    });
  });
});
