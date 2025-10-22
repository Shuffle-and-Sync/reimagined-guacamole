/**
 * useToast Hook Tests
 *
 * Tests for the useToast custom hook and toast functionality.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useToast, toast } from "./use-toast";

describe("useToast", () => {
  beforeEach(() => {
    // Clear any existing toasts
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toasts.forEach((t) => result.current.dismiss(t.id));
    });
  });

  describe("Basic Functionality", () => {
    it("returns initial empty toast state", () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it("provides toast function", () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.toast).toBe("function");
    });

    it("provides dismiss function", () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.dismiss).toBe("function");
    });
  });

  describe("Adding Toasts", () => {
    it("adds a toast", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: "Test Toast",
          description: "Test Description",
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Test Toast");
      expect(result.current.toasts[0].description).toBe("Test Description");
    });

    it("adds toast with only title", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: "Simple Toast",
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Simple Toast");
    });

    it("assigns unique id to each toast", () => {
      const { result } = renderHook(() => useToast());

      let toast1Id = "";
      let toast2Id = "";

      act(() => {
        const t1 = result.current.toast({ title: "Toast 1" });
        toast1Id = t1.id;
      });

      act(() => {
        const t2 = result.current.toast({ title: "Toast 2" });
        toast2Id = t2.id;
      });

      expect(toast1Id).not.toBe(toast2Id);
    });

    it("respects toast limit", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
        result.current.toast({ title: "Toast 2" });
      });

      // TOAST_LIMIT is 1, so only the most recent toast should be shown
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Toast 2");
    });
  });

  describe("Dismissing Toasts", () => {
    it("dismisses a specific toast", async () => {
      const { result } = renderHook(() => useToast());

      let toastId = "";

      act(() => {
        const t = result.current.toast({ title: "Test Toast" });
        toastId = t.id;
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(toastId);
      });

      // Toast is marked as closed
      await waitFor(() => {
        expect(result.current.toasts[0]?.open).toBe(false);
      });
    });

    it("dismisses all toasts when no id provided", async () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss();
      });

      await waitFor(() => {
        expect(result.current.toasts[0]?.open).toBe(false);
      });
    });
  });

  describe("Toast Instance Methods", () => {
    it("returns dismiss method from toast function", () => {
      const { result } = renderHook(() => useToast());

      let toastInstance: ReturnType<typeof result.current.toast>;

      act(() => {
        toastInstance = result.current.toast({ title: "Test" });
      });

      expect(typeof toastInstance.dismiss).toBe("function");
    });

    it("dismisses toast using instance dismiss method", async () => {
      const { result } = renderHook(() => useToast());

      let toastInstance: ReturnType<typeof result.current.toast>;

      act(() => {
        toastInstance = result.current.toast({ title: "Test" });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        toastInstance.dismiss();
      });

      await waitFor(() => {
        expect(result.current.toasts[0]?.open).toBe(false);
      });
    });

    it("updates toast using instance update method", () => {
      const { result } = renderHook(() => useToast());

      let toastInstance: ReturnType<typeof result.current.toast>;

      act(() => {
        toastInstance = result.current.toast({ title: "Original Title" });
      });

      expect(result.current.toasts[0].title).toBe("Original Title");

      act(() => {
        toastInstance.update({
          id: toastInstance.id,
          title: "Updated Title",
        });
      });

      expect(result.current.toasts[0].title).toBe("Updated Title");
    });
  });

  describe("Standalone Toast Function", () => {
    it("works when called directly", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Direct Toast" });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Direct Toast");
    });
  });

  describe("Toast Variants", () => {
    it("supports default variant", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: "Default",
          variant: "default",
        });
      });

      expect(result.current.toasts[0].variant).toBe("default");
    });

    it("supports destructive variant", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: "Error",
          variant: "destructive",
        });
      });

      expect(result.current.toasts[0].variant).toBe("destructive");
    });
  });
});
