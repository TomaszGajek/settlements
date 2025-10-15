import React from "react";
import { SummaryCard } from "./SummaryCard";
import type { SummaryCardsProps } from "@/lib/types/dashboard.types";

/**
 * SummaryCards component - container for three summary cards.
 *
 * Displays:
 * - Income card (green)
 * - Expenses card (red)
 * - Balance card (green if positive, red if negative)
 *
 * Uses CSS Grid for responsive 3-column layout.
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({ income, expenses, balance, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <SummaryCard variant="income" value={income} isLoading={isLoading} />
      <SummaryCard variant="expenses" value={expenses} isLoading={isLoading} />
      <SummaryCard variant="balance" value={balance} isLoading={isLoading} />
    </div>
  );
};

