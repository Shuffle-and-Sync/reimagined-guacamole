/**
 * Accordion Component Tests
 *
 * Tests for the Accordion UI component using Vitest and React Testing Library.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";

describe("Accordion Component", () => {
  describe("Rendering", () => {
    it("renders with single item", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Section 1")).toBeInTheDocument();
    });

    it("renders with multiple items", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Section 3</AccordionTrigger>
            <AccordionContent>Content 3</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
      expect(screen.getByText("Section 3")).toBeInTheDocument();
    });

    it("renders chevron icon", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      const svg = trigger.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("renders with custom className on AccordionItem", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem
            value="item-1"
            className="custom-item-class"
            data-testid="accordion-item"
          >
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const item = screen.getByTestId("accordion-item");
      expect(item).toHaveClass("custom-item-class");
    });

    it("renders with custom className on AccordionTrigger", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="custom-trigger-class">
              Section 1
            </AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      expect(trigger).toHaveClass("custom-trigger-class");
    });

    it("renders with custom className on AccordionContent", () => {
      renderWithProviders(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent className="custom-content-class">
              <span data-testid="content-wrapper">Content 1</span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      // The custom className is on the div that wraps the content
      const contentWrapper = screen.getByTestId("content-wrapper");
      const innerDiv = contentWrapper.parentElement;
      expect(innerDiv).toHaveClass("custom-content-class");
    });

    it("supports single type accordion", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger1 = screen.getByText("Section 1");
      const trigger2 = screen.getByText("Section 2");

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByText("Content 2")).toBeInTheDocument();
        expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      });
    });

    it("supports multiple type accordion", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger1 = screen.getByText("Section 1");
      const trigger2 = screen.getByText("Section 2");

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
        expect(screen.getByText("Content 2")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper button role on triggers", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByRole("button", { name: /section 1/i });
      expect(trigger).toBeInTheDocument();
    });

    it("has proper ARIA attributes on trigger", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByRole("button", { name: /section 1/i });
      expect(trigger).toHaveAttribute("aria-expanded");
      expect(trigger).toHaveAttribute("aria-controls");
    });

    it("updates aria-expanded when opened", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByRole("button", { name: /section 1/i });
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByRole("button", { name: /section 1/i });
      trigger.focus();
      expect(trigger).toHaveFocus();

      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
      });
    });
  });

  describe("Interaction", () => {
    it("expands on trigger click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();

      const trigger = screen.getByText("Section 1");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
      });
    });

    it("collapses on second trigger click when collapsible", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
      });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      });
    });

    it("can have default open item", () => {
      renderWithProviders(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("Visual Consistency", () => {
    it("applies default styling classes to AccordionItem", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" data-testid="accordion-item">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const item = screen.getByTestId("accordion-item");
      expect(item).toHaveClass("border-b");
    });

    it("applies default styling classes to AccordionTrigger", () => {
      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      expect(trigger).toHaveClass("flex");
      expect(trigger).toHaveClass("font-medium");
    });

    it("rotates chevron icon when expanded", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      const svg = trigger.querySelector("svg");
      expect(svg).toHaveClass("h-4");
      expect(svg).toHaveClass("w-4");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("data-state", "open");
      });
    });
  });
});
