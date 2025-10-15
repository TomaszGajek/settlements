import React from "react";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { DatePeriodProvider } from "@/lib/contexts/DatePeriodContext";
import { DashboardContent } from "./DashboardContent";

/**
 * DashboardApp - wrapper component that provides React Query and DatePeriod contexts.
 *
 * This component wraps DashboardContent with:
 * - QueryProvider for React Query
 * - DatePeriodProvider for shared date period state
 */
export const DashboardApp: React.FC = () => {
  return (
    <QueryProvider>
      <DatePeriodProvider>
        <DashboardContent />
      </DatePeriodProvider>
    </QueryProvider>
  );
};

