import React from "react";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { DatePeriodProvider } from "@/lib/contexts/DatePeriodContext";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Header } from "@/components/shared/Header";
import { DashboardContent } from "./DashboardContent";

/**
 * DashboardApp - wrapper component that provides all necessary contexts.
 *
 * This component wraps DashboardContent with:
 * - AuthProvider for authentication state
 * - QueryProvider for React Query
 * - DatePeriodProvider for shared date period state
 * - Header with navigation
 */
export const DashboardApp: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-950">
        <Header currentPage="dashboard" />
        <QueryProvider>
          <DatePeriodProvider>
            <DashboardContent />
          </DatePeriodProvider>
        </QueryProvider>
      </div>
    </AuthProvider>
  );
};

