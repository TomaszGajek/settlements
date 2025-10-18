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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    mode: "onChange", // Enable real-time validation
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

  // Listen for auth state changes and redirect when session is established
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Session is now established, safe to redirect
        const now = new Date();
        const dashboardUrl = `/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
        window.location.href = dashboardUrl;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        throw new Error(mapSupabaseError(signUpError));
      }

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        // Email confirmation required
        setUserEmail(data.email);
        setRegistrationSuccess(true);
        setIsSubmitting(false);
        return;
      }

      // Session created immediately (no email confirmation required)
      toast.success("Konto utworzone pomyślnie! Witaj w Settlements 👋");

      // Redirect will be handled by onAuthStateChange listener
      // The SIGNED_IN event will trigger automatic redirect to dashboard
      if (onSuccess) {
        onSuccess();
      }
      // Don't set isSubmitting to false here - let the redirect happen
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Show success message if email confirmation is required
  if (registrationSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Konto utworzone pomyślnie!</h3>
          <p className="text-sm text-muted-foreground">Wysłaliśmy link aktywacyjny na adres:</p>
          <p className="text-sm font-medium">{userEmail}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 text-left">
          <p className="text-sm text-blue-900">
            <strong>Sprawdź swoją skrzynkę email</strong> i kliknij w link potwierdzający, aby aktywować konto i móc się
            zalogować.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Nie otrzymałeś emaila? Sprawdź folder spam lub poczekaj kilka minut.
        </p>
      </div>
    );
  }

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
