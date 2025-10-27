import { useEffect, useRef, useCallback } from "react";

/**
 * Hook do zarządzania timeout'em sesji użytkownika
 * Automatycznie wylogowuje użytkownika po okresie nieaktywności
 *
 * @param onTimeout - Callback wywoływany po wygaśnięciu sesji
 * @param timeoutDuration - Czas nieaktywności w milisekundach (domyślnie 30 minut)
 */
export function useSessionTimeout(
  onTimeout: () => void,
  timeoutDuration: number = 30 * 60 * 1000 // 30 minut w milisekundach
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Resetuje timer nieaktywności
   */
  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Wyczyść poprzedni timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Ustaw nowy timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutDuration);
  }, [onTimeout, timeoutDuration]);

  /**
   * Handler dla eventów aktywności użytkownika
   */
  const handleActivity = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Eventy wskazujące na aktywność użytkownika
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    // Dodaj event listenery
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Inicjalizuj timer przy montowaniu
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity, resetTimeout]);

  /**
   * Zwraca czas ostatniej aktywności
   */
  const getLastActivity = useCallback(() => {
    return lastActivityRef.current;
  }, []);

  /**
   * Ręcznie wyczyść timeout (np. przy wylogowaniu)
   */
  const clearSessionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    resetTimeout,
    getLastActivity,
    clearSessionTimeout,
  };
}

