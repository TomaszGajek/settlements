import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, updateCategory, deleteCategory } from "@/lib/services/categories.client";
import { toast } from "sonner";
import type { CreateCategoryCommand, UpdateCategoryCommand } from "@/types";

/**
 * React Query mutations hook for category CRUD operations.
 *
 * Provides mutations for creating, updating, and deleting categories.
 * Automatically invalidates relevant queries and shows toast notifications.
 * When categories change, also invalidates transactions and dashboard queries
 * because they display category data.
 *
 * @returns Object with mutation functions for category operations
 *
 * @example
 * ```tsx
 * const { createMutation, updateMutation, deleteMutation } = useCategoryMutations();
 *
 * // Create category
 * createMutation.mutate({ name: "Transport" });
 *
 * // Update category
 * updateMutation.mutate({ id: "uuid", data: { name: "Zaktualizowana" } });
 *
 * // Delete category
 * deleteMutation.mutate("uuid");
 * ```
 */
export function useCategoryMutations() {
  const queryClient = useQueryClient();

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategoria dodana pomyślnie");
    },
    onError: (error: Error) => {
      // Error messages are already translated in the service
      toast.error(error.message || "Nie udało się dodać kategorii");
      console.error("Create category error:", error);
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryCommand }) => updateCategory(id, data),
    onSuccess: () => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Invalidate transactions to refresh category names displayed there
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Invalidate dashboard in case category stats need updating
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Kategoria zaktualizowana pomyślnie");
    },
    onError: (error: Error) => {
      // Error messages are already translated in the service
      toast.error(error.message || "Nie udało się zaktualizować kategorii");
      console.error("Update category error:", error);
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Invalidate transactions - they now show "Inne" category
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Invalidate dashboard - stats may have changed
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Kategoria usunięta pomyślnie");
    },
    onError: (error: Error) => {
      // Error messages are already translated in the service
      toast.error(error.message || "Nie udało się usunąć kategorii");
      console.error("Delete category error:", error);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
