import type { DashboardSummaryDto } from "@/types";

/**
 * Fetch dashboard summary from client-side API endpoint.
 * Used by React Query hooks for client-side data fetching.
 *
 * @param month - Month to retrieve data for (1-12)
 * @param year - Year to retrieve data for (e.g., 2025)
 * @returns Dashboard summary with totals and daily breakdown
 * @throws Error if API call fails
 */
export async function fetchDashboardSummary(month: number, year: number): Promise<DashboardSummaryDto> {
  const response = await fetch(`/api/dashboard?month=${month}&year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch dashboard" }));
    throw new Error(error.message || "Failed to fetch dashboard");
  }

  return response.json();
}
