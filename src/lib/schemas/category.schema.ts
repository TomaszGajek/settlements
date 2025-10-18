import { z } from "zod";

/**
 * Validation schema for category form (create and edit).
 *
 * This schema validates user input for category names:
 * - Required: name field must be provided
 * - Min length: 1 character (after trimming)
 * - Max length: 100 characters
 * - Reserved: cannot use "Inne" (case-insensitive) - reserved for system category
 * - Trimming: automatically trims whitespace
 *
 * @example
 * ```typescript
 * const result = categoryFormSchema.safeParse({ name: "Transport" });
 * if (result.success) {
 *   console.log(result.data.name); // "Transport"
 * }
 * ```
 */
export const categoryFormSchema = z.object({
  name: z
    .string({ required_error: "Nazwa kategorii jest wymagana" })
    .min(1, "Nazwa kategorii nie może być pusta")
    .max(100, "Nazwa kategorii może mieć maksymalnie 100 znaków")
    .trim()
    .refine((name) => name.toLowerCase() !== "inne", 'Nie można użyć nazwy "Inne" (jest zarezerwowana)'),
});

/**
 * TypeScript type inferred from categoryFormSchema.
 * Use this type for form data and component props.
 */
export type CategoryFormData = z.infer<typeof categoryFormSchema>;
