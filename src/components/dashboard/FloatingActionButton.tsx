import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { FloatingActionButtonProps } from "@/lib/types/dashboard.types";

/**
 * FloatingActionButton (FAB) for quickly adding new transactions.
 *
 * Features:
 * - Fixed position at bottom-right corner
 * - Large circular button with plus icon
 * - Global keyboard shortcut: Ctrl+K
 * - Accessible with ARIA labels
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  // Global keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        onClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClick]);

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      size="icon"
      aria-label="Dodaj transakcję (Ctrl+K)"
    >
      <Plus className="h-8 w-8" />
    </Button>
  );
};
