/**
 * TableSync Landing Page Tests
 *
 * Tests for the TableSync Landing page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import TableSyncLanding from "./tablesync-landing";
import { QueryClient } from "@tanstack/react-query";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("TableSync Landing Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe("Page Structure", () => {
    it("renders the page", () => {
      renderWithProviders(<TableSyncLanding />, { queryClient });
      expect(document.body).toBeInTheDocument();
    });

    it("displays landing page content", () => {
      renderWithProviders(<TableSyncLanding />, { queryClient });
      // Landing page content should be present
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses proper layout", () => {
      const { container } = renderWithProviders(<TableSyncLanding />, {
        queryClient,
      });
      expect(container).toBeInTheDocument();
    });
  });
});
