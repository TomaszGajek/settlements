import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TypeToggleProps {
  value: "income" | "expense";
  onChange: (value: "income" | "expense") => void;
  disabled?: boolean;
}

/**
 * TypeToggle component for selecting transaction type (Income/Expense).
 *
 * Features:
 * - Uses Tabs component for visual toggle
 * - Color coding: Expense (default), Income (green accent)
 * - Keyboard navigation: Arrow left/right
 * - Accessible with proper ARIA attributes
 *
 * @param value - Current transaction type
 * @param onChange - Callback when type changes
 * @param disabled - Whether the toggle is disabled
 */
export const TypeToggle: React.FC<TypeToggleProps> = ({ value, onChange, disabled = false }) => {
  return (
    <Tabs value={value} onValueChange={(newValue) => onChange(newValue as "income" | "expense")} disabled={disabled}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expense" disabled={disabled} data-testid="transaction-type-expense">
          Wydatek
        </TabsTrigger>
        <TabsTrigger
          value="income"
          disabled={disabled}
          data-testid="transaction-type-income"
          className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400"
        >
          Przychód
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
