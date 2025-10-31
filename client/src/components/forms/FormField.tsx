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

interface FormFieldWrapperProps {
  label: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Reusable form field wrapper component
 * Provides consistent structure for form fields with label, description, and error message
 */
export function FormFieldWrapper({
  label,
  description,
  required = false,
  className,
  children,
}: FormFieldWrapperProps) {
  return (
    <FormItem className={className}>
      <FormLabel>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FormLabel>
      <FormControl>{children}</FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "required"> {
  label: string;
  description?: string;
  required?: boolean;
  fieldClassName?: string;
}

/**
 * Reusable form input component with label and validation
 */
export const FormInputField = React.forwardRef<
  HTMLInputElement,
  FormInputProps
>(
  (
    {
      label,
      description,
      required = false,
      className,
      fieldClassName,
      ...props
    },
    ref,
  ) => {
    return (
      <FormFieldWrapper
        label={label}
        description={description}
        required={required}
        className={fieldClassName}
      >
        <Input ref={ref} className={cn(className)} {...props} />
      </FormFieldWrapper>
    );
  },
);

FormInputField.displayName = "FormInputField";
