import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEventMutations } from "./useEventMutations";

describe("useEventMutations", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("should return all mutation functions", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.createEvent).toBeDefined();
    expect(result.current.updateEvent).toBeDefined();
    expect(result.current.deleteEvent).toBeDefined();
  });

  it("should return async mutation functions", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.createEventAsync).toBeDefined();
    expect(result.current.updateEventAsync).toBeDefined();
    expect(result.current.deleteEventAsync).toBeDefined();
  });

  it("should track individual loading states", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it("should track combined loading state", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.isLoading).toBe(false);
  });

  it("should expose error states", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.createError).toBeNull();
    expect(result.current.updateError).toBeNull();
    expect(result.current.deleteError).toBeNull();
  });

  it("should expose reset functions", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.resetCreate).toBeDefined();
    expect(result.current.resetUpdate).toBeDefined();
    expect(result.current.resetDelete).toBeDefined();
  });

  it("should accept options for callbacks", () => {
    const onCreateSuccess = vi.fn();
    const onUpdateSuccess = vi.fn();
    const onDeleteSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useEventMutations({
          onCreateSuccess,
          onUpdateSuccess,
          onDeleteSuccess,
          onError,
        }),
      { wrapper },
    );

    expect(result.current.createEvent).toBeDefined();
    expect(result.current.updateEvent).toBeDefined();
    expect(result.current.deleteEvent).toBeDefined();
  });

  it("should accept skipToast option", () => {
    const { result } = renderHook(
      () =>
        useEventMutations({
          skipToast: true,
        }),
      { wrapper },
    );

    expect(result.current.createEvent).toBeDefined();
  });
});
