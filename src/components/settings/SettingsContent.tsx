import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AccountInfoCard } from "./AccountInfoCard";
import { CategoriesList } from "./CategoriesList";
import { CategoryModal } from "./CategoryModal";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { useCategoryMutations } from "@/lib/hooks/useCategoryMutations";
import { useCategoriesWithCount } from "@/lib/hooks/useCategoriesWithCount";
import type { CategoryDto } from "@/types";

// State types for modals
interface CategoryModalState {
  isOpen: boolean;
  mode: "create" | "edit";
  category?: CategoryDto;
}

interface DeleteCategoryDialogState {
  isOpen: boolean;
  category: CategoryDto | null;
  transactionCount: number;
}

/**
 * SettingsContent component - main content for Settings page.
 *
 * Manages two main sections:
 * 1. Kategorie (Categories) - list, add, edit, delete categories
 * 2. Konto (Account) - delete account section
 *
 * Features:
 * - State management for all modals (CategoryModal, DeleteCategoryDialog, DeleteAccountDialog)
 * - Integration with useCategoriesWithCount for transaction counts
 * - Integration with useCategoryMutations for CRUD operations
 * - Event handlers for all user interactions
 * - Two-column section layout with headers
 *
 * @example
 * ```tsx
 * <SettingsContent />
 * ```
 */
export const SettingsContent: React.FC = () => {
  const { transactionCounts } = useCategoriesWithCount();
  const { deleteMutation } = useCategoryMutations();

  // Category modal state
  const [categoryModalState, setCategoryModalState] = useState<CategoryModalState>({
    isOpen: false,
    mode: "create",
    category: undefined,
  });

  // Delete category dialog state
  const [deleteCategoryDialogState, setDeleteCategoryDialogState] = useState<DeleteCategoryDialogState>({
    isOpen: false,
    category: null,
    transactionCount: 0,
  });

  // Delete account dialog state
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // Event handlers for categories
  const handleAddCategory = () => {
    setCategoryModalState({
      isOpen: true,
      mode: "create",
      category: undefined,
    });
  };

  const handleEditCategory = (category: CategoryDto) => {
    setCategoryModalState({
      isOpen: true,
      mode: "edit",
      category,
    });
  };

  const handleDeleteCategory = (category: CategoryDto) => {
    setDeleteCategoryDialogState({
      isOpen: true,
      category,
      transactionCount: transactionCounts[category.id] || 0,
    });
  };

  const handleCloseCategoryModal = () => {
    setCategoryModalState({
      isOpen: false,
      mode: "create",
      category: undefined,
    });
  };

  const handleCloseDeleteCategoryDialog = () => {
    setDeleteCategoryDialogState({
      isOpen: false,
      category: null,
      transactionCount: 0,
    });
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryDialogState.category) return;

    await deleteMutation.mutateAsync(deleteCategoryDialogState.category.id);
    handleCloseDeleteCategoryDialog();
  };

  // Event handlers for account
  const handleDeleteAccount = () => {
    setDeleteAccountDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Section 0: Account Information */}
      <AccountInfoCard />

      {/* Section 1: Kategorie (Categories) */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Kategorie</h2>
            <p className="text-sm text-gray-400 mt-1">
              Zarządzaj kategoriami transakcji. Kategoria &ldquo;Inne&rdquo; jest systemowa i nie może być usunięta.
            </p>
          </div>
          <Button onClick={handleAddCategory} aria-label="Dodaj kategorię" data-testid="add-category-button">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj kategorię
          </Button>
        </div>

        {/* Categories List */}
        <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
          <CategoriesList
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            transactionCounts={transactionCounts}
          />
        </div>
      </section>

      {/* Divider */}
      <hr className="border-gray-800" />

      {/* Section 2: Konto (Account) */}
      <section className="space-y-4">
        {/* Section Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Konto</h2>
          <p className="text-sm text-gray-400 mt-1">Usuń swoje konto i wszystkie powiązane dane.</p>
        </div>

        {/* Delete Account Section */}
        <DeleteAccountSection onDeleteAccount={handleDeleteAccount} />
      </section>

      {/* Modals and Dialogs */}
      <CategoryModal
        mode={categoryModalState.mode}
        isOpen={categoryModalState.isOpen}
        onClose={handleCloseCategoryModal}
        category={categoryModalState.category}
      />

      <DeleteCategoryDialog
        isOpen={deleteCategoryDialogState.isOpen}
        onClose={handleCloseDeleteCategoryDialog}
        category={deleteCategoryDialogState.category}
        transactionCount={deleteCategoryDialogState.transactionCount}
        onConfirm={handleConfirmDeleteCategory}
        isDeleting={deleteMutation.isPending}
      />

      <DeleteAccountDialog isOpen={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)} />
    </div>
  );
};
