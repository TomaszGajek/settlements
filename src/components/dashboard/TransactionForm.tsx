import React, { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TypeToggle } from "./TypeToggle";
import { AmountInput } from "./AmountInput";
import { DatePickerField } from "./DatePickerField";
import { CategorySelect } from "./CategorySelect";
import { NoteTextarea } from "./NoteTextarea";
import type { TransactionFormData } from "@/lib/types/dashboard.types";

export interface TransactionFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * TransactionForm component with full validation.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Five form fields: Type, Amount, Date, Category, Note
 * - Real-time validation on change
 * - Auto-focus on Amount field on mount
 * - Tab order: Type → Amount → Date → Category → Note → Actions
 * - Accessible with proper ARIA attributes
 * - All validation delegated to Zod schema
 *
 * Form Fields:
 * 1. Type (TypeToggle) - Income/Expense
 * 2. Amount (AmountInput) - PLN currency with formatting
 * 3. Date (DatePickerField) - Calendar picker
 * 4. CategoryId (CategorySelect) - Searchable dropdown
 * 5. Note (NoteTextarea) - Optional with character counter
 *
 * @param mode - 'create' for new transaction, 'edit' for existing
 * @param form - React Hook Form instance
 * @param onSubmit - Submit handler
 * @param onCancel - Cancel handler
 * @param isSubmitting - Whether form is currently submitting
 */
export const TransactionForm: React.FC<TransactionFormProps> = ({ mode, form, onSubmit, onCancel, isSubmitting }) => {
  // Auto-focus on Amount field on mount
  useEffect(() => {
    // Focus on amount input after modal animation
    const timer = setTimeout(() => {
      const amountInput = document.querySelector('input[aria-label="Kwota transakcji"]') as HTMLInputElement;
      if (amountInput) {
        amountInput.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Field */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Typ transakcji</FormLabel>
              <FormControl>
                <TypeToggle value={field.value} onChange={field.onChange} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount Input Field */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kwota</FormLabel>
              <FormControl>
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.amount?.message}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>Podaj kwotę transakcji (maksymalnie 2 miejsca po przecinku)</FormDescription>
              <FormMessage id="amount-error" />
            </FormItem>
          )}
        />

        {/* Date Picker Field */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <FormControl>
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.date?.message}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>Wybierz datę transakcji</FormDescription>
              <FormMessage id="date-error" />
            </FormItem>
          )}
        />

        {/* Category Select Field */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategoria</FormLabel>
              <FormControl>
                <CategorySelect
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.categoryId?.message}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>Wybierz kategorię dla tej transakcji</FormDescription>
              <FormMessage id="category-error" />
            </FormItem>
          )}
        />

        {/* Note Textarea Field */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notatka (opcjonalnie)</FormLabel>
              <FormControl>
                <NoteTextarea
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.note?.message}
                  disabled={isSubmitting}
                  maxLength={500}
                />
              </FormControl>
              <FormMessage id="note-error" />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} data-testid="transaction-form-cancel">
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid} data-testid="transaction-form-submit">
            {isSubmitting ? (
              <>
                <span className="mr-2">Zapisywanie...</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : (
              "Zapisz"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
