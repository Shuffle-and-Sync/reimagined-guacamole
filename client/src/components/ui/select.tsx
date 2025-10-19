"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Select - Root component for a select dropdown.
 *
 * Built on Radix UI Select primitive, provides accessible dropdown selection with
 * keyboard navigation, screen reader support, and proper focus management.
 *
 * @see https://www.radix-ui.com/docs/primitives/components/select
 */
const Select = SelectPrimitive.Root;

/**
 * SelectGroup - Groups related select options together.
 *
 * Useful for organizing options into categories with optional labels.
 */
const SelectGroup = SelectPrimitive.Group;

/**
 * SelectValue - Displays the selected value or placeholder text.
 *
 * Automatically updates when selection changes.
 */
const SelectValue = SelectPrimitive.Value;

/**
 * SelectTrigger - The button that opens the select dropdown.
 *
 * Displays the currently selected value and a chevron icon. When clicked or activated
 * via keyboard (Space or Enter), opens the dropdown menu. Includes proper focus states
 * and disabled styling.
 *
 * **Accessibility:**
 * - Keyboard accessible (Space, Enter to open)
 * - Focus ring for keyboard navigation
 * - Announces state to screen readers
 * - Disabled state prevents interaction
 *
 * @example
 * ```tsx
 * <Select>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select an option" />
 *   </SelectTrigger>
 * </Select>
 * ```
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * SelectScrollUpButton - Button to scroll up within the select dropdown.
 *
 * Automatically appears when there are more options above the visible area.
 * Clicking scrolls the dropdown content up.
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/**
 * SelectScrollDownButton - Button to scroll down within the select dropdown.
 *
 * Automatically appears when there are more options below the visible area.
 * Clicking scrolls the dropdown content down.
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

/**
 * SelectContent - The dropdown content container that displays select options.
 *
 * Renders in a portal for proper z-index layering and includes smooth animations.
 * Automatically positions itself relative to the trigger button and handles overflow
 * with scroll buttons when needed.
 *
 * **Accessibility:**
 * - Manages focus within the dropdown
 * - Keyboard navigation (Arrow keys, Home, End, type to search)
 * - Escape to close
 * - Proper ARIA attributes
 *
 * **Dark Theme Support:**
 * - Uses popover tokens for consistent theming
 * - Smooth animations work in all themes
 *
 * @example
 * ```tsx
 * <Select>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choose..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="option1">Option 1</SelectItem>
 *     <SelectItem value="option2">Option 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * SelectLabel - Label for a group of select options.
 *
 * Use within SelectGroup to provide a heading for a group of related options.
 * The label is not selectable.
 *
 * @example
 * ```tsx
 * <SelectContent>
 *   <SelectGroup>
 *     <SelectLabel>Card Games</SelectLabel>
 *     <SelectItem value="mtg">Magic: The Gathering</SelectItem>
 *     <SelectItem value="pokemon">Pokemon TCG</SelectItem>
 *   </SelectGroup>
 * </SelectContent>
 * ```
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * SelectItem - A selectable option within the select dropdown.
 *
 * Displays a checkmark icon when selected and highlights on focus/hover.
 * Supports disabled state to prevent selection of certain options.
 *
 * **Accessibility:**
 * - Keyboard navigable
 * - Announces selection state to screen readers
 * - Visual focus indicator
 * - Disabled items skip focus and indicate unavailability
 *
 * @example
 * ```tsx
 * // Basic item
 * <SelectItem value="option1">Option 1</SelectItem>
 *
 * // Disabled item
 * <SelectItem value="premium" disabled>
 *   Premium Feature (Locked)
 * </SelectItem>
 *
 * // Complete select example
 * <Select>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select a game" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="mtg">Magic: The Gathering</SelectItem>
 *     <SelectItem value="pokemon">Pokemon TCG</SelectItem>
 *     <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
 *     <SelectItem value="lorcana">Disney Lorcana</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * SelectSeparator - Visual separator between select items or groups.
 *
 * Helps organize options into distinct sections for improved scannability.
 *
 * @example
 * ```tsx
 * <SelectContent>
 *   <SelectItem value="option1">Option 1</SelectItem>
 *   <SelectItem value="option2">Option 2</SelectItem>
 *   <SelectSeparator />
 *   <SelectItem value="option3">Option 3</SelectItem>
 * </SelectContent>
 * ```
 */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
