/**
 * React Testing Library Utilities
 *
 * Custom render function that includes all necessary providers for testing React components.
 * This ensures components have access to Router, QueryClient, Theme, and other context providers.
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
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
export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  route?: string;
}

/**
 * Custom render function for testing React components with all providers
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
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const { queryClient, route = "/", ...renderOptions } = options;

  // Set up the route if needed
  if (route !== "/") {
    window.history.pushState({}, "Test page", route);
  }

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Wait for async operations to complete
 * Useful when testing components with async data fetching
 */
export async function waitForLoadingToFinish() {
  const { waitFor, screen } = await import("@testing-library/react");
  await waitFor(() => {
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
}

// Re-export testing library utilities
export {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

export { default as userEvent } from "@testing-library/user-event";
