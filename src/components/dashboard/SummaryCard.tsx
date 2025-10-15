import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import type { SummaryCardProps } from "@/lib/types/dashboard.types";

/**
 * SummaryCard component for displaying financial summary data.
 *
 * Features:
 * - Different variants with color coding (income, expenses, balance)
 * - Icon based on variant
 * - Loading skeleton state
 * - Formatted currency display
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({ variant, value, isLoading }) => {
  // Loading state
  if (isLoading) {
    return <LoadingSkeleton variant="card" />;
  }

  // Variant configuration
  const config = {
    income: {
      label: "Przychody",
      icon: ArrowUpCircle,
      textColor: "text-green-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    expenses: {
      label: "Wydatki",
      icon: ArrowDownCircle,
      textColor: "text-red-500",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-500",
    },
    balance: {
      label: "Bilans",
      icon: Wallet,
      textColor: value >= 0 ? "text-green-500" : "text-red-500",
      bgColor: value >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      iconColor: value >= 0 ? "text-green-500" : "text-red-500",
    },
  };

  const { label, icon: Icon, textColor, bgColor, iconColor } = config[variant];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${textColor}`}>{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  );
};

