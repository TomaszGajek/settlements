import { useQuery } from "@tanstack/react-query";
import { useCategories } from "./useCategories";
import { supabaseClient } from "@/db/supabase.client";
import { useMemo } from "react";

/**
 * Fetch transaction counts per category using Supabase client.
 *
 * This is optimized for Settings page - fetches only category_id field
 * and counts transactions per category on the client side.
 *
 * @returns Object mapping category IDs to transaction counts
 */
async function fetchTransactionCounts(): Promise<Record<string, number>> {
  // Fetch only category_id field for all user transactions
  const { data: transactions, error } = await supabaseClient
    .from("transactions")
    .select("category_id");

  if (error) {
    throw new Error(`Failed to fetch transaction counts: ${error.message}`);
  }

  // Count transactions per category
  const counts: Record<string, number> = {};

  for (const transaction of transactions || []) {
    if (transaction.category_id) {
      counts[transaction.category_id] = (counts[transaction.category_id] || 0) + 1;
    }
  }

  return counts;
}

/**
 * React Query hook to fetch categories with transaction counts.
 *
 * Combines categories data with transaction counts for each category.
 * Used in Settings page to display how many transactions are in each category.
 *
 * @returns Object with categories (including transactionCount) and loading state
 *
 * @example
 * ```tsx
 * const { categoriesWithCounts, transactionCounts, isLoading } = useCategoriesWithCount();
 *
 * categoriesWithCounts.forEach(cat => {
 *   console.log(`${cat.name}: ${cat.transactionCount} transactions`);
 * });
 * ```
 */
export function useCategoriesWithCount() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const {
    data: transactionCounts,
    isLoading: countsLoading,
    error,
  } = useQuery({
    queryKey: ["transaction-counts"],
    queryFn: fetchTransactionCounts,
    staleTime: 60_000, // 1 minute - counts change when transactions are created/deleted
    refetchOnWindowFocus: false,
  });

  // Combine categories with transaction counts
  const categoriesWithCounts = useMemo(() => {
    if (!categories || !transactionCounts) return [];

    return categories.map((category) => ({
      ...category,
      transactionCount: transactionCounts[category.id] || 0,
    }));
  }, [categories, transactionCounts]);

  return {
    categoriesWithCounts,
    transactionCounts: transactionCounts || {},
    isLoading: categoriesLoading || countsLoading,
    error,
  };
}

