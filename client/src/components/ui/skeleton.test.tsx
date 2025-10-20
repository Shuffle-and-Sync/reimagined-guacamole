/**
 * Skeleton Component Tests
 *
 * Tests for the Skeleton UI component using Vitest and React Testing Library.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { Skeleton } from "./skeleton";

describe("Skeleton Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Skeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders as a div element", () => {
      const { container } = renderWithProviders(<Skeleton />);
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("renders with test id", () => {
      renderWithProviders(<Skeleton data-testid="skeleton-loader" />);
      expect(screen.getByTestId("skeleton-loader")).toBeInTheDocument();
    });

    it("renders multiple skeletons", () => {
      renderWithProviders(
        <div>
          <Skeleton data-testid="skeleton-1" />
          <Skeleton data-testid="skeleton-2" />
          <Skeleton data-testid="skeleton-3" />
        </div>,
      );

      expect(screen.getByTestId("skeleton-1")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-2")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-3")).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("applies custom className", () => {
      renderWithProviders(
        <Skeleton className="custom-skeleton-class" data-testid="skeleton" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("custom-skeleton-class");
    });

    it("merges custom className with default classes", () => {
      renderWithProviders(
        <Skeleton className="custom-class" data-testid="skeleton" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("custom-class");
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("rounded-md");
    });

    it("accepts custom width via className", () => {
      renderWithProviders(<Skeleton className="w-32" data-testid="skeleton" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("w-32");
    });

    it("accepts custom height via className", () => {
      renderWithProviders(<Skeleton className="h-8" data-testid="skeleton" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-8");
    });

    it("accepts both width and height via className", () => {
      renderWithProviders(
        <Skeleton className="w-48 h-12" data-testid="skeleton" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("w-48");
      expect(skeleton).toHaveClass("h-12");
    });

    it("forwards additional HTML attributes", () => {
      renderWithProviders(
        <Skeleton
          data-testid="skeleton"
          aria-label="Loading content"
          role="status"
        />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("aria-label", "Loading content");
      expect(skeleton).toHaveAttribute("role", "status");
    });
  });

  describe("Accessibility", () => {
    it("can have role attribute", () => {
      renderWithProviders(<Skeleton data-testid="skeleton" role="status" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("role", "status");
    });

    it("can have aria-label for screen readers", () => {
      renderWithProviders(
        <Skeleton data-testid="skeleton" aria-label="Loading user profile" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("aria-label", "Loading user profile");
    });

    it("can have aria-busy attribute", () => {
      renderWithProviders(<Skeleton data-testid="skeleton" aria-busy="true" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });

    it("supports aria-live for dynamic updates", () => {
      renderWithProviders(
        <Skeleton data-testid="skeleton" aria-live="polite" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Visual Consistency", () => {
    it("applies default animation class", () => {
      renderWithProviders(<Skeleton data-testid="skeleton" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
    });

    it("applies default rounded corners", () => {
      renderWithProviders(<Skeleton data-testid="skeleton" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-md");
    });

    it("applies default background color", () => {
      renderWithProviders(<Skeleton data-testid="skeleton" />);

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("bg-muted");
    });

    it("can override border radius", () => {
      renderWithProviders(
        <Skeleton className="rounded-full" data-testid="skeleton" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("can override background color", () => {
      renderWithProviders(
        <Skeleton className="bg-gray-200" data-testid="skeleton" />,
      );

      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("bg-gray-200");
    });
  });

  describe("Common Use Cases", () => {
    it("renders circular avatar skeleton", () => {
      renderWithProviders(
        <Skeleton
          className="h-12 w-12 rounded-full"
          data-testid="avatar-skeleton"
        />,
      );

      const skeleton = screen.getByTestId("avatar-skeleton");
      expect(skeleton).toHaveClass("h-12");
      expect(skeleton).toHaveClass("w-12");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("renders text line skeleton", () => {
      renderWithProviders(
        <Skeleton className="h-4 w-full" data-testid="text-skeleton" />,
      );

      const skeleton = screen.getByTestId("text-skeleton");
      expect(skeleton).toHaveClass("h-4");
      expect(skeleton).toHaveClass("w-full");
    });

    it("renders card skeleton", () => {
      renderWithProviders(
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" data-testid="image-skeleton" />
          <Skeleton className="h-4 w-3/4" data-testid="title-skeleton" />
          <Skeleton className="h-4 w-1/2" data-testid="subtitle-skeleton" />
        </div>,
      );

      expect(screen.getByTestId("image-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("title-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("subtitle-skeleton")).toBeInTheDocument();
    });

    it("renders list skeleton", () => {
      renderWithProviders(
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-10 w-full"
              data-testid={`list-item-${i}`}
            />
          ))}
        </div>,
      );

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`list-item-${i}`)).toBeInTheDocument();
      }
    });

    it("renders table skeleton", () => {
      renderWithProviders(
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" data-testid="header-skeleton" />
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-12 w-full"
              data-testid={`row-${i}`}
            />
          ))}
        </div>,
      );

      expect(screen.getByTestId("header-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("row-1")).toBeInTheDocument();
      expect(screen.getByTestId("row-2")).toBeInTheDocument();
      expect(screen.getByTestId("row-3")).toBeInTheDocument();
    });
  });

  describe("Composition", () => {
    it("can be composed with other elements", () => {
      renderWithProviders(
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" data-testid="avatar" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" data-testid="name" />
            <Skeleton className="h-4 w-1/2" data-testid="email" />
          </div>
        </div>,
      );

      expect(screen.getByTestId("avatar")).toBeInTheDocument();
      expect(screen.getByTestId("name")).toBeInTheDocument();
      expect(screen.getByTestId("email")).toBeInTheDocument();
    });

    it("works inside a card layout", () => {
      renderWithProviders(
        <div className="border rounded-lg p-4">
          <Skeleton className="h-6 w-2/3 mb-4" data-testid="card-title" />
          <Skeleton className="h-4 w-full mb-2" data-testid="card-line1" />
          <Skeleton className="h-4 w-full mb-2" data-testid="card-line2" />
          <Skeleton className="h-4 w-4/5" data-testid="card-line3" />
        </div>,
      );

      expect(screen.getByTestId("card-title")).toBeInTheDocument();
      expect(screen.getByTestId("card-line1")).toBeInTheDocument();
      expect(screen.getByTestId("card-line2")).toBeInTheDocument();
      expect(screen.getByTestId("card-line3")).toBeInTheDocument();
    });
  });
});
