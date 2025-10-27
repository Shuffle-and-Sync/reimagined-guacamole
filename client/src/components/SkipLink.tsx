/**
 * SkipLink - Accessibility component for keyboard navigation
 *
 * Provides a skip link that allows keyboard users to bypass repetitive navigation
 * and jump directly to the main content. The link is visually hidden until focused.
 *
 * **WCAG 2.1 Compliance:**
 * - 2.4.1 Bypass Blocks (Level A)
 *
 * @example
 * ```tsx
 * // Add at the top of your layout/page
 * <SkipLink />
 * // Then add id="main-content" to your main element
 * <main id="main-content">
 *   {/* Page content *\/}
 * </main>
 * ```
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
