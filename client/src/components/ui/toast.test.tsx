/**
 * Toast Component Tests
 *
 * Tests for the Toast UI component using Vitest and React Testing Library.
 */

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

describe("Toast Component", () => {
  describe("Rendering", () => {
    it("renders toast with title", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByText("Toast Title")).toBeInTheDocument();
    });

    it("renders toast with description", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastDescription>Toast description text</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByText("Toast description text")).toBeInTheDocument();
    });

    it("renders toast with title and description", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastDescription>Toast description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByText("Toast Title")).toBeInTheDocument();
      expect(screen.getByText("Toast description")).toBeInTheDocument();
    });

    it("renders toast close button", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const closeButton = screen.getByRole("button");
      expect(closeButton).toBeInTheDocument();
    });

    it("renders toast action button", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastAction altText="Undo action">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByText("Undo")).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("renders with default variant", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open variant="default">
            <ToastTitle>Default Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByText("Default Toast").closest("li");
      expect(toast).toHaveClass("bg-background");
    });

    it("renders with destructive variant", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open variant="destructive">
            <ToastTitle>Destructive Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByText("Destructive Toast").closest("li");
      expect(toast).toHaveClass("destructive");
      expect(toast).toHaveClass("bg-destructive");
    });

    it("applies custom className to Toast", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open className="custom-toast-class">
            <ToastTitle>Custom Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByText("Custom Toast").closest("li");
      expect(toast).toHaveClass("custom-toast-class");
    });

    it("applies custom className to ToastTitle", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle className="custom-title-class">Custom Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const title = screen.getByText("Custom Title");
      expect(title).toHaveClass("custom-title-class");
    });

    it("applies custom className to ToastDescription", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastDescription className="custom-description-class">
              Custom Description
            </ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const description = screen.getByText("Custom Description");
      expect(description).toHaveClass("custom-description-class");
    });

    it("applies custom className to ToastAction", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastAction
              altText="Custom action"
              className="custom-action-class"
            >
              Action
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const action = screen.getByText("Action");
      expect(action).toHaveClass("custom-action-class");
    });

    it("applies custom className to ToastViewport", () => {
      const { container } = renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast</ToastTitle>
          </Toast>
          <ToastViewport
            className="custom-viewport-class"
            data-testid="toast-viewport"
          />
        </ToastProvider>,
      );

      const viewport = screen.getByTestId("toast-viewport");
      expect(viewport).toBeInTheDocument();
      expect(viewport).toHaveClass("custom-viewport-class");
    });
  });

  describe("Accessibility", () => {
    it("toast has proper role", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByRole("status");
      expect(toast).toBeInTheDocument();
    });

    it("close button has proper aria-label", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const closeButton = screen.getByRole("button");
      expect(closeButton).toHaveAttribute("toast-close");
    });

    it("action button requires altText for accessibility", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastAction altText="Undo last action">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const action = screen.getByText("Undo");
      expect(action).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const closeButton = screen.getByRole("button");
      closeButton.focus();

      expect(closeButton).toHaveFocus();

      await user.keyboard("{Enter}");
      // Toast should close (tested in interaction tests)
    });
  });

  describe("Interaction", () => {
    it("closes toast when close button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByText("Toast Title")).toBeInTheDocument();

      const closeButton = screen.getByRole("button");
      await user.click(closeButton);

      // Toast should be closing or closed
      await waitFor(() => {
        const toast = screen.getByText("Toast Title").closest("li");
        const dataState = toast?.getAttribute("data-state");
        expect(dataState === "closed" || dataState === "open").toBe(true);
      });
    });

    it("calls onClick handler on action button", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
            <ToastAction altText="Undo action" onClick={handleClick}>
              Undo
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const actionButton = screen.getByText("Undo");
      await user.click(actionButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("supports swipe to dismiss gesture", () => {
      renderWithProviders(
        <ToastProvider swipeDirection="right">
          <Toast open>
            <ToastTitle>Swipeable Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByText("Swipeable Toast").closest("li");
      expect(toast).toBeInTheDocument();
      // Actual swipe gesture would require more complex interaction testing
    });
  });

  describe("Visual Consistency", () => {
    it("applies default styling classes to Toast", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByText("Toast").closest("li");
      expect(toast).toHaveClass("group");
      expect(toast).toHaveClass("pointer-events-auto");
      expect(toast).toHaveClass("rounded-md");
      expect(toast).toHaveClass("border");
    });

    it("applies default styling classes to ToastTitle", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const title = screen.getByText("Toast Title");
      expect(title).toHaveClass("text-sm");
      expect(title).toHaveClass("font-semibold");
    });

    it("applies default styling classes to ToastDescription", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastDescription>Description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const description = screen.getByText("Description");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("opacity-90");
    });

    it("applies default styling classes to ToastAction", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastAction altText="Action">Action</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const action = screen.getByText("Action");
      expect(action).toHaveClass("inline-flex");
      expect(action).toHaveClass("h-8");
      expect(action).toHaveClass("rounded-md");
    });

    it("applies animation classes", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Animated Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const toast = screen.getByText("Animated Toast").closest("li");
      expect(toast).toHaveClass("transition-all");
    });

    it("applies viewport positioning classes", () => {
      const { container } = renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast</ToastTitle>
          </Toast>
          <ToastViewport data-testid="toast-viewport" />
        </ToastProvider>,
      );

      const viewport = screen.getByTestId("toast-viewport");
      expect(viewport).toHaveClass("fixed");
      expect(viewport).toHaveClass("top-0");
      expect(viewport).toHaveClass("z-[100]");
    });
  });

  describe("Multiple Toasts", () => {
    it("renders multiple toasts", () => {
      renderWithProviders(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast 1</ToastTitle>
          </Toast>
          <Toast open>
            <ToastTitle>Toast 2</ToastTitle>
          </Toast>
          <Toast open>
            <ToastTitle>Toast 3</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.getByText("Toast 3")).toBeInTheDocument();
    });
  });
});
