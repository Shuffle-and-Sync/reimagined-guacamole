import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button component variants configuration using class-variance-authority.
 *
 * Provides consistent styling for different button types and sizes across the application.
 * All variants support dark theme and maintain WCAG 2.1 AA contrast requirements.
 *
 * @example
 * ```tsx
 * // Using variant
 * <Button variant="destructive">Delete</Button>
 *
 * // Using size
 * <Button size="sm">Small Button</Button>
 *
 * // Combining variant and size
 * <Button variant="outline" size="lg">Large Outline Button</Button>
 * ```
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props for the Button component.
 *
 * @property {boolean} asChild - When true, renders the button as a Slot component,
 *   allowing it to merge props with a single child element. Useful for rendering
 *   buttons as links or other elements while maintaining button styling.
 *
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement> - All standard button HTML attributes
 * @extends VariantProps<typeof buttonVariants> - Variant and size props from buttonVariants
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button component - A versatile button implementation with multiple variants and sizes.
 *
 * Built on Radix UI Slot for flexible composition, supporting all standard button behaviors
 * including disabled states, form submission, and click handlers. Includes proper focus
 * management for keyboard navigation and screen reader support.
 *
 * **Accessibility Features:**
 * - Keyboard accessible with visible focus indicators
 * - Disabled state prevents interaction and indicates unavailability
 * - Proper contrast ratios in all variants (WCAG 2.1 AA)
 * - Works seamlessly with screen readers
 *
 * **Dark Theme Support:**
 * - All variants use CSS custom properties for automatic theme switching
 * - Maintains consistent appearance and contrast in dark mode
 *
 * @example
 * ```tsx
 * // Basic button
 * <Button onClick={handleClick}>Click me</Button>
 *
 * // Destructive action
 * <Button variant="destructive" onClick={handleDelete}>
 *   Delete Account
 * </Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon" aria-label="Open menu">
 *   <MenuIcon />
 * </Button>
 *
 * // Button as link (using asChild)
 * <Button asChild>
 *   <Link to="/dashboard">Go to Dashboard</Link>
 * </Button>
 *
 * // Disabled button
 * <Button disabled>Processing...</Button>
 *
 * // Button with icon
 * <Button>
 *   <PlusIcon />
 *   Add Item
 * </Button>
 * ```
 *
 * @param {ButtonProps} props - Component props
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the button element
 * @returns {React.ReactElement} Rendered button component
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
