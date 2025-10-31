import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useLazyLoad } from "./useLazyLoad";

describe("useLazyLoad", () => {
  it("loads detail on demand", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    const fetchFn = vi.fn(() => Promise.resolve({ data: "test-data" }));
    const detail = await result.current.loadDetail("item-1", fetchFn);

    expect(detail).toEqual({ data: "test-data" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("caches loaded details", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    const fetchFn = vi.fn(() => Promise.resolve({ data: "test-data" }));

    // Load first time
    await result.current.loadDetail("item-1", fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Load again - should use cache and not call fetchFn again
    const detail = await result.current.loadDetail("item-1", fetchFn);
    expect(detail).toEqual({ data: "test-data" });
    expect(fetchFn).toHaveBeenCalledTimes(1); // Still only called once
  });

  it("returns cached detail via getDetail", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    const fetchFn = vi.fn(() => Promise.resolve({ data: "test-data" }));
    await result.current.loadDetail("item-1", fetchFn);

    await waitFor(() => {
      const cached = result.current.getDetail("item-1");
      expect(cached).toEqual({ data: "test-data" });
    });
  });

  it("tracks loading state", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    const slowFetch = () =>
      new Promise<{ data: string }>((resolve) =>
        setTimeout(() => resolve({ data: "test-data" }), 50),
      );

    const loadPromise = result.current.loadDetail("item-1", slowFetch);

    await loadPromise;

    await waitFor(() => {
      // After loading completes, should not be loading anymore
      expect(result.current.isLoading("item-1")).toBe(false);
    });
  });

  it("handles errors", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    const errorFn = vi.fn(() => Promise.reject(new Error("Load failed")));

    await expect(result.current.loadDetail("item-1", errorFn)).rejects.toThrow(
      "Load failed",
    );

    await waitFor(() => {
      const error = result.current.getError("item-1");
      expect(error?.message).toBe("Load failed");
    });
  });

  it("clears cache", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    const fetchFn = vi.fn(() => Promise.resolve({ data: "test-data" }));
    await result.current.loadDetail("item-1", fetchFn);

    await waitFor(() => {
      expect(result.current.getDetail("item-1")).toEqual({ data: "test-data" });
    });

    result.current.clearCache();

    await waitFor(() => {
      expect(result.current.getDetail("item-1")).toBeUndefined();
      expect(result.current.loadedDetailsCount).toBe(0);
    });
  });

  it("tracks loaded details count", async () => {
    const { result } = renderHook(() => useLazyLoad<{ data: string }>());

    expect(result.current.loadedDetailsCount).toBe(0);

    const fetchFn = () => Promise.resolve({ data: "test-data" });
    await result.current.loadDetail("item-1", fetchFn);
    await result.current.loadDetail("item-2", fetchFn);

    await waitFor(() => {
      expect(result.current.loadedDetailsCount).toBe(2);
    });
  });
});
