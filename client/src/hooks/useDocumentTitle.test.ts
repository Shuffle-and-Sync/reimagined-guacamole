/**
 * useDocumentTitle Hook Tests
 *
 * Tests for the useDocumentTitle custom hook.
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useDocumentTitle } from "./useDocumentTitle";

describe("useDocumentTitle", () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = originalTitle;
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  describe("Basic Functionality", () => {
    it("sets document title with basic title", () => {
      renderHook(() => useDocumentTitle("Test Page"));
      expect(document.title).toBe("Test Page | Shuffle & Sync");
    });

    it("sets document title with title and community", () => {
      renderHook(() => useDocumentTitle("Test Page", "Magic Community"));
      expect(document.title).toBe(
        "Test Page - Magic Community | Shuffle & Sync",
      );
    });

    it("updates title when title changes", () => {
      const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
        initialProps: { title: "Initial Title" },
      });

      expect(document.title).toBe("Initial Title | Shuffle & Sync");

      rerender({ title: "Updated Title" });

      expect(document.title).toBe("Updated Title | Shuffle & Sync");
    });

    it("updates title when community changes", () => {
      const { rerender } = renderHook(
        ({ community }) => useDocumentTitle("Page", community),
        { initialProps: { community: "Community A" } },
      );

      expect(document.title).toBe("Page - Community A | Shuffle & Sync");

      rerender({ community: "Community B" });

      expect(document.title).toBe("Page - Community B | Shuffle & Sync");
    });
  });

  describe("Cleanup", () => {
    it("resets title to default on unmount", () => {
      const { unmount } = renderHook(() => useDocumentTitle("Test Page"));

      expect(document.title).toBe("Test Page | Shuffle & Sync");

      unmount();

      expect(document.title).toBe("Shuffle & Sync");
    });

    it("resets title when switching from community to no community", () => {
      const { rerender } = renderHook(
        ({ community }) => useDocumentTitle("Page", community),
        { initialProps: { community: "Community A" as string | undefined } },
      );

      expect(document.title).toBe("Page - Community A | Shuffle & Sync");

      rerender({ community: undefined });

      expect(document.title).toBe("Page | Shuffle & Sync");
    });
  });

  describe("Edge Cases", () => {
    it("handles special characters in title", () => {
      renderHook(() => useDocumentTitle("Test & Test | Page"));
      expect(document.title).toBe("Test & Test | Page | Shuffle & Sync");
    });

    it("handles long titles", () => {
      const longTitle =
        "This is a very long title that might wrap in the browser tab";
      renderHook(() => useDocumentTitle(longTitle));
      expect(document.title).toBe(`${longTitle} | Shuffle & Sync`);
    });

    it("handles long community names", () => {
      const longCommunity = "Very Long Community Name That Might Be Truncated";
      renderHook(() => useDocumentTitle("Page", longCommunity));
      expect(document.title).toBe(`Page - ${longCommunity} | Shuffle & Sync`);
    });
  });
});
