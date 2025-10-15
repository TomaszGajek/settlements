import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { transactionFormSchema } from "@/lib/schemas/transaction.schema";
import { useTransactionMutations } from "@/lib/hooks/useTransactionMutations";
import { TransactionForm } from "./TransactionForm";
import type { TransactionModalProps } from "@/lib/types/dashboard.types";
import type { TransactionFormData } from "@/lib/types/dashboard.types";

/**
 * TransactionModal component for creating or editing transactions.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Modular form components (TypeToggle, AmountInput, DatePickerField, CategorySelect, NoteTextarea)
 * - Unsaved changes alert dialog (not window.confirm)
 * - Loading states
 * - Keyboard shortcuts: Ctrl+Enter to submit, Escape to close
 * - Focus management
 * - Optimistic updates via React Query
 */
export const TransactionModal: React.FC<TransactionModalProps> = ({
  mode,
  isOpen,
  onClose,
  transaction,
  defaultDate,
}) => {
  const { createMutation, updateMutation } = useTransactionMutations();
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Form setup
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      amount: undefined,
      date: defaultDate || new Date().toISOString().split("T")[0],
      categoryId: "",
      note: null,
    },
  });

  // Reset form when transaction changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && transaction) {
        form.reset({
          type: transaction.type,
          amount: transaction.amount,
          date: transaction.date,
          categoryId: transaction.category?.id || "",
          note: transaction.note || null,
        });
      } else {
        form.reset({
          type: "expense",
          amount: undefined,
          date: defaultDate || new Date().toISOString().split("T")[0],
          categoryId: "",
          note: null,
        });
      }
    }
  }, [isOpen, mode, transaction, defaultDate, form]);

  // Handle form submission
  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          amount: data.amount,
          date: data.date,
          categoryId: data.categoryId,
          type: data.type,
          note: data.note || null,
        });
      } else if (mode === "edit" && transaction) {
        await updateMutation.mutateAsync({
          id: transaction.id,
          data: {
            amount: data.amount,
            date: data.date,
            categoryId: data.categoryId,
            type: data.type,
            note: data.note || null,
          },
        });
      }
      // Close modal on success
      onClose();
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is handled by mutation (toast notification)
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (form.formState.isDirty) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
      form.reset();
    }
  };

  // Handle discard changes
  const handleDiscardChanges = () => {
    setShowUnsavedWarning(false);
    form.reset();
    onClose();
  };

  // Handle cancel (from form)
  const handleCancel = () => {
    handleClose();
  };

  // Keyboard shortcut: Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, form]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Dodaj transakcję" : "Edytuj transakcję"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Wypełnij poniższy formularz, aby dodać nową transakcję."
                : "Zmodyfikuj pola, aby zaktualizować transakcję."}
            </DialogDescription>
          </DialogHeader>

          <TransactionForm
            mode={mode}
            form={form}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Alert Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masz niezapisane zmiany</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz zamknąć formularz? Wszystkie niezapisane zmiany zostaną utracone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges} className="bg-red-600 hover:bg-red-700">
              Odrzuć zmiany
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

