import type { DailyChartDataPoint } from "@/lib/types/dashboard.types";

/**
 * Transform daily breakdown data from API to chart format.
 *
 * Converts YYYY-MM-DD dates to DD format for chart display.
 *
 * @param dailyBreakdown - Daily breakdown data from API
 * @returns Transformed data ready for chart rendering
 */
export function transformDailyBreakdown(
  dailyBreakdown: { date: string; income: number; expenses: number }[]
): DailyChartDataPoint[] {
  return dailyBreakdown.map((item) => ({
    date: item.date.split("-")[2], // Extract day (DD)
    fullDate: item.date, // Keep full date for reference
    income: item.income,
    expenses: item.expenses,
  }));
}

