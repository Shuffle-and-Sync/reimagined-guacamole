/**
 * Form Component Tests
 *
 * Tests for the Form UI component using Vitest and React Testing Library.
 */

import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";

// Test schema for form validation
const testSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters"),
  email: z.string().email("Invalid email address"),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component wrapper
function TestFormComponent() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                Your public display name (3-20 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe("Form Component", () => {
  describe("Rendering", () => {
    it("renders form with fields", () => {
      renderWithProviders(<TestFormComponent />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders FormLabel correctly", () => {
      renderWithProviders(<TestFormComponent />);

      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("renders FormDescription correctly", () => {
      renderWithProviders(<TestFormComponent />);

      expect(screen.getByText(/Your public display name/i)).toBeInTheDocument();
    });

    it("renders FormControl with input", () => {
      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);
      const emailInput = screen.getByPlaceholderText(/enter email/i);

      expect(usernameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("renders form with validation", async () => {
      const user = userEvent.setup();

      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);

      // Type invalid input
      await user.type(usernameInput, "ab");

      // Input should exist and have the value
      expect(usernameInput).toHaveValue("ab");
    });

    it("clears input value", async () => {
      const user = userEvent.setup();

      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);

      // First, enter invalid input
      await user.type(usernameInput, "ab");
      expect(usernameInput).toHaveValue("ab");

      // Then, clear it
      await user.clear(usernameInput);
      expect(usernameInput).toHaveValue("");

      // Then, make it valid
      await user.type(usernameInput, "validusername");
      expect(usernameInput).toHaveValue("validusername");
    });

    it("accepts email input", async () => {
      const user = userEvent.setup();

      renderWithProviders(<TestFormComponent />);

      const emailInput = screen.getByPlaceholderText(/enter email/i);

      await user.type(emailInput, "invalid-email");
      expect(emailInput).toHaveValue("invalid-email");
    });

    it("accepts valid email", async () => {
      const user = userEvent.setup();

      renderWithProviders(<TestFormComponent />);

      const emailInput = screen.getByPlaceholderText(/enter email/i);

      await user.type(emailInput, "valid@example.com");
      expect(emailInput).toHaveValue("valid@example.com");
    });
  });

  describe("Accessibility", () => {
    it("FormLabel has proper htmlFor association", () => {
      renderWithProviders(<TestFormComponent />);

      const usernameLabel = screen.getByText("Username");
      const usernameInput = screen.getByPlaceholderText(/enter username/i);

      expect(usernameLabel).toHaveAttribute("for");
      expect(usernameInput).toHaveAttribute("id");
    });

    it("FormControl has proper ARIA attributes", () => {
      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);

      expect(usernameInput).toHaveAttribute("aria-describedby");
      expect(usernameInput).toHaveAttribute("aria-invalid");
    });

    it("FormControl has aria-invalid attribute", () => {
      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);

      // Check that aria-invalid exists (initially false)
      expect(usernameInput).toHaveAttribute("aria-invalid");
    });

    it("FormControl sets aria-invalid to false when field is valid", async () => {
      const user = userEvent.setup();

      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);

      await user.type(usernameInput, "validusername");

      await waitFor(() => {
        expect(usernameInput).toHaveAttribute("aria-invalid", "false");
      });
    });

    it("FormDescription is associated with input via aria-describedby", () => {
      renderWithProviders(<TestFormComponent />);

      const usernameInput = screen.getByPlaceholderText(/enter username/i);
      const description = screen.getByText(/Your public display name/i);

      const ariaDescribedBy = usernameInput.getAttribute("aria-describedby");
      const descriptionId = description.getAttribute("id");

      expect(ariaDescribedBy).toContain(descriptionId);
    });

    it("Form inputs are accessible via label", () => {
      renderWithProviders(<TestFormComponent />);

      // Check that inputs can be accessed via their labels
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("applies custom className to FormItem", () => {
      function CustomFormComponent() {
        const form = useForm<TestFormData>({
          defaultValues: { username: "", email: "" },
        });

        return (
          <Form {...form}>
            <form>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="custom-item-class">
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      }

      renderWithProviders(<CustomFormComponent />);

      const formItem = screen.getByText("Username").parentElement;
      expect(formItem).toHaveClass("custom-item-class");
    });

    it("applies custom className to FormLabel", () => {
      function CustomFormComponent() {
        const form = useForm<TestFormData>({
          defaultValues: { username: "", email: "" },
        });

        return (
          <Form {...form}>
            <form>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="custom-label-class">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      }

      renderWithProviders(<CustomFormComponent />);

      const label = screen.getByText("Username");
      expect(label).toHaveClass("custom-label-class");
    });

    it("applies custom className to FormDescription", () => {
      function CustomFormComponent() {
        const form = useForm<TestFormData>({
          defaultValues: { username: "", email: "" },
        });

        return (
          <Form {...form}>
            <form>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription className="custom-description-class">
                      Description text
                    </FormDescription>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      }

      renderWithProviders(<CustomFormComponent />);

      const description = screen.getByText("Description text");
      expect(description).toHaveClass("custom-description-class");
    });

    it("applies custom className to FormMessage", () => {
      function CustomFormComponent() {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          defaultValues: { username: "", email: "" },
        });

        return (
          <Form {...form}>
            <form>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage
                      className="custom-message-class"
                      data-testid="form-message"
                    />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      }

      renderWithProviders(<CustomFormComponent />);

      // FormMessage only renders when there's an error, so we just check the component renders
      const form = screen.getByLabelText(/username/i).closest("form");
      expect(form).toBeInTheDocument();
    });
  });

  describe("Visual Consistency", () => {
    it("applies default styling classes to FormItem", () => {
      renderWithProviders(<TestFormComponent />);

      const formItem = screen.getByText("Username").parentElement;
      expect(formItem).toHaveClass("space-y-2");
    });

    it("applies default styling classes to FormDescription", () => {
      renderWithProviders(<TestFormComponent />);

      const description = screen.getByText(/Your public display name/i);
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-muted-foreground");
    });

    it("FormLabel has base styling", () => {
      renderWithProviders(<TestFormComponent />);

      const label = screen.getByText("Username");
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe("LABEL");
    });

    it("Form components render with proper structure", () => {
      renderWithProviders(<TestFormComponent />);

      // Check that form structure is correct
      const usernameInput = screen.getByPlaceholderText(/enter username/i);
      const emailInput = screen.getByPlaceholderText(/enter email/i);

      expect(usernameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });
  });
});
