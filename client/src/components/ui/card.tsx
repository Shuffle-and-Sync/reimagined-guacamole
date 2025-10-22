import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card - A flexible container component for grouping related content.
 *
 * The Card component provides a consistent foundation for displaying content with proper
 * spacing, borders, and elevation. It serves as a container for other card sub-components
 * and works seamlessly with the application's dark theme.
 *
 * **Accessibility:**
 * - Uses semantic HTML (div) that can be extended with proper ARIA roles when needed
 * - Maintains proper color contrast in all themes
 *
 * **Dark Theme Support:**
 * - Uses bg-card and text-card-foreground tokens for automatic theme switching
 * - Shadow and border colors adapt to the current theme
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <CardContent className="p-6">
 *     Simple card content
 *   </CardContent>
 * </Card>
 *
 * // Complete card structure
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Tournament Results</CardTitle>
 *     <CardDescription>View the latest match results</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Tournament content goes here...</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>View Details</Button>
 *   </CardFooter>
 * </Card>
 *
 * // Interactive card (add hover effects)
 * <Card className="hover:shadow-lg transition-shadow cursor-pointer">
 *   <CardContent>Clickable card</CardContent>
 * </Card>
 * ```
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard div element props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the div element
 * @returns {React.ReactElement} Rendered card container
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * CardHeader - Header section of a Card component.
 *
 * Provides consistent spacing and layout for card titles and descriptions.
 * Typically contains CardTitle and/or CardDescription components.
 *
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>Community Stats</CardTitle>
 *   <CardDescription>Overview of community engagement</CardDescription>
 * </CardHeader>
 * ```
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard div element props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the div element
 * @returns {React.ReactElement} Rendered card header
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle - Title element for Card headers.
 *
 * Displays the primary heading for a card with appropriate typography and spacing.
 * Consider using semantic heading elements (h1-h6) as children based on document structure.
 *
 * @example
 * ```tsx
 * <CardTitle>
 *   <h2>User Profile</h2>
 * </CardTitle>
 *
 * // Or directly
 * <CardTitle>User Profile</CardTitle>
 * ```
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard div element props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the div element
 * @returns {React.ReactElement} Rendered card title
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription - Description or subtitle for Card headers.
 *
 * Displays secondary text below the card title with muted styling.
 * Useful for providing context or additional information about the card's content.
 *
 * **Dark Theme Support:**
 * - Uses text-muted-foreground for reduced emphasis while maintaining readability
 *
 * @example
 * ```tsx
 * <CardDescription>
 *   This card contains important information about your account
 * </CardDescription>
 * ```
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard div element props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the div element
 * @returns {React.ReactElement} Rendered card description
 */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent - Main content area of a Card.
 *
 * Contains the primary content of the card with appropriate padding.
 * The top padding is reduced (pt-0) to work harmoniously with CardHeader spacing.
 *
 * @example
 * ```tsx
 * <CardContent>
 *   <p>This is the main content of the card.</p>
 *   <ul>
 *     <li>Point 1</li>
 *     <li>Point 2</li>
 *   </ul>
 * </CardContent>
 *
 * // With custom padding
 * <CardContent className="p-4">
 *   Compact content
 * </CardContent>
 * ```
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard div element props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the div element
 * @returns {React.ReactElement} Rendered card content
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter - Footer section of a Card.
 *
 * Provides a consistent layout for actions or additional information at the bottom of a card.
 * Uses flexbox for easy alignment of buttons and other interactive elements.
 *
 * @example
 * ```tsx
 * // With action buttons
 * <CardFooter>
 *   <Button variant="outline" className="mr-2">Cancel</Button>
 *   <Button>Confirm</Button>
 * </CardFooter>
 *
 * // Right-aligned actions
 * <CardFooter className="justify-end">
 *   <Button>Save Changes</Button>
 * </CardFooter>
 *
 * // With additional info and actions
 * <CardFooter className="justify-between">
 *   <p className="text-sm text-muted-foreground">Last updated: 2 hours ago</p>
 *   <Button variant="ghost" size="sm">Refresh</Button>
 * </CardFooter>
 * ```
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard div element props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the div element
 * @returns {React.ReactElement} Rendered card footer
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
