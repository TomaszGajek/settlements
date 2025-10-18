/**
 * Parse currency string to number.
 * Removes spaces and converts comma to dot for parsing.
 *
 * @param formatted - Formatted currency string (e.g., "1 234,50" or "1234,50")
 * @returns Parsed number or undefined if invalid
 *
 * @example
 * parseCurrency("1 234,50") // 1234.5
 * parseCurrency("150,00") // 150
 * parseCurrency("abc") // undefined
 */
export function parseCurrency(formatted: string): number | undefined {
  if (!formatted || typeof formatted !== "string") {
    return undefined;
  }

  // Remove all spaces and "zł" suffix
  const cleaned = formatted.replace(/\s/g, "").replace("zł", "").replace(",", ".");

  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? undefined : parsed;
}
