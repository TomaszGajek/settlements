import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { TransactionItemProps } from "@/lib/types/dashboard.types";

/**
 * TransactionItem component displaying a single transaction in the list.
 *
 * Features:
 * - Date display (DD.MM format)
 * - Category badge with name
 * - Amount display (colored: green for income, red for expense)
 * - Note tooltip (if note exists)
 * - Edit and Delete actions (always visible)
 * - Keyboard navigation support
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onEdit, onDelete }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onEdit(transaction);
    } else if (e.key === "Delete") {
      e.preventDefault();
      onDelete(transaction);
    }
  };

  const amountColor = transaction.type === "income" ? "text-green-500" : "text-red-500";

  return (
    <div
      className="flex items-center justify-between py-3 px-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Transakcja: ${transaction.category?.name || "Bez kategorii"}, ${formatCurrency(transaction.amount)}`}
    >
      {/* Left section: Date, Category, Note */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Date */}
        <div className="text-sm text-gray-400 w-16 shrink-0">{formatDate(transaction.date, "DD.MM")}</div>

        {/* Category Badge */}
        <Badge variant="outline" className="shrink-0">
          {transaction.category?.name || "Bez kategorii"}
        </Badge>

        {/* Note Icon with Tooltip */}
        {transaction.note && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-gray-500 hover:text-gray-300 transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{transaction.note}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Right section: Amount and Actions */}
      <div className="flex items-center gap-4">
        {/* Amount */}
        <div className={`font-semibold text-lg ${amountColor} shrink-0`}>{formatCurrency(transaction.amount)}</div>

        {/* Action buttons (always visible) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
            }}
            aria-label="Edytuj transakcję"
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction);
            }}
            aria-label="Usuń transakcję"
            className="h-8 w-8 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

