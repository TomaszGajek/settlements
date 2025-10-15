import type { ListCategoriesResponseDto } from "@/types";

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

