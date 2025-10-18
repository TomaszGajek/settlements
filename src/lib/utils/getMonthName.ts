/**
 * Get Polish month name for a given month number.
 *
 * @param month - Month number (1-12)
 * @returns Polish month name
 */
export function getMonthName(month: number): string {
  const months = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];

  return months[month - 1] || "Nieprawidłowy miesiąc";
}
