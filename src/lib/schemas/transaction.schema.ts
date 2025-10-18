import { z } from "zod";

/**
 * Schema walidacji dla formularza transakcji.
 * Używany w TransactionModal do walidacji danych przed wysłaniem do API.
 */
export const transactionFormSchema = z.object({
  /**
   * Kwota transakcji.
   * - Wymagana
   * - Musi być liczbą dodatnią
   * - Maksymalna wartość: 999,999,999.99
   * - Maksymalnie 2 miejsca po przecinku
   */
  amount: z
    .number({ required_error: "Kwota jest wymagana" })
    .positive("Kwota musi być większa od 0")
    .max(999999999.99, "Kwota jest zbyt duża")
    .refine((val) => {
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 2;
    }, "Maksymalnie 2 miejsca po przecinku"),

  /**
   * Data transakcji.
   * - Wymagana
   * - Format: YYYY-MM-DD
   * - Musi być prawidłową datą
   */
  date: z
    .string({ required_error: "Data jest wymagana" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty")
    .refine((date) => !isNaN(Date.parse(date)), "Nieprawidłowa data"),

  /**
   * ID kategorii.
   * - Wymagane
   * - Musi być prawidłowym UUID
   */
  categoryId: z.string({ required_error: "Kategoria jest wymagana" }).uuid("Nieprawidłowa kategoria"),

  /**
   * Typ transakcji.
   * - Wymagany
   * - Może być: "income" lub "expense"
   */
  type: z.enum(["income", "expense"], {
    required_error: "Typ jest wymagany",
  }),

  /**
   * Notatka do transakcji.
   * - Opcjonalna
   * - Maksymalna długość: 500 znaków
   */
  note: z.string().max(500, "Notatka może mieć maksymalnie 500 znaków").optional().nullable(),
});

/**
 * Typ wnioskowany ze schematu walidacji.
 * Używany w komponentach do określenia typu danych formularza.
 */
export type TransactionFormSchema = z.infer<typeof transactionFormSchema>;
