import React from "react";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormDatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  required?: boolean;
  fieldClassName?: string;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * Reusable form date picker component
 * Uses HTML5 datetime-local input for simplicity and better mobile support
 */
export const FormDatePickerField = React.forwardRef<
  HTMLInputElement,
  FormDatePickerProps
>(
  (
    {
      label,
      description,
      required = false,
      className,
      fieldClassName,
      minDate,
      maxDate,
      ...props
    },
    ref,
  ) => {
    // Format date for datetime-local input
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const min = minDate ? formatDateForInput(minDate) : undefined;
    const max = maxDate ? formatDateForInput(maxDate) : undefined;

    return (
      <FormItem className={fieldClassName}>
        <FormLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        <FormControl>
          <Input
            ref={ref}
            type="datetime-local"
            className={cn(className)}
            min={min}
            max={max}
            {...props}
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  },
);

FormDatePickerField.displayName = "FormDatePickerField";
