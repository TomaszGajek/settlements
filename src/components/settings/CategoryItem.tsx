import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { CategoryDto } from "@/types";

interface CategoryItemProps {
  category: CategoryDto;
  transactionCount: number;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}

/**
 * CategoryItem component displaying a single category in the settings list.
 *
 * Features:
 * - Category name display (bold)
 * - Transaction count badge with proper Polish pluralization
 * - System badge for non-deletable categories ("Inne")
 * - Edit and Delete actions (visible on hover, only for deletable categories)
 * - Keyboard navigation support (Enter for edit, Delete key for delete)
 * - ARIA labels for accessibility
 *
 * @param category - Category object with id, name, and isDeletable
 * @param transactionCount - Number of transactions using this category
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 */
export const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  transactionCount,
  onEdit,
  onDelete,
}) => {
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!category.isDeletable) return;

    if (e.key === "Enter") {
      onEdit(category);
    } else if (e.key === "Delete") {
      e.preventDefault();
      onDelete(category);
    }
  };

  // Polish pluralization for transaction count
  const transactionCountText = useMemo(() => {
    if (transactionCount === 0) return "Brak transakcji";
    if (transactionCount === 1) return "1 transakcja";
    if (transactionCount >= 2 && transactionCount <= 4) {
      return `${transactionCount} transakcje`;
    }
    return `${transactionCount} transakcji`;
  }, [transactionCount]);

  return (
    <div
      className="group flex items-center justify-between py-4 px-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      onKeyDown={handleKeyDown}
      tabIndex={category.isDeletable ? 0 : -1}
      role={category.isDeletable ? "button" : undefined}
      aria-label={
        category.isDeletable
          ? `Kategoria: ${category.name}, ${transactionCountText}`
          : `Kategoria systemowa: ${category.name}, ${transactionCountText}`
      }
    >
      {/* Left section: Name, Badges */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Category Name */}
        <div className="text-base font-semibold text-gray-100">{category.name}</div>

        {/* Transaction Count Badge */}
        <Badge
          variant="secondary"
          className="text-xs"
          aria-label={`${transactionCount} transakcji w tej kategorii`}
        >
          {transactionCountText}
        </Badge>

        {/* System Badge (for non-deletable categories) */}
        {!category.isDeletable && (
          <Badge
            variant="outline"
            className="text-xs"
            aria-label="Kategoria systemowa, nie można edytować ani usunąć"
          >
            Systemowa
          </Badge>
        )}
      </div>

      {/* Right section: Actions (Edit, Delete) - only for deletable categories */}
      {category.isDeletable && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            aria-label={`Edytuj kategorię ${category.name}`}
            className="h-8 w-8 p-0"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            aria-label={`Usuń kategorię ${category.name}`}
            className="h-8 w-8 p-0 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

