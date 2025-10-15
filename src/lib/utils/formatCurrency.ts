/**
 * Format number as PLN currency.
 *
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "150,75 zł")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

