import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { categoryFormSchema, type CategoryFormData } from "@/lib/schemas/category.schema";
import { useCategoryMutations } from "@/lib/hooks/useCategoryMutations";
import { CategoryForm } from "./CategoryForm";
import type { CategoryDto } from "@/types";

export interface CategoryModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryDto; // Required for edit mode
}

/**
 * CategoryModal component for creating or editing categories.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Single field form (category name)
 * - Unsaved changes alert dialog
 * - Loading states during mutation
 * - Keyboard shortcuts: Ctrl+Enter to submit, Escape to close
 * - Focus management (auto-focus on name input)
 * - Optimistic updates via React Query
 * - Polish error messages
 *
 * @param mode - 'create' for new category, 'edit' for existing category
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param category - Category object (required for edit mode)
 */
export const CategoryModal: React.FC<CategoryModalProps> = ({ mode, isOpen, onClose, category }) => {
  const { createMutation, updateMutation } = useCategoryMutations();
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Form setup
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Reset form when category changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) {
        form.reset({
          name: category.name,
        });
      } else {
        form.reset({
          name: "",
        });
      }
    }
  }, [isOpen, mode, category, form]);

  // Handle form submission
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: data.name,
        });
      } else if (mode === "edit" && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          data: {
            name: data.name,
          },
        });
      }
      // Close modal on success
      onClose();
      form.reset();
    } catch (error) {
      console.error("Category form submission error:", error);
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Dodaj kategorię" : "Edytuj kategorię"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Wprowadź nazwę nowej kategorii." : "Zmodyfikuj nazwę kategorii."}
            </DialogDescription>
          </DialogHeader>

          <CategoryForm mode={mode} form={form} />

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} data-testid="category-modal-cancel">
              Anuluj
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={!form.formState.isValid || isSubmitting} data-testid="category-modal-submit">
              {isSubmitting ? "Zapisywanie..." : mode === "create" ? "Dodaj" : "Zapisz"}
            </Button>
          </DialogFooter>
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
