import type { SupabaseClient } from "@/db/supabase.client";
import type {
  ListCategoriesResponseDto,
  CategoryDto,
  CreateCategoryCommand,
  CreateCategoryResponseDto,
  UpdateCategoryCommand,
  UpdateCategoryResponseDto,
} from "@/types";

/**
 * Get all categories for the authenticated user.
 *
 * This function retrieves all categories from the database for the authenticated user.
 * Categories are automatically filtered by user_id via RLS (Row Level Security).
 * The results are sorted alphabetically by name and transformed to match the DTO format.
 *
 * @param supabase - Authenticated Supabase client (with user context from RLS)
 * @returns List of all user's categories, sorted alphabetically by name
 * @throws Error with detailed message if database operation fails
 *
 * @example
 * ```typescript
 * const categories = await listCategories(supabase);
 * // Returns:
 * // [
 * //   { id: "uuid-1", name: "Bills", isDeletable: true },
 * //   { id: "uuid-2", name: "Food", isDeletable: true },
 * //   { id: "uuid-3", name: "Other", isDeletable: false }
 * // ]
 * ```
 */
export async function listCategories(supabase: SupabaseClient): Promise<ListCategoriesResponseDto> {
  // Query categories for authenticated user
  // RLS automatically filters by user_id
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, is_deletable")
    .order("name", { ascending: true });

  // Handle database errors early
  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  // Transform database rows to DTOs
  // Map is_deletable → isDeletable for camelCase consistency
  const categoryDtos: CategoryDto[] = (categories || []).map((category) => ({
    id: category.id,
    name: category.name,
    isDeletable: category.is_deletable,
  }));

  return categoryDtos;
}

/**
 * Create a new category for the authenticated user.
 *
 * This function creates a new category in the database. The category name must be unique
 * per user (enforced by database UNIQUE constraint). User-created categories are always
 * deletable (is_deletable = true). The user_id is automatically set from the authenticated
 * session via RLS.
 *
 * @param supabase - Authenticated Supabase client (with user context)
 * @param command - Category creation data (name)
 * @returns Newly created category with id, name, and isDeletable
 * @throws Error with "DUPLICATE_NAME" message if category name already exists for user
 * @throws Error with detailed message for other database failures
 *
 * @example
 * ```typescript
 * const newCategory = await createCategory(supabase, { name: "Subscriptions" });
 * // Returns:
 * // {
 * //   id: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
 * //   name: "Subscriptions",
 * //   isDeletable: true
 * // }
 * ```
 */
export async function createCategory(
  supabase: SupabaseClient,
  command: CreateCategoryCommand
): Promise<CreateCategoryResponseDto> {
  // Get authenticated user early to fail fast if not authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Insert new category
  // RLS ensures user can only insert for their own user_id
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: command.name,
      is_deletable: true, // User-created categories are always deletable
    })
    .select("id, name, is_deletable")
    .single();

  // Handle database errors early
  if (error) {
    // Check for unique constraint violation (duplicate category name)
    // PostgreSQL error code 23505 = unique_violation
    if (error.code === "23505") {
      throw new Error("DUPLICATE_NAME");
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  // Ensure data was returned (should always be true with .single())
  if (!data) {
    throw new Error("Category created but could not be retrieved");
  }

  // Transform to DTO format (is_deletable → isDeletable)
  return {
    id: data.id,
    name: data.name,
    isDeletable: data.is_deletable,
  };
}

/**
 * Update a category's name for the authenticated user.
 *
 * This function updates an existing category's name. The category must exist,
 * belong to the authenticated user, and be editable (is_deletable = true).
 * The "Other" category cannot be renamed. The new name must be unique per user
 * (enforced by database UNIQUE constraint).
 *
 * @param supabase - Authenticated Supabase client (with user context)
 * @param categoryId - UUID of the category to update
 * @param command - Category update data (name)
 * @returns Updated category with id, name, and isDeletable
 * @throws Error with "NOT_FOUND" if category doesn't exist
 * @throws Error with "FORBIDDEN" if category belongs to another user
 * @throws Error with "NOT_EDITABLE" if category is not editable (is_deletable = false)
 * @throws Error with "DUPLICATE_NAME" if new name already exists for user
 * @throws Error with detailed message for other database failures
 *
 * @example
 * ```typescript
 * const updated = await updateCategory(supabase, "uuid-123", { name: "Monthly Subscriptions" });
 * // Returns:
 * // {
 * //   id: "uuid-123",
 * //   name: "Monthly Subscriptions",
 * //   isDeletable: true
 * // }
 * ```
 */
export async function updateCategory(
  supabase: SupabaseClient,
  categoryId: string,
  command: UpdateCategoryCommand
): Promise<UpdateCategoryResponseDto> {
  // Get authenticated user early to fail fast if not authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Check if category exists and get its current state
  // RLS ensures user can only see their own categories
  const { data: existingCategory, error: fetchError } = await supabase
    .from("categories")
    .select("id, user_id, is_deletable, name")
    .eq("id", categoryId)
    .single();

  // Handle not found or database errors early
  if (fetchError || !existingCategory) {
    throw new Error("NOT_FOUND");
  }

  // Verify category belongs to user (RLS should handle this, but double-check)
  if (existingCategory.user_id !== user.id) {
    throw new Error("FORBIDDEN");
  }

  // Check if category is editable
  // "Other" category has is_deletable = false and cannot be renamed
  if (!existingCategory.is_deletable) {
    throw new Error("NOT_EDITABLE");
  }

  // If name unchanged, return current category (no-op optimization)
  if (existingCategory.name === command.name) {
    return {
      id: existingCategory.id,
      name: existingCategory.name,
      isDeletable: existingCategory.is_deletable,
    };
  }

  // Update category name
  // RLS ensures user can only update their own categories
  const { data, error } = await supabase
    .from("categories")
    .update({ name: command.name })
    .eq("id", categoryId)
    .select("id, name, is_deletable")
    .single();

  // Handle database errors early
  if (error) {
    // Check for unique constraint violation (duplicate category name)
    // PostgreSQL error code 23505 = unique_violation
    if (error.code === "23505") {
      throw new Error("DUPLICATE_NAME");
    }
    throw new Error(`Failed to update category: ${error.message}`);
  }

  // Ensure data was returned (should always be true with .single())
  if (!data) {
    throw new Error("Category updated but could not be retrieved");
  }

  // Transform to DTO format (is_deletable → isDeletable)
  return {
    id: data.id,
    name: data.name,
    isDeletable: data.is_deletable,
  };
}

/**
 * Delete a category for the authenticated user.
 *
 * This function deletes an existing category. The category must exist,
 * belong to the authenticated user, and be deletable (is_deletable = true).
 * The "Other" category cannot be deleted. Before deletion, a database trigger
 * automatically reassigns all transactions associated with the deleted category
 * to the user's "Other" category.
 *
 * @param supabase - Authenticated Supabase client (with user context)
 * @param categoryId - UUID of the category to delete
 * @returns void on successful deletion
 * @throws Error with "NOT_FOUND" if category doesn't exist
 * @throws Error with "FORBIDDEN" if category belongs to another user
 * @throws Error with "NOT_DELETABLE" if category is not deletable (is_deletable = false)
 * @throws Error with detailed message for other database failures
 *
 * @example
 * ```typescript
 * await deleteCategory(supabase, "uuid-123");
 * // Category deleted, transactions reassigned to "Other" by database trigger
 * ```
 */
export async function deleteCategory(supabase: SupabaseClient, categoryId: string): Promise<void> {
  // Get authenticated user early to fail fast if not authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Check if category exists and get its current state
  // RLS ensures user can only see their own categories
  const { data: existingCategory, error: fetchError } = await supabase
    .from("categories")
    .select("id, user_id, is_deletable")
    .eq("id", categoryId)
    .single();

  // Handle not found or database errors early
  if (fetchError || !existingCategory) {
    throw new Error("NOT_FOUND");
  }

  // Verify category belongs to user (RLS should handle this, but double-check)
  if (existingCategory.user_id !== user.id) {
    throw new Error("FORBIDDEN");
  }

  // Check if category is deletable
  // "Other" category has is_deletable = false and cannot be deleted
  if (!existingCategory.is_deletable) {
    throw new Error("NOT_DELETABLE");
  }

  // Delete category (trigger will reassign transactions to "Other")
  // RLS ensures user can only delete their own categories
  const { error, count } = await supabase.from("categories").delete({ count: "exact" }).eq("id", categoryId);

  // Handle database errors early
  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  // Verify deletion occurred
  if (count === 0) {
    // This shouldn't happen since we already checked existence
    throw new Error("DELETE_FAILED");
  }

  // Success - category deleted, transactions reassigned by database trigger
}
