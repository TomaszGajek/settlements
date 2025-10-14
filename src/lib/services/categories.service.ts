import type { SupabaseClient } from "@/db/supabase.client";
import type { ListCategoriesResponseDto, CategoryDto } from "@/types";

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
