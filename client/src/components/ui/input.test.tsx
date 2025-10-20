/**
 * Input Component Tests
 *
 * Tests for the Input UI component using Vitest and React Testing Library.
 */

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Input } from "./input";

describe("Input Component", () => {
  describe("Rendering", () => {
    it("renders with default props", () => {
      renderWithProviders(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("renders with placeholder text", () => {
      renderWithProviders(<Input placeholder="Enter your name" />);
      expect(
        screen.getByPlaceholderText("Enter your name"),
      ).toBeInTheDocument();
    });

    it("renders with specific type", () => {
      const { rerender } = renderWithProviders(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

      rerender(<Input type="password" />);
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe("Input Types", () => {
    it("renders text input", () => {
      renderWithProviders(<Input type="text" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    });

    it("renders email input", () => {
      renderWithProviders(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("renders number input", () => {
      renderWithProviders(<Input type="number" />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("renders password input", () => {
      renderWithProviders(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("accepts user input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input placeholder="Type here" />);

      const input = screen.getByPlaceholderText("Type here");
      await user.type(input, "Hello World");

      expect(input).toHaveValue("Hello World");
    });

    it("calls onChange handler", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Input placeholder="Type here" onChange={handleChange} />,
      );

      const input = screen.getByPlaceholderText("Type here");
      await user.type(input, "Test");

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // Once per character
    });

    it("calls onFocus and onBlur handlers", async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      renderWithProviders(
        <Input
          placeholder="Focus me"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />,
      );

      const input = screen.getByPlaceholderText("Focus me");

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("States", () => {
    it("can be disabled", () => {
      renderWithProviders(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText("Disabled input");
      expect(input).toBeDisabled();
    });

    it("cannot accept input when disabled", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input disabled placeholder="Disabled input" />);

      const input = screen.getByPlaceholderText("Disabled input");
      await user.type(input, "Should not type");

      expect(input).toHaveValue("");
    });

    it("can be read-only", () => {
      renderWithProviders(
        <Input readOnly value="Read only" placeholder="Read only" />,
      );
      const input = screen.getByPlaceholderText("Read only");
      expect(input).toHaveAttribute("readonly");
    });
  });

  describe("Validation Attributes", () => {
    it("supports required attribute", () => {
      renderWithProviders(<Input required placeholder="Required input" />);
      const input = screen.getByPlaceholderText("Required input");
      expect(input).toBeRequired();
    });

    it("supports min and max for number inputs", () => {
      renderWithProviders(<Input type="number" min={0} max={100} />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
    });

    it("supports pattern attribute", () => {
      renderWithProviders(<Input pattern="[0-9]{3}" placeholder="Pattern" />);
      const input = screen.getByPlaceholderText("Pattern");
      expect(input).toHaveAttribute("pattern", "[0-9]{3}");
    });

    it("supports maxLength attribute", () => {
      renderWithProviders(<Input maxLength={10} placeholder="Max length" />);
      const input = screen.getByPlaceholderText("Max length");
      expect(input).toHaveAttribute("maxLength", "10");
    });
  });

  describe("Accessibility", () => {
    it("can be associated with a label", () => {
      renderWithProviders(
        <>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
        </>,
      );

      const input = screen.getByLabelText("Test Label");
      expect(input).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      renderWithProviders(<Input aria-label="Search input" />);
      expect(screen.getByLabelText("Search input")).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      renderWithProviders(
        <>
          <Input aria-describedby="help-text" placeholder="Input" />
          <span id="help-text">Help text</span>
        </>,
      );

      const input = screen.getByPlaceholderText("Input");
      expect(input).toHaveAttribute("aria-describedby", "help-text");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      renderWithProviders(
        <Input className="custom-class" placeholder="Styled" />,
      );
      const input = screen.getByPlaceholderText("Styled");
      expect(input).toHaveClass("custom-class");
    });

    it("applies default styling classes", () => {
      renderWithProviders(<Input placeholder="Default styled" />);
      const input = screen.getByPlaceholderText("Default styled");
      expect(input).toHaveClass("rounded-md");
      expect(input).toHaveClass("border");
    });
  });

  describe("Controlled Input", () => {
    it("works as a controlled component", async () => {
      const user = userEvent.setup();
      let value = "";
      const setValue = vi.fn((newValue: string) => {
        value = newValue;
      });

      const { rerender } = renderWithProviders(
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled"
        />,
      );

      const input = screen.getByPlaceholderText("Controlled");
      await user.type(input, "A");

      expect(setValue).toHaveBeenCalledTimes(1);
      expect(setValue).toHaveBeenCalledWith("A");

      // Rerender with updated value
      rerender(
        <Input
          value="A"
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled"
        />,
      );

      expect(screen.getByPlaceholderText("Controlled")).toHaveValue("A");
    });
  });
});
