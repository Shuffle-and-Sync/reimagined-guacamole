/**
 * AlertDialog Component Tests
 *
 * Tests for the AlertDialog UI component using Vitest and React Testing Library.
 */

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

describe("AlertDialog Component", () => {
  describe("Rendering", () => {
    it("renders trigger button", () => {
      renderWithProviders(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      expect(screen.getByText("Open Dialog")).toBeInTheDocument();
    });

    it("renders dialog content when open", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
        expect(
          screen.getByText("This action cannot be undone."),
        ).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
        expect(screen.getByText("Continue")).toBeInTheDocument();
      });
    });

    it("opens dialog on trigger click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();

      const trigger = screen.getByText("Open Dialog");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      });
    });
  });

  describe("Props Validation", () => {
    it("renders with custom className on AlertDialogContent", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent className="custom-content-class">
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const content = screen.getByText("Title").closest("div")?.parentElement;
        expect(content).toHaveClass("custom-content-class");
      });
    });

    it("renders with custom className on AlertDialogTitle", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="custom-title-class">
                Title
              </AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const title = screen.getByText("Title");
        expect(title).toHaveClass("custom-title-class");
      });
    });

    it("renders with custom className on AlertDialogDescription", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogDescription className="custom-description-class">
                Description
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const description = screen.getByText("Description");
        expect(description).toHaveClass("custom-description-class");
      });
    });

    it("renders with custom className on AlertDialogHeader", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header-class">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const header = screen.getByText("Title").parentElement;
        expect(header).toHaveClass("custom-header-class");
      });
    });

    it("renders with custom className on AlertDialogFooter", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="custom-footer-class">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const footer = screen.getByText("Cancel").parentElement;
        expect(footer).toHaveClass("custom-footer-class");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog role", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("title has proper heading role", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const title = screen.getByText("Are you sure?");
        expect(title).toBeInTheDocument();
      });
    });

    it("action button is accessible", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const action = screen.getByRole("button", { name: /continue/i });
        expect(action).toBeInTheDocument();
      });
    });

    it("cancel button is accessible", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const cancel = screen.getByRole("button", { name: /cancel/i });
        expect(cancel).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation with Escape", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
      });
    });
  });

  describe("Interaction", () => {
    it("closes on cancel button click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
      });
    });

    it("closes on action button click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      });

      const actionButton = screen.getByRole("button", { name: /continue/i });
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
      });
    });

    it("calls onClick handler on action button", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleClick}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      });

      const actionButton = screen.getByRole("button", { name: /continue/i });
      await user.click(actionButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick handler on cancel button", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClick}>
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Visual Consistency", () => {
    it("applies default styling classes to content", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const content = screen.getByText("Title").closest("div")?.parentElement;
        expect(content).toHaveClass("fixed");
        expect(content).toHaveClass("z-50");
        expect(content).toHaveClass("bg-background");
      });
    });

    it("applies default styling classes to title", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const title = screen.getByText("Title");
        expect(title).toHaveClass("text-lg");
        expect(title).toHaveClass("font-semibold");
      });
    });

    it("applies default styling classes to description", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const description = screen.getByText("Description");
        expect(description).toHaveClass("text-sm");
        expect(description).toHaveClass("text-muted-foreground");
      });
    });

    it("applies button variant to action button", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogFooter>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const action = screen.getByRole("button", { name: /continue/i });
        expect(action).toBeInTheDocument();
      });
    });

    it("applies outline variant to cancel button", async () => {
      renderWithProviders(
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );

      await waitFor(() => {
        const cancel = screen.getByRole("button", { name: /cancel/i });
        expect(cancel).toBeInTheDocument();
      });
    });
  });
});
