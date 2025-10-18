import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDatePeriod } from "@/lib/contexts/DatePeriodContext";
import { getMonthName } from "@/lib/utils/getMonthName";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DatePeriodNav component for navigating between months and years.
 *
 * Features:
 * - Previous/Next month buttons
 * - Current period display (e.g., "Październik 2025")
 * - Year dropdown selector
 * - Keyboard shortcuts (left/right arrows)
 * - Prevents navigation to future months
 */
export const DatePeriodNav: React.FC = () => {
  const { period, nextMonth, prevMonth, setYear, canGoNext } = useDatePeriod();

  // Keyboard shortcuts for month navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevMonth();
      } else if (e.key === "ArrowRight" && canGoNext) {
        e.preventDefault();
        nextMonth();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevMonth, nextMonth, canGoNext]);

  // Generate year options (current year - 5 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="mb-6">
      {/* Period navigation */}
      <div className="flex items-center gap-4 justify-center">
        {/* Previous month button */}
        <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Poprzedni miesiąc" className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Current period display */}
        <div className="flex items-center gap-4">
          <span className="text-2xl font-semibold text-gray-100">
            {getMonthName(period.month)} {period.year}
          </span>

          {/* Year selector */}
          <Select value={String(period.year)} onValueChange={(value) => setYear(parseInt(value, 10))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Next month button */}
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          disabled={!canGoNext}
          aria-label="Następny miesiąc"
          className="shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
