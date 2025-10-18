import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import type { DailyChartProps } from "@/lib/types/dashboard.types";

/**
 * DailyChart component displaying daily income and expenses as a bar chart.
 *
 * Features:
 * - Responsive bar chart using Recharts
 * - Green bars for income, red bars for expenses
 * - Custom dark theme tooltip
 * - Loading skeleton state
 * - X-axis shows day numbers (DD)
 * - Y-axis shows amounts in PLN
 */
export const DailyChart: React.FC<DailyChartProps> = ({ data, isLoading }) => {
  // Loading state
  if (isLoading) {
    return <LoadingSkeleton variant="chart" />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dzienny wykres przychodów i wydatków</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">Brak danych do wyświetlenia</div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const date = payload[0]?.payload?.date;
    const income = payload.find((p: any) => p.dataKey === "income")?.value || 0;
    const expenses = payload.find((p: any) => p.dataKey === "expenses")?.value || 0;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm font-medium mb-2">Dzień {date}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-sm text-gray-300">
              Przychody: <span className="font-semibold text-green-500">{income.toFixed(2)} zł</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-sm text-gray-300">
              Wydatki: <span className="font-semibold text-red-500">{expenses.toFixed(2)} zł</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Dzienny wykres przychodów i wydatków</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1F2937" }} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="square"
              formatter={(value) => {
                const labels: Record<string, string> = {
                  income: "Przychody",
                  expenses: "Wydatki",
                };
                return <span className="text-gray-300">{labels[value] || value}</span>;
              }}
            />
            <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
