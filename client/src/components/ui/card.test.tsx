/**
 * Card Component Tests
 *
 * Tests for the Card UI component and its sub-components using Vitest and React Testing Library.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

describe("Card Component", () => {
  describe("Card", () => {
    it("renders children correctly", () => {
      renderWithProviders(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.querySelector("div");
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("bg-card");
    });

    it("supports custom className", () => {
      const { container } = renderWithProviders(
        <Card className="custom-class">Content</Card>,
      );
      const card = container.querySelector("div");
      expect(card).toHaveClass("custom-class");
    });

    it("forwards additional props", () => {
      renderWithProviders(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId("test-card")).toBeInTheDocument();
    });
  });

  describe("CardHeader", () => {
    it("renders children correctly", () => {
      renderWithProviders(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = renderWithProviders(
        <CardHeader>Header</CardHeader>,
      );
      const header = container.querySelector("div");
      expect(header).toHaveClass("flex");
      expect(header).toHaveClass("flex-col");
      expect(header).toHaveClass("p-6");
    });

    it("supports custom className", () => {
      const { container } = renderWithProviders(
        <CardHeader className="custom-header">Header</CardHeader>,
      );
      const header = container.querySelector("div");
      expect(header).toHaveClass("custom-header");
    });
  });

  describe("CardTitle", () => {
    it("renders title text", () => {
      renderWithProviders(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText("Card Title")).toBeInTheDocument();
    });

    it("applies title styling", () => {
      const { container } = renderWithProviders(<CardTitle>Title</CardTitle>);
      const title = container.querySelector("div");
      expect(title).toHaveClass("text-2xl");
      expect(title).toHaveClass("font-semibold");
    });

    it("supports custom className", () => {
      const { container } = renderWithProviders(
        <CardTitle className="custom-title">Title</CardTitle>,
      );
      const title = container.querySelector("div");
      expect(title).toHaveClass("custom-title");
    });
  });

  describe("CardDescription", () => {
    it("renders description text", () => {
      renderWithProviders(
        <CardDescription>This is a description</CardDescription>,
      );
      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("applies description styling", () => {
      const { container } = renderWithProviders(
        <CardDescription>Description</CardDescription>,
      );
      const desc = container.querySelector("div");
      expect(desc).toHaveClass("text-sm");
      expect(desc).toHaveClass("text-muted-foreground");
    });

    it("supports custom className", () => {
      const { container } = renderWithProviders(
        <CardDescription className="custom-desc">Desc</CardDescription>,
      );
      const desc = container.querySelector("div");
      expect(desc).toHaveClass("custom-desc");
    });
  });

  describe("CardContent", () => {
    it("renders content correctly", () => {
      renderWithProviders(<CardContent>Main card content</CardContent>);
      expect(screen.getByText("Main card content")).toBeInTheDocument();
    });

    it("applies content padding", () => {
      const { container } = renderWithProviders(
        <CardContent>Content</CardContent>,
      );
      const content = container.querySelector("div");
      expect(content).toHaveClass("p-6");
      expect(content).toHaveClass("pt-0");
    });

    it("supports custom className", () => {
      const { container } = renderWithProviders(
        <CardContent className="custom-content">Content</CardContent>,
      );
      const content = container.querySelector("div");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("CardFooter", () => {
    it("renders footer content", () => {
      renderWithProviders(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("applies footer styling", () => {
      const { container } = renderWithProviders(
        <CardFooter>Footer</CardFooter>,
      );
      const footer = container.querySelector("div");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("items-center");
      expect(footer).toHaveClass("p-6");
    });

    it("supports custom className", () => {
      const { container } = renderWithProviders(
        <CardFooter className="custom-footer">Footer</CardFooter>,
      );
      const footer = container.querySelector("div");
      expect(footer).toHaveClass("custom-footer");
    });
  });

  describe("Complete Card Structure", () => {
    it("renders all card components together", () => {
      renderWithProviders(
        <Card>
          <CardHeader>
            <CardTitle>Tournament Results</CardTitle>
            <CardDescription>View the latest match results</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Tournament content goes here</p>
          </CardContent>
          <CardFooter>
            <button>View Details</button>
          </CardFooter>
        </Card>,
      );

      expect(screen.getByText("Tournament Results")).toBeInTheDocument();
      expect(
        screen.getByText("View the latest match results"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Tournament content goes here"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /view details/i }),
      ).toBeInTheDocument();
    });
  });
});
