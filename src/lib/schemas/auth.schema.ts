import { z } from "zod";

/**
 * Schema walidacji formularza logowania
 */
export const loginFormSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email")
    .toLowerCase()
    .trim(),

  password: z.string({ required_error: "Hasło jest wymagane" }).min(6, "Hasło musi mieć minimum 6 znaków"),
});

/**
 * Schema walidacji formularza rejestracji
 */
export const registerFormSchema = z
  .object({
    email: z
      .string({ required_error: "Email jest wymagany" })
      .email("Nieprawidłowy format adresu email")
      .toLowerCase()
      .trim(),

    password: z.string({ required_error: "Hasło jest wymagane" }).min(6, "Hasło musi mieć minimum 6 znaków"),

    confirmPassword: z.string({ required_error: "Potwierdzenie hasła jest wymagane" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema walidacji formularza resetowania hasła
 */
export const resetPasswordFormSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email")
    .toLowerCase()
    .trim(),
});

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;


