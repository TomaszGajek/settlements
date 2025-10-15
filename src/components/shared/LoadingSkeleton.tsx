import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Loading skeleton component for various dashboard elements.
 * Provides visual feedback while data is being fetched.
 */

interface LoadingSkeletonProps {
  variant: "card" | "chart" | "list" | "transaction";
  count?: number; // For list items
}

/**
 * Generic skeleton component with pulsing animation
 */
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
);

/**
 * Skeleton for summary cards
 */
const CardSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </CardHeader>
  </Card>
);

/**
 * Skeleton for daily chart
 */
const ChartSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-end gap-2 h-64">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 100 + 50}px` }} />
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton for single transaction item
 */
const TransactionSkeleton: React.FC = () => (
  <div className="flex items-center justify-between py-3 px-4 border-b border-gray-800">
    <div className="flex items-center gap-4 flex-1">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-6 w-20" />
  </div>
);

/**
 * Skeleton for transaction list
 */
const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-0">
    {Array.from({ length: count }).map((_, i) => (
      <TransactionSkeleton key={i} />
    ))}
  </div>
);

/**
 * Main LoadingSkeleton component that renders appropriate skeleton based on variant
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant, count = 5 }) => {
  switch (variant) {
    case "card":
      return <CardSkeleton />;
    case "chart":
      return <ChartSkeleton />;
    case "list":
      return <ListSkeleton count={count} />;
    case "transaction":
      return <TransactionSkeleton />;
    default:
      return null;
  }
};

