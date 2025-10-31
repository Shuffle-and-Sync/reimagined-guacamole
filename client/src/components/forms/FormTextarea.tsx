import React from "react";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "required"> {
  label: string;
  description?: string;
  required?: boolean;
  fieldClassName?: string;
  showCharCount?: boolean;
}

/**
 * Reusable form textarea component with label and validation
 */
export const FormTextareaField = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      label,
      description,
      required = false,
      className,
      fieldClassName,
      showCharCount = false,
      maxLength,
      value,
      ...props
    },
    ref,
  ) => {
    const currentLength =
      typeof value === "string" ? value.length : String(value || "").length;

    return (
      <FormItem className={fieldClassName}>
        <FormLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        <FormControl>
          <Textarea
            ref={ref}
            className={cn(className)}
            maxLength={maxLength}
            value={value}
            {...props}
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        {showCharCount && maxLength && (
          <FormDescription className="text-right">
            {currentLength} / {maxLength}
          </FormDescription>
        )}
        <FormMessage />
      </FormItem>
    );
  },
);

FormTextareaField.displayName = "FormTextareaField";
