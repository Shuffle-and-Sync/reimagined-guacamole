/**
 * useIsMobile Hook Tests
 *
 * Tests for the useIsMobile custom hook.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  describe("Initial State", () => {
    it("returns false for desktop width (>= 768px)", async () => {
      // Mock matchMedia for desktop
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it("returns true for mobile width (< 768px)", async () => {
      // Mock matchMedia for mobile
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("returns true for exactly 767px (just below breakpoint)", async () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("returns false for exactly 768px (at breakpoint)", async () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe("Cleanup", () => {
    it("cleans up event listener on unmount", async () => {
      const removeEventListener = vi.fn();

      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn(),
      }));

      const { unmount } = renderHook(() => useIsMobile());

      await waitFor(() => {
        expect(removeEventListener).not.toHaveBeenCalled();
      });

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });
  });
});
