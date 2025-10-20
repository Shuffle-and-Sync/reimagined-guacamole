/**
 * Dialog Component Tests
 *
 * Tests for the Dialog UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

describe("Dialog Component", () => {
  describe("Rendering", () => {
    it("renders trigger button", () => {
      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      expect(
        screen.getByRole("button", { name: "Open Dialog" }),
      ).toBeInTheDocument();
    });

    it("does not render content initially", () => {
      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Dialog description text"),
      ).not.toBeInTheDocument();
    });

    it("renders content when open", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Dialog Title")).toBeInTheDocument();
        expect(screen.getByText("Dialog description text")).toBeInTheDocument();
      });
    });

    it("renders header, footer, and content sections", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
            <div>Main content</div>
            <DialogFooter>
              <Button>Cancel</Button>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Main content")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Cancel" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Confirm" }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Interactions", () => {
    it("opens dialog when trigger is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      });
    });

    it("closes dialog when close button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      // Open dialog
      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      });

      // Close dialog using the X button
      const closeButton = screen.getByRole("button", { name: "Close" });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
      });
    });

    it("closes dialog when DialogClose component is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      // Open dialog
      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      });

      // Close using Cancel button
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
      });
    });

    it("calls onOpenChange when dialog state changes", async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      renderWithProviders(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Controlled Component", () => {
    it("works as a controlled component", async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);

        return (
          <div>
            <Button onClick={() => setOpen(true)}>Open Controlled</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled Dialog</DialogTitle>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      expect(screen.queryByText("Controlled Dialog")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Open Controlled" }));

      await waitFor(() => {
        expect(screen.getByText("Controlled Dialog")).toBeInTheDocument();
      });
    });

    it("respects controlled open state", async () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogTrigger asChild>
            <Button>Trigger</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Always Open</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      // Should be open immediately without clicking
      await waitFor(() => {
        expect(screen.getByText("Always Open")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog role", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("has accessible title", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accessible Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAccessibleName("Accessible Title");
      });
    });

    it("has accessible description", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>
                This is the dialog description
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAccessibleDescription(
          "This is the dialog description",
        );
      });
    });

    it("includes screen reader text for close button", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Close" }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className to content", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent className="custom-dialog-class">
            <DialogHeader>
              <DialogTitle>Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveClass("custom-dialog-class");
      });
    });
  });
});
