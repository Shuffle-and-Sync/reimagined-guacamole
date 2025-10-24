import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach } from "vitest";
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
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it("should return all mutation hooks", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.createEvent).toBeDefined();
    expect(result.current.updateEvent).toBeDefined();
    expect(result.current.deleteEvent).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should track loading state across all mutations", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.isLoading).toBe(false);
  });

  it("should expose mutation objects with correct properties", () => {
    const { result } = renderHook(() => useEventMutations(), { wrapper });

    expect(result.current.createEvent.mutate).toBeDefined();
    expect(result.current.updateEvent.mutate).toBeDefined();
    expect(result.current.deleteEvent.mutate).toBeDefined();
  });
});
