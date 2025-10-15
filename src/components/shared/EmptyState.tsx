import React from "react";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/lib/types/dashboard.types";

/**
 * EmptyState component shown when there's no data to display.
 * Provides visual feedback and optional action button.
 *
 * @param title - Main heading text
 * @param description - Descriptive text below title
 * @param actionLabel - Optional button label
 * @param onAction - Optional button click handler
 * @param illustration - Optional custom illustration element
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div className="mb-6 text-gray-600">
          <svg
            className="w-24 h-24 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-400 mb-6 max-w-md">{description}</p>

      {/* Action button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

