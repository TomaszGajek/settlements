import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabaseClient } from "@/db/supabase.client";
import { registerFormSchema } from "@/lib/schemas/auth.schema";
import type { RegisterFormData, RegisterFormProps } from "@/lib/types/auth.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { PasswordRequirements } from "./PasswordRequirements";
import { AuthErrorDisplay } from "./AuthErrorDisplay";

/**
 * Helper function to map Supabase errors to user-friendly messages
 */
function mapSupabaseError(error: unknown): string {
  const errorMessage = (error as { message?: string })?.message || "";

  switch (errorMessage) {
    case "User already registered":
      return "Użytkownik o tym adresie email już istnieje";
    case "Password should be at least 6 characters":
      return "Hasło musi mieć minimum 6 znaków";
    default:
      if (errorMessage.includes("Email")) {
        return "Nieprawidłowy format adresu email";
      }
      return "Wystąpił błąd. Spróbuj ponownie później";
  }
}

/**
 * Formularz rejestracji nowego użytkownika
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = form.watch("password");

  // Auto-focus na email przy montowaniu
  useEffect(() => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  // Handle redirect after successful registration
  useEffect(() => {
    if (shouldRedirect) {
      const now = new Date();
      const dashboardUrl = `/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
      window.location.href = dashboardUrl;
    }
  }, [shouldRedirect]);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signUpError } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        throw new Error(mapSupabaseError(signUpError));
      }

      toast.success("Konto utworzone pomyślnie! Witaj w Settlements 👋");

      // Redirect do dashboard (handled by middleware/auth state change)
      if (onSuccess) {
        onSuccess();
      } else {
        // Trigger redirect via effect
        setShouldRedirect(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <AuthErrorDisplay error={error} onDismiss={() => setError(null)} />}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="twoj@email.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hasło</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••" autoComplete="new-password" disabled={isSubmitting} {...field} />
              </FormControl>
              <PasswordRequirements password={passwordValue} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potwierdź hasło</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••" autoComplete="new-password" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting ? "Rejestracja..." : "Zarejestruj"}
        </Button>
      </form>
    </Form>
  );
}
