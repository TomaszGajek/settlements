/**
 * Settings components barrel export.
 *
 * This file provides convenient access to all Settings-related components.
 * Import components from this file instead of individual files.
 *
 * @example
 * ```tsx
 * import { SettingsApp, SettingsContent, CategoryItem, CategoryModal } from '@/components/settings';
 * ```
 */

// Main app wrapper
export { SettingsApp } from "./SettingsApp";

// Main container
export { SettingsContent } from "./SettingsContent";

// Account components
export { AccountInfoCard } from "./AccountInfoCard";

// Category components
export { CategoryItem } from "./CategoryItem";
export { CategoriesList } from "./CategoriesList";
export { CategoryForm } from "./CategoryForm";
export { CategoryModal } from "./CategoryModal";
export { DeleteCategoryDialog } from "./DeleteCategoryDialog";

// Account components
export { DeleteAccountSection } from "./DeleteAccountSection";
export { DeleteAccountDialog } from "./DeleteAccountDialog";

// Re-export types
export type { CategoryModalProps } from "./CategoryModal";
export type { DeleteCategoryDialogProps } from "./DeleteCategoryDialog";
export type { DeleteAccountDialogProps } from "./DeleteAccountDialog";
