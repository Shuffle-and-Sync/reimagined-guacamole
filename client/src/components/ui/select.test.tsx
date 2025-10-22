/**
 * Select Component Tests
 *
 * Tests for the Select UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select Component", () => {
  describe("Rendering", () => {
    it("renders with placeholder", () => {
      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("renders the trigger as a button", () => {
      renderWithProviders(
        <Select>
          <SelectTrigger aria-label="Select trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByLabelText("Select trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger.tagName).toBe("BUTTON");
    });

    it("renders with custom className on trigger", () => {
      renderWithProviders(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveClass("custom-trigger");
    });
  });

  describe("Interactions", () => {
    it("opens dropdown on trigger click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "Option 1" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: "Option 2" }),
        ).toBeInTheDocument();
      });
    });

    it("selects an option on click", async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      renderWithProviders(
        <Select onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "Option 1" }),
        ).toBeInTheDocument();
      });

      const option = screen.getByRole("option", { name: "Option 1" });
      await user.click(option);

      expect(handleValueChange).toHaveBeenCalledWith("option1");
    });

    it("displays selected value", async () => {
      const _user = userEvent.setup();

      renderWithProviders(
        <Select defaultValue="option2">
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>,
      );

      // The selected value should be visible in the trigger
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });
  });

  describe("States", () => {
    it("can be disabled", () => {
      renderWithProviders(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeDisabled();
    });

    it("disables specific options", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2" disabled>
              Option 2 (Disabled)
            </SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        const disabledOption = screen.getByRole("option", {
          name: "Option 2 (Disabled)",
        });
        expect(disabledOption).toHaveAttribute("data-disabled");
      });
    });
  });

  describe("Grouping and Labeling", () => {
    it("renders groups with labels", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a game" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Card Games</SelectLabel>
              <SelectItem value="mtg">Magic: The Gathering</SelectItem>
              <SelectItem value="pokemon">Pokemon TCG</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Board Games</SelectLabel>
              <SelectItem value="chess">Chess</SelectItem>
              <SelectItem value="go">Go</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Card Games")).toBeInTheDocument();
        expect(screen.getByText("Board Games")).toBeInTheDocument();
      });
    });

    it("renders separator between groups", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator data-testid="select-separator" />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId("select-separator")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper role", () => {
      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      renderWithProviders(
        <Select>
          <SelectTrigger aria-label="Game selection">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      expect(screen.getByLabelText("Game selection")).toBeInTheDocument();
    });

    it("indicates expanded state", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  describe("Controlled Component", () => {
    it("works as a controlled component", async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState("");

        return (
          <div>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
              </SelectContent>
            </Select>
            <div data-testid="current-value">{value || "none"}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("current-value")).toHaveTextContent("none");

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByRole("option", { name: "Option 1" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("option", { name: "Option 1" }));

      await waitFor(() => {
        expect(screen.getByTestId("current-value")).toHaveTextContent(
          "option1",
        );
      });
    });
  });
});
