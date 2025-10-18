import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { DatePeriod } from "@/lib/types/dashboard.types";

interface DatePeriodContextValue {
  period: DatePeriod;
  setPeriod: (period: DatePeriod) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  setYear: (year: number) => void;
  canGoNext: boolean;
}

const DatePeriodContext = createContext<DatePeriodContextValue | undefined>(undefined);

/**
 * Provider for date period state management.
 * Manages URL sync and provides navigation functions.
 */
export function DatePeriodProvider({ children }: { children: React.ReactNode }) {
  // Initialize period from URL or current date
  const getInitialPeriod = (): DatePeriod => {
    if (typeof window === "undefined") {
      const now = new Date();
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }

    const params = new URLSearchParams(window.location.search);
    const now = new Date();
    const monthParam = params.get("month");
    const yearParam = params.get("year");

    let month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    let year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    // Validate month (1-12)
    if (isNaN(month) || month < 1 || month > 12) {
      month = now.getMonth() + 1;
    }

    // Validate year (1900-2100)
    if (isNaN(year) || year < 1900 || year > 2100) {
      year = now.getFullYear();
    }

    return { month, year };
  };

  // Use direct state for period
  const [period, setPeriodState] = useState<DatePeriod>(getInitialPeriod);

  // Listen to URL changes (for browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setPeriodState(getInitialPeriod());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update URL with new period
  const setPeriod = useCallback((newPeriod: DatePeriod) => {
    const newParams = new URLSearchParams();
    newParams.set("month", String(newPeriod.month));
    newParams.set("year", String(newPeriod.year));

    // Update URL without page reload
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Update state to trigger re-render
    setPeriodState(newPeriod);
  }, []);

  // Navigate to next month
  const nextMonth = useCallback(() => {
    setPeriodState((current) => {
      const newPeriod =
        current.month === 12 ? { month: 1, year: current.year + 1 } : { month: current.month + 1, year: current.year };

      // Update URL
      const newParams = new URLSearchParams();
      newParams.set("month", String(newPeriod.month));
      newParams.set("year", String(newPeriod.year));
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.pushState({}, "", newUrl);

      return newPeriod;
    });
  }, []);

  // Navigate to previous month
  const prevMonth = useCallback(() => {
    setPeriodState((current) => {
      const newPeriod =
        current.month === 1 ? { month: 12, year: current.year - 1 } : { month: current.month - 1, year: current.year };

      // Update URL
      const newParams = new URLSearchParams();
      newParams.set("month", String(newPeriod.month));
      newParams.set("year", String(newPeriod.year));
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.pushState({}, "", newUrl);

      return newPeriod;
    });
  }, []);

  // Set year (keep current month)
  const setYear = useCallback((newYear: number) => {
    setPeriodState((current) => {
      const newPeriod = { month: current.month, year: newYear };

      // Update URL
      const newParams = new URLSearchParams();
      newParams.set("month", String(newPeriod.month));
      newParams.set("year", String(newPeriod.year));
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.pushState({}, "", newUrl);

      return newPeriod;
    });
  }, []);

  // Check if we can navigate to next month (not in the future)
  const canGoNext = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return !(period.month === currentMonth && period.year === currentYear);
  }, [period]);

  const value = {
    period,
    setPeriod,
    nextMonth,
    prevMonth,
    setYear,
    canGoNext,
  };

  return <DatePeriodContext.Provider value={value}>{children}</DatePeriodContext.Provider>;
}

/**
 * Hook to access date period context.
 * Must be used within DatePeriodProvider.
 */
export function useDatePeriod() {
  const context = useContext(DatePeriodContext);

  if (!context) {
    throw new Error("useDatePeriod must be used within DatePeriodProvider");
  }

  return context;
}
