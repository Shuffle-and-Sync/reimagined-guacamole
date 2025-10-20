/**
 * Shared Components Tests
 *
 * Tests for shared components used across the application.
 */

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Footer } from "./Footer";
import { Header } from "./Header";

describe("Footer Component", () => {
  it("renders without crashing", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText("Shuffle & Sync")).toBeInTheDocument();
  });

  it("renders social media buttons", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByTestId("footer-social-twitter")).toBeInTheDocument();
    expect(screen.getByTestId("footer-social-discord")).toBeInTheDocument();
  });

  it("renders description text", () => {
    renderWithProviders(<Footer />);
    expect(
      screen.getByText(/ultimate streaming coordination platform/i),
    ).toBeInTheDocument();
  });

  it("opens Discord link in new tab", async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    renderWithProviders(<Footer />);

    const discordButton = screen.getByTestId("footer-social-discord");
    await user.click(discordButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://discord.gg/shuffleandsync",
      "_blank",
    );

    windowOpenSpy.mockRestore();
  });
});

describe("Header Component", () => {
  it("renders without crashing", () => {
    renderWithProviders(<Header />);
    // Header contains navigation elements
    expect(document.querySelector("header")).toBeInTheDocument();
  });

  it("renders logo", () => {
    renderWithProviders(<Header />);
    // Check for Shuffle & Sync branding
    expect(screen.getByText(/Shuffle & Sync/i)).toBeInTheDocument();
  });
});
