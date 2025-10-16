import type {
  ListCategoriesResponseDto,
  CreateCategoryCommand,
  CreateCategoryResponseDto,
  UpdateCategoryCommand,
  UpdateCategoryResponseDto,
  CategoryDto,
} from "@/types";

/**
 * Fetch all categories from client-side API endpoint.
 *
 * @returns List of all user's categories, sorted alphabetically
 * @throws Error if API call fails
 */
export async function fetchCategories(): Promise<ListCategoriesResponseDto> {
  const response = await fetch("/api/categories", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch categories" }));
    throw new Error(error.message || "Failed to fetch categories");
  }

  return response.json();
}

/**
 * Create a new category from client-side API endpoint.
 *
 * @param data - Category creation command (name)
 * @returns Newly created category
 * @throws Error with specific message for duplicate names (409 Conflict)
 * @throws Error if API call fails
 */
export async function createCategory(
  data: CreateCategoryCommand
): Promise<CreateCategoryResponseDto> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create category" }));

    if (response.status === 409) {
      throw new Error("Kategoria o tej nazwie już istnieje");
    }

    throw new Error(error.message || "Nie udało się dodać kategorii");
  }

  return response.json();
}

/**
 * Update an existing category from client-side API endpoint.
 *
 * @param id - Category UUID
 * @param data - Category update command (name)
 * @returns Updated category
 * @throws Error with specific message for various error cases (403, 404, 409)
 * @throws Error if API call fails
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryCommand
): Promise<UpdateCategoryResponseDto> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update category" }));

    if (response.status === 403) {
      throw new Error("Nie można edytować tej kategorii");
    }

    if (response.status === 404) {
      throw new Error("Kategoria nie została znaleziona");
    }

    if (response.status === 409) {
      throw new Error("Kategoria o tej nazwie już istnieje");
    }

    throw new Error(error.message || "Nie udało się zaktualizować kategorii");
  }

  return response.json();
}

/**
 * Delete a category from client-side API endpoint.
 *
 * Database trigger automatically reassigns all transactions to "Inne" category before deletion.
 *
 * @param id - Category UUID
 * @returns void on success (204 No Content)
 * @throws Error with specific message for various error cases (403, 404)
 * @throws Error if API call fails
 */
export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to delete category" }));

    if (response.status === 403) {
      throw new Error("Nie można usunąć tej kategorii");
    }

    if (response.status === 404) {
      throw new Error("Kategoria nie została znaleziona");
    }

    throw new Error(error.message || "Nie udało się usunąć kategorii");
  }

  // 204 No Content - success
}

