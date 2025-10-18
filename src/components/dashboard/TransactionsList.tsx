import React, { useEffect, useRef, useCallback } from "react";
import { TransactionItem } from "./TransactionItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import type { TransactionsListProps } from "@/lib/types/dashboard.types";

/**
 * TransactionsList component displaying paginated transactions with infinite scroll.
 *
 * Features:
 * - Infinite scroll using IntersectionObserver
 * - Automatic pagination
 * - Empty state when no transactions
 * - Loading skeletons for initial load
 * - Inline spinner for loading more pages
 * - "End of list" message
 */
export const TransactionsList: React.FC<TransactionsListProps> = ({
  month,
  year,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useTransactions(month, year);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0,
      rootMargin: "200px", // Start loading 200px before reaching the element
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Flatten all pages into single array
  const transactions = data?.pages.flatMap((page) => page.transactions) || [];

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton variant="list" count={5} />;
  }

  // Error state
  if (isError) {
    return (
      <EmptyState
        title="Błąd ładowania transakcji"
        description="Nie udało się pobrać listy transakcji. Spróbuj odświeżyć stronę."
      />
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="Nie masz jeszcze żadnych transakcji w tym miesiącu"
        description="Dodaj swoją pierwszą transakcję, aby zobaczyć ją tutaj."
      />
    );
  }

  return (
    <div className="space-y-0" data-testid="transactions-list">
      {/* Transactions list */}
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
        />
      ))}

      {/* Intersection observer trigger */}
      <div ref={observerTarget} className="h-4" />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
        </div>
      )}

      {/* End of list message */}
      {!hasNextPage && transactions.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">To wszystkie transakcje</div>
      )}
    </div>
  );
};
