/**
 * Format date string to specified format.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param format - Output format ("DD.MM" or "DD.MM.YYYY")
 * @returns Formatted date string
 */
export function formatDate(date: string, format: "DD.MM" | "DD.MM.YYYY"): string {
  const [year, month, day] = date.split("-");

  if (format === "DD.MM") {
    return `${day}.${month}`;
  }

  return `${day}.${month}.${year}`;
}

