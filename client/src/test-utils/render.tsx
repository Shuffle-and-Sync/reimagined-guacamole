/**
 * React Testing Library Utilities
 *
 * Custom render function that includes all necessary providers for testing React components.
 * This ensures components have access to Router, QueryClient, Theme, and other context providers.
 *
 * Note: Install @testing-library/react and @testing-library/jest-dom for full functionality:
 * npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommunityProvider } from "@/features/communities";

/**
 * Create a new QueryClient instance for each test
 * This ensures test isolation and prevents state leakage between tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity, // Prevent garbage collection during tests
        staleTime: Infinity, // Prevent refetching during tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Props for the AllProviders wrapper component
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary context providers
 */
export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <CommunityProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </CommunityProvider>
    </QueryClientProvider>
  );
}

/**
 * Options for the custom render function
 */
export interface RenderOptions {
  queryClient?: QueryClient;
  route?: string;
  // Add more options as needed (e.g., initialState, theme, etc.)
}

/**
 * Custom render function for testing React components with all providers
 *
 * This is a placeholder implementation. To use it fully, install:
 * - @testing-library/react
 * - @testing-library/jest-dom
 * - @testing-library/user-event
 *
 * @example
 * ```typescript
 * import { renderWithProviders, screen } from '@/test-utils';
 *
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {},
) {
  const { queryClient, route = "/", ...renderOptions } = options;

  // Note: This is a simplified version
  // For full functionality, uncomment the following when @testing-library/react is installed:
  /*
  const { render } = require('@testing-library/react');
  
  // Set up the route if needed
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
  */

  // Placeholder return - update when @testing-library/react is installed
  return {
    container: document.createElement("div"),
    rerender: () => {},
    unmount: () => {},
  };
}

/**
 * Wait for async operations to complete
 * Useful when testing components with async data fetching
 */
export async function waitForLoadingToFinish() {
  // Placeholder - implement when @testing-library/react is installed
  /*
  const { waitFor } = require('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  */
  return Promise.resolve();
}

/**
 * Mock the fetch API for testing
 * Note: Requires jest to be available in the test environment
 */
export function mockFetch(
  response: any,
  options: { status?: number; ok?: boolean } = {},
) {
  const { status = 200, ok = true } = options;

  // This function is meant to be used in a Jest test environment
  // where jest is available globally
  (global.fetch as any) = () =>
    Promise.resolve({
      ok,
      status,
      json: async () => response,
      text: async () => JSON.stringify(response),
      headers: new Headers({ "content-type": "application/json" }),
    } as Response);
}

/**
 * Reset all mocks
 * Note: Requires jest to be available in the test environment
 */
export function resetMocks() {
  if (
    global.fetch &&
    typeof global.fetch === "function" &&
    "mockReset" in global.fetch
  ) {
    (global.fetch as any).mockReset();
  }
}

// Re-export testing library utilities when available
// Uncomment when @testing-library/react is installed:
/*
export {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';

export { default as userEvent } from '@testing-library/user-event';
*/
