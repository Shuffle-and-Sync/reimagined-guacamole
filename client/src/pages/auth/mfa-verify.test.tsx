/**
 * MFA Verify Page Tests
 *
 * Tests for the Multi-Factor Authentication verification page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import MFAVerify from "./mfa-verify";
import { QueryClient } from "@tanstack/react-query";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("MFA Verify Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response),
    ) as typeof fetch;
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<MFAVerify />, { queryClient });
      expect(
        screen.getByText(/multi-factor authentication/i),
      ).toBeInTheDocument();
    });

    it("displays verification instructions", () => {
      renderWithProviders(<MFAVerify />, { queryClient });
      expect(screen.getByText(/enter.*code/i)).toBeInTheDocument();
    });

    it("renders verification code input", () => {
      renderWithProviders(<MFAVerify />, { queryClient });
      const input = screen.getByLabelText(/verification code/i);
      expect(input).toBeInTheDocument();
    });

    it("shows verify button", () => {
      renderWithProviders(<MFAVerify />, { queryClient });
      expect(
        screen.getByRole("button", { name: /verify/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<MFAVerify />, {
        queryClient,
      });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
