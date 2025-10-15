import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/services/transactions.client";
import { toast } from "sonner";
import type { CreateTransactionCommand, UpdateTransactionCommand } from "@/types";

/**
 * React Query mutations hook for transaction CRUD operations.
 *
 * Provides mutations for creating, updating, and deleting transactions.
 * Automatically invalidates relevant queries and shows toast notifications.
 *
 * @returns Object with mutation functions for transaction operations
 */
export function useTransactionMutations() {
  const queryClient = useQueryClient();

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      // Invalidate both transactions list and dashboard summary
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transakcja dodana pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się dodać transakcji");
      console.error("Create transaction error:", error);
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionCommand }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transakcja zaktualizowana pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować transakcji");
      console.error("Update transaction error:", error);
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transakcja usunięta pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć transakcji");
      console.error("Delete transaction error:", error);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}

