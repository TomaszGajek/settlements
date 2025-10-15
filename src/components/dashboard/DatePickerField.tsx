import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * DatePickerField component with calendar popover.
 *
 * Features:
 * - Calendar popover with date selection
 * - Display format: DD.MM.YYYY (Polish locale)
 * - Internal format: YYYY-MM-DD (ISO)
 * - Optional min/max date constraints
 * - Keyboard navigation: Arrow keys, Enter, Escape
 * - Accessible with proper ARIA attributes
 *
 * @param value - Current date value in YYYY-MM-DD format
 * @param onChange - Callback when date changes
 * @param error - Error message to display
 * @param disabled - Whether the picker is disabled
 * @param minDate - Minimum selectable date (optional)
 * @param maxDate - Maximum selectable date (optional)
 */
export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  minDate,
  maxDate,
}) => {
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return "Wybierz datę";

    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yyyy", { locale: pl });
    } catch {
      return "Wybierz datę";
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format to YYYY-MM-DD
      const formatted = format(date, "yyyy-MM-dd");
      onChange(formatted);
    }
  };

  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-red-500"
          )}
          disabled={disabled}
          aria-label="Wybierz datę transakcji"
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? "date-error" : undefined}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            // By default, don't allow future dates
            if (!maxDate && date > new Date()) return true;
            // Don't allow dates before 1900
            if (date < new Date("1900-01-01")) return true;
            return false;
          }}
          initialFocus
          locale={pl}
        />
      </PopoverContent>
    </Popover>
  );
};

