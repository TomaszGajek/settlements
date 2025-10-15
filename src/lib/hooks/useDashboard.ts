import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/lib/services/dashboard.client";

/**
 * React Query hook to fetch dashboard summary for a specific month and year.
 *
 * Automatically refetches when month or year changes.
 * Data is considered stale after 30 seconds.
 *
 * @param month - Month to retrieve data for (1-12)
 * @param year - Year to retrieve data for (e.g., 2025)
 * @returns React Query result with dashboard data, loading state, and error
 */
export function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: ["dashboard", month, year],
    queryFn: () => fetchDashboardSummary(month, year),
    staleTime: 0, // Always refetch when period changes
    refetchOnWindowFocus: false,
  });
}

