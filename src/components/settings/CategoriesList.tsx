import React, { useMemo } from "react";
import { CategoryItem } from "./CategoryItem";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCategories } from "@/lib/hooks/useCategories";
import type { CategoryDto } from "@/types";

interface CategoriesListProps {
  onEditCategory: (category: CategoryDto) => void;
  onDeleteCategory: (category: CategoryDto) => void;
  transactionCounts?: Record<string, number>;
}

/**
 * CategoriesList component displaying all user categories with transaction counts.
 *
 * Features:
 * - Displays all user categories (both custom and system)
 * - Sorts alphabetically with "Inne" (system category) always last
 * - Shows loading skeleton while data is being fetched
 * - Shows empty state if no categories exist (unlikely - default categories exist)
 * - Passes transaction counts to each CategoryItem
 * - Delegates edit/delete actions to parent component
 *
 * @param onEditCategory - Callback when user wants to edit a category
 * @param onDeleteCategory - Callback when user wants to delete a category
 * @param transactionCounts - Optional map of category IDs to transaction counts
 */
export const CategoriesList: React.FC<CategoriesListProps> = ({
  onEditCategory,
  onDeleteCategory,
  transactionCounts = {},
}) => {
  const { data: categories, isLoading, error } = useCategories();

  // Sort categories: alphabetically by name, with "Inne" (system category) always last
  const sortedCategories = useMemo(() => {
    if (!categories) return [];

    // Separate system categories (non-deletable) from user categories
    const systemCategories = categories.filter((c) => !c.isDeletable);
    const userCategories = categories
      .filter((c) => c.isDeletable)
      .sort((a, b) => a.name.localeCompare(b.name, "pl"));

    // Return user categories first, then system categories
    return [...userCategories, ...systemCategories];
  }, [categories]);

  // Loading state
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Ładowanie kategorii">
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        title="Błąd ładowania"
        description="Nie udało się załadować kategorii. Spróbuj odświeżyć stronę."
        icon="error"
      />
    );
  }

  // Empty state (unlikely - users always have default categories)
  if (!sortedCategories || sortedCategories.length === 0) {
    return (
      <EmptyState
        title="Brak kategorii"
        description="Nie masz jeszcze żadnych kategorii. Dodaj pierwszą kategorię aby zacząć."
        icon="empty"
      />
    );
  }

  // Render category items
  return (
    <div className="space-y-0" role="list" aria-label="Lista kategorii">
      {sortedCategories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          transactionCount={transactionCounts[category.id] || 0}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
        />
      ))}
    </div>
  );
};

