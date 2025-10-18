import React from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { CategoryDto } from "@/types";

export interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryDto | null;
  transactionCount: number;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * DeleteCategoryDialog component for confirming category deletion.
 *
 * Features:
 * - AlertDialog for destructive action confirmation
 * - Displays category name being deleted
 * - Shows transaction count with warning if transactions exist
 * - Explains reassignment to "Inne" category
 * - Disabled state during deletion (loading)
 * - Polish pluralization for transaction count
 * - Clear visual warning (Alert component)
 *
 * @param isOpen - Whether dialog is visible
 * @param onClose - Callback to close dialog
 * @param category - Category to delete (null if not selected)
 * @param transactionCount - Number of transactions in this category
 * @param onConfirm - Callback when user confirms deletion
 * @param isDeleting - Whether deletion is in progress
 */
export const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  isOpen,
  onClose,
  category,
  transactionCount,
  onConfirm,
  isDeleting,
}) => {
  if (!category) return null;

  // Polish pluralization helper
  const getTransactionText = (count: number): string => {
    if (count === 1) return "transakcję";
    if (count >= 2 && count <= 4) return "transakcje";
    return "transakcji";
  };

  const handleConfirm = async () => {
    await onConfirm();
    // Dialog will close automatically via onClose in parent
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń kategorię?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Czy na pewno chcesz usunąć kategorię{" "}
                <strong className="text-gray-100">&ldquo;{category.name}&rdquo;</strong>?
              </p>

              {transactionCount > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ta kategoria zawiera <strong>{transactionCount}</strong> {getTransactionText(transactionCount)}.
                    Wszystkie zostaną automatycznie przeniesione do kategorii <strong>&ldquo;Inne&rdquo;</strong>.
                  </AlertDescription>
                </Alert>
              )}

              {transactionCount === 0 && (
                <p className="text-sm text-gray-400">Ta kategoria nie zawiera żadnych transakcji.</p>
              )}

              <p className="text-sm text-muted-foreground">Ta operacja jest nieodwracalna.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} data-testid="delete-category-dialog-cancel">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
            data-testid="delete-category-dialog-confirm"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
