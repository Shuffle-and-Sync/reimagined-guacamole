import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes - more reasonable default
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401, 403
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          return false;
        }
        if (error?.message?.match(/4\d\d/)) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.message?.match(/4\d\d/)) {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error, variables, context) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Global error handling
queryClient.setQueryDefaults(['api'], {
  staleTime: 1000 * 60 * 5,
});

// Performance monitoring
if (import.meta.env.DEV) {
  queryClient.setMutationDefaults(['api'], {
    onSettled: (data, error, variables) => {
      console.log('Mutation settled:', { data, error, variables });
    },
  });
}
