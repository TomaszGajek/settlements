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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { DeleteDialogProps } from "@/lib/types/dashboard.types";

/**
 * DeleteTransactionDialog component for confirming transaction deletion.
 *
 * Features:
 * - Alert dialog with transaction summary display
 * - Shows: amount, category, date, and note
 * - Cancel and Delete actions (destructive styling)
 * - Loading state on delete button
 * - Async onConfirm handler with error handling
 * - Focus on Cancel button by default (safer)
 * - Warning message about irreversibility
 *
 * @param isOpen - Whether the dialog is open
 * @param onClose - Callback to close dialog
 * @param transaction - Transaction to be deleted
 * @param onConfirm - Async callback to confirm deletion (receives transaction ID)
 */
export const DeleteTransactionDialog: React.FC<DeleteDialogProps> = ({ isOpen, onClose, transaction, onConfirm }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(transaction.id);
      onClose();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń transakcję?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Czy na pewno chcesz usunąć tę transakcję?</p>

              {/* Transaction Summary Card */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{formatCurrency(transaction.amount)}</span>
                  <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                    {transaction.type === "income" ? "Przychód" : "Wydatek"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {transaction.category?.name || "Bez kategorii"} • {formatDate(transaction.date, "DD.MM.YYYY")}
                </div>
                {transaction.note && (
                  <p className="text-sm mt-2 italic text-foreground border-l-2 border-muted-foreground/30 pl-3">
                    "{transaction.note}"
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">Ta operacja jest nieodwracalna.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Export as DeleteDialog for backward compatibility
export const DeleteDialog = DeleteTransactionDialog;

