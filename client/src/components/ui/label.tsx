import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Label component variants configuration.
 *
 * Provides consistent styling for form labels with proper accessibility support.
 * Uses peer-disabled utility to style labels when their associated input is disabled.
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

/**
 * Label - An accessible label component for form inputs.
 *
 * Built on Radix UI Label primitive, this component provides proper accessibility
 * for form inputs. It creates a semantic association between the label text and
 * the input field, improving usability for all users, especially those using
 * assistive technologies.
 *
 * **Accessibility Features:**
 * - Automatically associates with input fields via htmlFor/id
 * - Clicking the label focuses the associated input
 * - Screen readers properly announce the label-input relationship
 * - Visual feedback when associated input is disabled (peer-disabled)
 * - Proper cursor behavior (pointer for clickable, not-allowed when disabled)
 *
 * **Dark Theme Support:**
 * - Uses text color tokens that adapt to theme
 * - Maintains proper contrast in all themes
 *
 * **Form Integration:**
 * - Works seamlessly with all form input components (Input, Checkbox, Radio, etc.)
 * - Integrates with FormLabel for enhanced form validation display
 * - Supports React Hook Form and Zod validation patterns
 *
 * @example
 * ```tsx
 * // Basic usage with input
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" />
 *
 * // With checkbox
 * <div className="flex items-center space-x-2">
 *   <Checkbox id="terms" />
 *   <Label
 *     htmlFor="terms"
 *     className="text-sm font-normal cursor-pointer"
 *   >
 *     Accept terms and conditions
 *   </Label>
 * </div>
 *
 * // With radio group
 * <RadioGroup>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option1" id="option1" />
 *     <Label htmlFor="option1">Option 1</Label>
 *   </div>
 * </RadioGroup>
 *
 * // In a form field with validation
 * <FormField
 *   control={form.control}
 *   name="username"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Username</FormLabel>
 *       <FormControl>
 *         <Input {...field} />
 *       </FormControl>
 *     </FormItem>
 *   )}
 * />
 *
 * // With disabled input (label automatically styled)
 * <Label htmlFor="disabled-input">Cannot Edit</Label>
 * <Input id="disabled-input" disabled className="peer" />
 *
 * // Required field indicator
 * <Label htmlFor="required">
 *   Password <span className="text-destructive">*</span>
 * </Label>
 * <Input id="required" type="password" required />
 * ```
 *
 * @param {React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>} props - Radix Label props
 * @param {React.Ref} ref - Forwarded ref to the label element
 * @returns {React.ReactElement} Rendered label element
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
