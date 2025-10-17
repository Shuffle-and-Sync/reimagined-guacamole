import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input - A styled text input component with comprehensive form support.
 * 
 * A flexible input component that supports all standard HTML input types and attributes.
 * Designed to work seamlessly with React Hook Form and Zod validation through the Form component.
 * Includes proper styling for focus, disabled, and file input states.
 * 
 * **Accessibility Features:**
 * - Visible focus ring for keyboard navigation (WCAG 2.1 AA compliant)
 * - Disabled state with appropriate cursor and opacity
 * - Placeholder text with proper contrast ratio
 * - Works with Label component for proper form accessibility
 * - Supports all ARIA attributes through standard input props
 * 
 * **Dark Theme Support:**
 * - Uses design tokens (bg-background, border-input, etc.) for automatic theme switching
 * - Maintains proper contrast ratios in both light and dark themes
 * - Focus ring adapts to theme colors
 * 
 * **Form Integration:**
 * - Works seamlessly with React Hook Form's register function
 * - Supports controlled and uncontrolled modes
 * - Can be wrapped with FormField and FormControl for validation
 * 
 * @example
 * ```tsx
 * // Basic input
 * <Input type="text" placeholder="Enter your name" />
 * 
 * // With label (for accessibility)
 * <div className="space-y-2">
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" placeholder="you@example.com" />
 * </div>
 * 
 * // Disabled state
 * <Input disabled placeholder="Cannot edit" />
 * 
 * // With React Hook Form
 * <Input {...register("username", { required: true })} />
 * 
 * // Password input
 * <Input type="password" placeholder="Enter password" />
 * 
 * // Number input with validation
 * <Input 
 *   type="number" 
 *   min={0} 
 *   max={100} 
 *   placeholder="Age"
 * />
 * 
 * // File input
 * <Input type="file" accept="image/*" />
 * 
 * // With Form component (recommended for validation)
 * <Form {...form}>
 *   <FormField
 *     control={form.control}
 *     name="username"
 *     render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>Username</FormLabel>
 *         <FormControl>
 *           <Input placeholder="johndoe" {...field} />
 *         </FormControl>
 *         <FormDescription>Your unique username</FormDescription>
 *         <FormMessage />
 *       </FormItem>
 *     )}
 *   />
 * </Form>
 * 
 * // Custom styling
 * <Input className="border-destructive" placeholder="Error state" />
 * ```
 * 
 * @param {React.ComponentProps<"input">} props - All standard HTML input attributes
 * @param {string} type - Input type (text, email, password, number, etc.)
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the input element
 * @returns {React.ReactElement} Rendered input element
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
