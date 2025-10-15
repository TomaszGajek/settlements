import { useCallback, useState, useEffect, useMemo } from "react";
import type { DatePeriod } from "@/lib/types/dashboard.types";

/**
 * Custom hook to manage date period (month/year) via URL params.
 * This is the source of truth for the current selected period in the dashboard.
 *
 * Uses URL search params to persist state across page reloads.
 * Falls back to current month/year if params are missing or invalid.
 *
 * @returns Object with current period and functions to navigate between periods
 */
export function useDatePeriod() {
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
      const newPeriod = current.month === 12 
        ? { month: 1, year: current.year + 1 }
        : { month: current.month + 1, year: current.year };
      
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
    console.log("⏮️ prevMonth called");
    setPeriodState((current) => {
      console.log("⏮️ Current period:", current);
      const newPeriod = current.month === 1
        ? { month: 12, year: current.year - 1 }
        : { month: current.month - 1, year: current.year };
      
      console.log("⏮️ New period:", newPeriod);
      
      // Update URL
      const newParams = new URLSearchParams();
      newParams.set("month", String(newPeriod.month));
      newParams.set("year", String(newPeriod.year));
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.pushState({}, "", newUrl);
      
      console.log("⏮️ URL updated:", newUrl);
      
      return newPeriod;
    });
  }, []);

  // Set year (resets to January of that year)
  const setYear = useCallback(
    (newYear: number) => {
      setPeriod({ month: 1, year: newYear });
    },
    [setPeriod]
  );

  // Check if we can navigate to next month (not in the future)
  const canGoNext = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return !(period.month === currentMonth && period.year === currentYear);
  }, [period]);

  return {
    period,
    setPeriod,
    nextMonth,
    prevMonth,
    setYear,
    canGoNext,
  };
}

