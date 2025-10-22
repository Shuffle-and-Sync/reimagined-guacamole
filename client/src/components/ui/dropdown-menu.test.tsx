/**
 * Dropdown Menu Component Tests
 *
 * Tests for the Dropdown Menu UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("Dropdown Menu Component", () => {
  describe("Rendering", () => {
    it("renders trigger button", () => {
      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(
        screen.getByRole("button", { name: "Open Menu" }),
      ).toBeInTheDocument();
    });

    it("does not render menu content initially", () => {
      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
    });

    it("renders menu items when opened", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
        expect(screen.getByText("Item 3")).toBeInTheDocument();
      });
    });

    it("renders menu labels and separators", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Section 1</DropdownMenuLabel>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Section 2</DropdownMenuLabel>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Section 1")).toBeInTheDocument();
        expect(screen.getByText("Section 2")).toBeInTheDocument();
      });
    });
  });

  describe("Interactions", () => {
    it("opens menu when trigger is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open Menu" }));

      await waitFor(() => {
        expect(screen.getByText("Action")).toBeInTheDocument();
      });
    });

    it("closes menu when item is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Click Me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Click Me")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Click Me"));

      await waitFor(() => {
        expect(screen.queryByText("Click Me")).not.toBeInTheDocument();
      });
    });

    it("calls onSelect when menu item is clicked", async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Action")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Action"));

      expect(handleSelect).toHaveBeenCalled();
    });

    it("handles disabled menu items", async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect} disabled>
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Disabled Item")).toBeInTheDocument();
      });

      const disabledItem = screen.getByText("Disabled Item");
      await user.click(disabledItem);

      // Handler should not be called for disabled items
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe("Checkbox Items", () => {
    it("renders checkbox items", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>
              Unchecked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Checked Item")).toBeInTheDocument();
        expect(screen.getByText("Unchecked Item")).toBeInTheDocument();
      });
    });

    it("toggles checkbox items when clicked", async () => {
      const user = userEvent.setup();
      const handleCheckedChange = vi.fn();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={handleCheckedChange}
            >
              Toggle Me
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Toggle Me")).toBeInTheDocument();
      });

      const item = screen.getByText("Toggle Me");
      await user.click(item);

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Radio Items", () => {
    it("renders radio group items", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
      });
    });

    it("handles radio item selection", async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value="option1"
              onValueChange={handleValueChange}
            >
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => {
        expect(screen.getByText("Option 2")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Option 2"));

      expect(handleValueChange).toHaveBeenCalledWith("option2");
    });
  });

  describe("Accessibility", () => {
    it("has proper menu role", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
    });

    it("menu items have proper role", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Action Item" }),
        ).toBeInTheDocument();
      });
    });

    it("supports aria-label on trigger", () => {
      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Actions menu">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByLabelText("Actions menu")).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className to content", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="custom-menu-class">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const menu = screen.getByRole("menu");
        expect(menu).toHaveClass("custom-menu-class");
      });
    });
  });
});
