import type { SupabaseClient } from "@/db/supabase.client";
import type { DashboardSummaryDto } from "@/types";

/**
 * Get dashboard summary for a specific month and year.
 * Aggregates all transactions for the period and calculates totals and daily breakdown.
 *
 * @param supabase - Authenticated Supabase client (with user context from RLS)
 * @param month - Month to retrieve data for (1-12)
 * @param year - Year to retrieve data for (e.g., 2025)
 * @returns Dashboard summary with totals and daily breakdown
 * @throws Error if database query fails
 */
export async function getDashboardSummary(
  supabase: SupabaseClient,
  month: number,
  year: number
): Promise<DashboardSummaryDto> {
  // Calculate date range for the specified month
  // month - 1 because Date months are 0-indexed
  const startDate = new Date(year, month - 1, 1);
  // new Date(year, month, 0) gets the last day of the previous month (which is the target month)
  const endDate = new Date(year, month, 0);

  // Convert to ISO date strings (YYYY-MM-DD format)
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // Query transactions for the specified period
  // RLS policies automatically filter by authenticated user_id
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, amount, type, date")
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Initialize summary totals
  let totalIncome = 0;
  let totalExpenses = 0;

  // Initialize daily breakdown map (key: date, value: {income, expenses})
  const dailyMap = new Map<string, { income: number; expenses: number }>();

  // Process all transactions
  for (const transaction of transactions || []) {
    const amount = Number(transaction.amount);

    // Update summary totals
    if (transaction.type === "income") {
      totalIncome += amount;
    } else if (transaction.type === "expense") {
      totalExpenses += amount;
    }

    // Update daily breakdown
    const dateKey = transaction.date;
    const dailyData = dailyMap.get(dateKey) || { income: 0, expenses: 0 };

    if (transaction.type === "income") {
      dailyData.income += amount;
    } else if (transaction.type === "expense") {
      dailyData.expenses += amount;
    }

    dailyMap.set(dateKey, dailyData);
  }

  // Convert daily map to array and sort by date
  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Return formatted response with 2 decimal precision
  return {
    summary: {
      income: Math.round(totalIncome * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    },
    dailyBreakdown,
  };
}
