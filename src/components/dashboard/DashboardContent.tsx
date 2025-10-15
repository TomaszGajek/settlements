import React, { useState, useEffect } from "react";
import { DatePeriodNav } from "./DatePeriodNav";
import { SummaryCards } from "./SummaryCards";
import { DailyChart } from "./DailyChart";
import { TransactionsList } from "./TransactionsList";
import { FloatingActionButton } from "./FloatingActionButton";
import { TransactionModal } from "./TransactionModal";
import { DeleteDialog } from "./DeleteDialog";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { useDatePeriod } from "@/lib/contexts/DatePeriodContext";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useTransactionMutations } from "@/lib/hooks/useTransactionMutations";
import { transformDailyBreakdown } from "@/lib/utils/transformDailyBreakdown";
import type { TransactionModalState, DeleteDialogState } from "@/lib/types/dashboard.types";
import type { TransactionDto } from "@/types";

/**
 * DashboardContent - main dashboard component.
 *
 * Features:
 * - Integrates all dashboard subcomponents
 * - Manages modal states (transaction create/edit, delete)
 * - Handles data fetching via React Query
 * - Provides callbacks for user interactions
 * - Error boundary for graceful error handling
 */
export const DashboardContent: React.FC = () => {
  // URL-based date period management
  const { period } = useDatePeriod();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard(period.month, period.year);

  // Transaction mutations
  const { deleteMutation } = useTransactionMutations();

  // Modal states
  const [transactionModalState, setTransactionModalState] = useState<TransactionModalState>({
    isOpen: false,
    mode: "create",
    transaction: undefined,
  });

  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    transaction: undefined,
  });

  // Handlers for transaction actions
  const handleAddTransaction = () => {
    setTransactionModalState({
      isOpen: true,
      mode: "create",
      transaction: undefined,
    });
  };

  const handleEditTransaction = (transaction: TransactionDto) => {
    setTransactionModalState({
      isOpen: true,
      mode: "edit",
      transaction,
    });
  };

  const handleDeleteTransaction = (transactionId: string) => {
    // Find transaction to show in delete dialog
    // Note: We need to find it from the transactions list
    // For now, we'll just set the ID and fetch details in the dialog
    // A better approach would be to pass the full transaction
    setDeleteDialogState({
      isOpen: true,
      transaction: undefined, // Will be set by parent component
    });
  };

  const handleDeleteTransactionWithData = (transaction: TransactionDto) => {
    setDeleteDialogState({
      isOpen: true,
      transaction,
    });
  };

  const handleCloseTransactionModal = () => {
    setTransactionModalState({
      isOpen: false,
      mode: "create",
      transaction: undefined,
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogState({
      isOpen: false,
      transaction: undefined,
    });
  };

  const handleConfirmDelete = async (transactionId: string) => {
    await deleteMutation.mutateAsync(transactionId);
  };

  // Transform daily breakdown for chart
  const chartData = dashboardData?.dailyBreakdown ? transformDailyBreakdown(dashboardData.dailyBreakdown) : [];

  return (
    <>
      {/* Offline indicator */}
      <OfflineIndicator />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Date period navigation */}
        <DatePeriodNav />

        <ErrorBoundary>
          {/* Summary cards */}
          <SummaryCards
            income={dashboardData?.summary.income || 0}
            expenses={dashboardData?.summary.expenses || 0}
            balance={dashboardData?.summary.balance || 0}
            isLoading={dashboardLoading}
          />

          {/* Transactions list */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 mb-6">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">Transakcje</h2>
            </div>
            <TransactionsList
              month={period.month}
              year={period.year}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransactionWithData}
            />
          </div>

          {/* Daily chart */}
          <DailyChart data={chartData} isLoading={dashboardLoading} />
        </ErrorBoundary>

        {/* Floating action button */}
        <FloatingActionButton onClick={handleAddTransaction} />

        {/* Transaction modal */}
        <TransactionModal
          mode={transactionModalState.mode}
          isOpen={transactionModalState.isOpen}
          onClose={handleCloseTransactionModal}
          transaction={transactionModalState.transaction}
        />

        {/* Delete dialog */}
        {deleteDialogState.transaction && (
          <DeleteDialog
            isOpen={deleteDialogState.isOpen}
            onClose={handleCloseDeleteDialog}
            transaction={deleteDialogState.transaction}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </>
  );
};

