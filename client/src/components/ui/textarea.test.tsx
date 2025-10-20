/**
 * Textarea Component Tests
 *
 * Tests for the Textarea UI component using Vitest and React Testing Library.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Textarea } from "./textarea";

describe("Textarea Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderWithProviders(<Textarea aria-label="Test textarea" />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      renderWithProviders(
        <Textarea className="custom-class" aria-label="Test textarea" />,
      );
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("custom-class");
    });

    it("renders with placeholder", () => {
      renderWithProviders(
        <Textarea
          placeholder="Enter your message"
          aria-label="Test textarea"
        />,
      );
      expect(
        screen.getByPlaceholderText("Enter your message"),
      ).toBeInTheDocument();
    });

    it("renders with default value", () => {
      renderWithProviders(
        <Textarea defaultValue="Default text" aria-label="Test textarea" />,
      );
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Default text");
    });
  });

  describe("Interactions", () => {
    it("handles user input", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Textarea aria-label="Test textarea" />);

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(textarea, "Hello World");

      expect(textarea.value).toBe("Hello World");
    });

    it("calls onChange when value changes", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Textarea onChange={handleChange} aria-label="Test textarea" />,
      );

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Test");

      expect(handleChange).toHaveBeenCalled();
    });

    it("handles multiline input", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Textarea aria-label="Test textarea" />);

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3");

      expect(textarea.value).toContain("\n");
      expect(textarea.value.split("\n")).toHaveLength(3);
    });

    it("does not accept input when disabled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProviders(
        <Textarea
          disabled
          onChange={handleChange}
          aria-label="Test textarea"
        />,
      );

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Test");

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("States", () => {
    it("can be disabled", () => {
      renderWithProviders(<Textarea disabled aria-label="Test textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeDisabled();
    });

    it("applies disabled styles", () => {
      renderWithProviders(<Textarea disabled aria-label="Test textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("disabled:cursor-not-allowed");
      expect(textarea).toHaveClass("disabled:opacity-50");
    });

    it("can be required", () => {
      renderWithProviders(<Textarea required aria-label="Test textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeRequired();
    });

    it("can be readonly", () => {
      renderWithProviders(
        <Textarea
          readOnly
          defaultValue="Read only"
          aria-label="Test textarea"
        />,
      );
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("readonly");
    });
  });

  describe("Controlled Component", () => {
    it("works as a controlled component", async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [value, setValue] = React.useState("");

        return (
          <div>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Test textarea"
            />
            <div data-testid="value-display">{value}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Controlled");

      expect(screen.getByTestId("value-display")).toHaveTextContent(
        "Controlled",
      );
    });
  });

  describe("Accessibility", () => {
    it("supports aria-label", () => {
      renderWithProviders(<Textarea aria-label="Message" />);
      expect(screen.getByLabelText("Message")).toBeInTheDocument();
    });

    it("supports id for label association", () => {
      renderWithProviders(
        <div>
          <label htmlFor="message-textarea">Message</label>
          <Textarea id="message-textarea" />
        </div>,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("id", "message-textarea");
    });

    it("forwards additional HTML attributes", () => {
      renderWithProviders(
        <Textarea data-testid="custom-textarea" aria-label="Test" />,
      );
      expect(screen.getByTestId("custom-textarea")).toBeInTheDocument();
    });
  });

  describe("Props", () => {
    it("supports rows attribute", () => {
      renderWithProviders(<Textarea rows={5} aria-label="Test textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "5");
    });

    it("supports cols attribute", () => {
      renderWithProviders(<Textarea cols={50} aria-label="Test textarea" />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("cols", "50");
    });

    it("supports maxLength attribute", () => {
      renderWithProviders(
        <Textarea maxLength={100} aria-label="Test textarea" />,
      );
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("maxLength", "100");
    });
  });
});
