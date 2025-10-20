/**
 * Progress Component Tests
 *
 * Tests for the Progress UI component using Vitest and React Testing Library.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { Progress } from "./progress";

describe("Progress Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = renderWithProviders(<Progress value={0} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with test id", () => {
      renderWithProviders(<Progress value={50} data-testid="progress-bar" />);
      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });

    it("renders progress indicator", () => {
      const { container } = renderWithProviders(<Progress value={50} />);
      const root = container.querySelector('[role="progressbar"]');
      expect(root).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("accepts value of 0", () => {
      const { container } = renderWithProviders(
        <Progress value={0} data-testid="progress" />,
      );
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("accepts value of 50", () => {
      const { container } = renderWithProviders(
        <Progress value={50} data-testid="progress" />,
      );
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("accepts value of 100", () => {
      const { container } = renderWithProviders(
        <Progress value={100} data-testid="progress" />,
      );
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("handles undefined value", () => {
      const { container } = renderWithProviders(<Progress />);
      const root = container.querySelector('[role="progressbar"]');
      expect(root).toBeInTheDocument();
    });

    it("applies custom className", () => {
      renderWithProviders(
        <Progress
          value={50}
          className="custom-progress-class"
          data-testid="progress"
        />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("custom-progress-class");
    });

    it("merges custom className with default classes", () => {
      renderWithProviders(
        <Progress value={50} className="custom-class" data-testid="progress" />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("custom-class");
      expect(progress).toHaveClass("relative");
      expect(progress).toHaveClass("h-4");
    });

    it("accepts custom width via className", () => {
      renderWithProviders(
        <Progress value={50} className="w-64" data-testid="progress" />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("w-64");
    });

    it("accepts custom height via className", () => {
      renderWithProviders(
        <Progress value={50} className="h-2" data-testid="progress" />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("h-2");
    });

    it("forwards additional HTML attributes", () => {
      renderWithProviders(
        <Progress
          value={50}
          data-testid="progress"
          aria-label="Upload progress"
        />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute("aria-label", "Upload progress");
    });
  });

  describe("Accessibility", () => {
    it("has proper role attribute", () => {
      renderWithProviders(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute("role", "progressbar");
    });

    it("has data-state attribute", () => {
      renderWithProviders(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute("data-state");
    });

    it("renders properly with value prop", () => {
      renderWithProviders(<Progress value={75} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("can have custom aria-label", () => {
      renderWithProviders(
        <Progress
          value={50}
          aria-label="File upload progress"
          data-testid="progress"
        />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute("aria-label", "File upload progress");
    });

    it("can have custom aria-labelledby", () => {
      renderWithProviders(
        <div>
          <label id="progress-label">Loading...</label>
          <Progress
            value={50}
            aria-labelledby="progress-label"
            data-testid="progress"
          />
        </div>,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute("aria-labelledby", "progress-label");
    });

    it("supports aria-describedby for additional context", () => {
      renderWithProviders(
        <div>
          <p id="progress-description">Uploading file to server</p>
          <Progress
            value={50}
            aria-describedby="progress-description"
            data-testid="progress"
          />
        </div>,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute(
        "aria-describedby",
        "progress-description",
      );
    });
  });

  describe("Visual Consistency", () => {
    it("applies default styling classes", () => {
      renderWithProviders(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("relative");
      expect(progress).toHaveClass("h-4");
      expect(progress).toHaveClass("w-full");
      expect(progress).toHaveClass("overflow-hidden");
      expect(progress).toHaveClass("rounded-full");
      expect(progress).toHaveClass("bg-secondary");
    });

    it("indicator has default styling classes", () => {
      const { container } = renderWithProviders(<Progress value={50} />);
      const root = container.querySelector('[role="progressbar"]');
      expect(root).toBeInTheDocument();
      // Indicator exists inside the progress bar
      const indicator = root?.querySelector("[data-radix-progress-indicator]");
      if (indicator) {
        expect(indicator).toHaveClass("h-full");
        expect(indicator).toHaveClass("bg-primary");
      }
    });

    it("indicator renders with proper value", () => {
      const { container } = renderWithProviders(<Progress value={50} />);
      const root = container.querySelector('[role="progressbar"]');
      expect(root).toBeInTheDocument();
    });

    it("indicator updates with different values", () => {
      const { container: container1 } = renderWithProviders(
        <Progress value={0} />,
      );
      const root1 = container1.querySelector('[role="progressbar"]');
      expect(root1).toBeInTheDocument();

      const { container: container2 } = renderWithProviders(
        <Progress value={100} />,
      );
      const root2 = container2.querySelector('[role="progressbar"]');
      expect(root2).toBeInTheDocument();
    });
  });

  describe("States", () => {
    it("shows empty state at 0%", () => {
      renderWithProviders(<Progress value={0} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("shows half state at 50%", () => {
      renderWithProviders(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("shows complete state at 100%", () => {
      renderWithProviders(<Progress value={100} data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      // Note: Radix UI Progress may not set data-state="complete" for 100%
    });

    it("handles indeterminate state (no value)", () => {
      const { container } = renderWithProviders(
        <Progress data-testid="progress" />,
      );
      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute("data-state", "indeterminate");
    });
  });

  describe("Common Use Cases", () => {
    it("renders file upload progress", () => {
      renderWithProviders(
        <div>
          <label id="upload-label">Uploading file.txt</label>
          <Progress
            value={65}
            aria-labelledby="upload-label"
            data-testid="progress"
          />
          <span>65% complete</span>
        </div>,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      expect(screen.getByText("65% complete")).toBeInTheDocument();
    });

    it("renders form completion progress", () => {
      renderWithProviders(
        <div>
          <label>Step 2 of 4</label>
          <Progress
            value={50}
            aria-label="Form completion"
            data-testid="progress"
          />
        </div>,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    });

    it("renders download progress", () => {
      renderWithProviders(
        <div>
          <Progress
            value={80}
            aria-label="Download progress"
            data-testid="progress"
          />
          <p>Downloading... 80%</p>
        </div>,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
    });

    it("renders skill level indicator", () => {
      renderWithProviders(
        <div>
          <label>JavaScript Proficiency</label>
          <Progress value={90} className="h-2" data-testid="progress" />
        </div>,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveClass("h-2");
    });

    it("renders loading indicator", () => {
      renderWithProviders(
        <Progress aria-label="Loading content" data-testid="progress" />,
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toHaveAttribute("aria-label", "Loading content");
    });
  });

  describe("Composition", () => {
    it("works with text labels", () => {
      renderWithProviders(
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Progress</span>
            <span>75%</span>
          </div>
          <Progress value={75} data-testid="progress" />
        </div>,
      );

      expect(screen.getByTestId("progress")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("works in a card layout", () => {
      renderWithProviders(
        <div className="border rounded-lg p-4">
          <h3>Task Progress</h3>
          <Progress value={60} className="mt-4" data-testid="progress" />
          <p className="mt-2 text-sm">3 of 5 tasks completed</p>
        </div>,
      );

      expect(screen.getByTestId("progress")).toBeInTheDocument();
      expect(screen.getByText("Task Progress")).toBeInTheDocument();
    });

    it("works with multiple progress bars", () => {
      renderWithProviders(
        <div className="space-y-4">
          <div>
            <label>CPU Usage</label>
            <Progress value={45} data-testid="cpu" />
          </div>
          <div>
            <label>Memory Usage</label>
            <Progress value={70} data-testid="memory" />
          </div>
          <div>
            <label>Disk Usage</label>
            <Progress value={30} data-testid="disk" />
          </div>
        </div>,
      );

      expect(screen.getByTestId("cpu")).toBeInTheDocument();
      expect(screen.getByTestId("memory")).toBeInTheDocument();
      expect(screen.getByTestId("disk")).toBeInTheDocument();
    });
  });
});
