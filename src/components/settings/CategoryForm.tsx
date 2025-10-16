import React, { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CategoryFormData } from "@/lib/schemas/category.schema";

export interface CategoryFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<CategoryFormData>;
}

/**
 * CategoryForm component with validation.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Single field: Name (1-100 characters)
 * - Real-time validation on change
 * - Character counter (current/100)
 * - Auto-focus on Name field on mount
 * - Reserved name validation: cannot use "Inne" (system category)
 * - Accessible with proper ARIA attributes
 *
 * Form Field:
 * - Name (Input) - Category name with character limit
 *
 * @param mode - 'create' for new category, 'edit' for existing
 * @param form - React Hook Form instance
 */
export const CategoryForm: React.FC<CategoryFormProps> = ({ mode, form }) => {
  // Auto-focus on Name field on mount
  useEffect(() => {
    // Focus on name input after modal animation
    const timer = setTimeout(() => {
      const nameInput = document.querySelector(
        'input[name="name"]'
      ) as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.select(); // Select text in edit mode for easy overwrite
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Watch name field for character counter
  const nameValue = form.watch("name") || "";
  const characterCount = nameValue.length;
  const maxLength = 100;

  // Color for character counter (warning when approaching limit)
  const counterColor =
    characterCount > maxLength
      ? "text-red-500"
      : characterCount > 90
        ? "text-yellow-500"
        : "text-gray-400";

  return (
    <Form {...form}>
      <div className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa kategorii</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="np. Transport"
                  maxLength={maxLength}
                  aria-label="Nazwa kategorii"
                  aria-describedby="name-description"
                />
              </FormControl>
              <div
                id="name-description"
                className={`flex justify-between items-center text-xs ${counterColor}`}
              >
                <FormMessage />
                <span aria-live="polite" aria-atomic="true">
                  {characterCount}/{maxLength}
                </span>
              </div>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};

