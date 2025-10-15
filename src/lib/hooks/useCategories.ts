import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/services/categories.client";

/**
 * React Query hook to fetch all categories for the authenticated user.
 *
 * Categories are cached for 5 minutes as they rarely change.
 *
 * @returns React Query result with categories data, loading state, and error
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 300_000, // 5 minutes - categories change rarely
    refetchOnWindowFocus: false,
  });
}

