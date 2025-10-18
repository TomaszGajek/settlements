import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { parseCurrency } from "@/lib/utils/parseCurrency";

export interface AmountInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * AmountInput component with PLN currency formatting.
 *
 * Features:
 * - Auto-formats input as user types
 * - Displays formatted value with Polish locale (e.g., "1 234,50")
 * - Parses input to number for form state
 * - Handles backspace/delete naturally on formatted value
 * - Supports paste with auto-parsing
 *
 * Format examples:
 * - User types "150" → displays "150"
 * - User types "150.5" → displays "150,5"
 * - User types "1234.50" → displays "1 234,50"
 *
 * @param value - Current amount value (number)
 * @param onChange - Callback when amount changes
 * @param error - Error message to display
 * @param disabled - Whether the input is disabled
 */
export const AmountInput: React.FC<AmountInputProps> = ({ value, onChange, error, disabled = false }) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  // Format value for display when value prop changes
  useEffect(() => {
    if (value === undefined || value === 0) {
      setDisplayValue("");
    } else {
      // Format with Polish locale
      const formatted = new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
      setDisplayValue(formatted);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow empty input
    if (input === "") {
      setDisplayValue("");
      onChange(undefined);
      return;
    }

    // Parse input to number
    const parsed = parseCurrency(input);

    // Update display value immediately for better UX
    setDisplayValue(input);

    // Update form value
    onChange(parsed);
  };

  const handleBlur = () => {
    // Re-format on blur for clean display
    if (value !== undefined && value !== 0) {
      const formatted = new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
      setDisplayValue(formatted);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        data-testid="transaction-amount-input"
        aria-label="Kwota transakcji"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? "amount-error" : undefined}
        className={error ? "border-red-500" : ""}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
        zł
      </span>
    </div>
  );
};
