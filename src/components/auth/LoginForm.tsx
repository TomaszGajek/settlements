import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabaseClient } from "@/db/supabase.client";
import { loginFormSchema } from "@/lib/schemas/auth.schema";
import type { LoginFormData, LoginFormProps } from "@/lib/types/auth.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { AuthErrorDisplay } from "./AuthErrorDisplay";

/**
 * Helper function to map Supabase errors to user-friendly messages
 */
function mapSupabaseError(error: unknown): string {
  const errorMessage = (error as { message?: string })?.message || "";

  switch (errorMessage) {
    case "Invalid login credentials":
      return "Nieprawidłowy email lub hasło";
    case "Email not confirmed":
      return "Email nie został potwierdzony";
    default:
      if (errorMessage.includes("Email")) {
        return "Nieprawidłowy format adresu email";
      }
      return "Wystąpił błąd. Spróbuj ponownie później";
  }
}

/**
 * Formularz logowania z walidacją email i hasła
 */
export function LoginForm({ defaultEmail, onSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: defaultEmail || "",
      password: "",
    },
  });

  // Auto-focus na email przy montowaniu
  useEffect(() => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (emailInput && !defaultEmail) {
      emailInput.focus();
    }
  }, [defaultEmail]);

  // Handle redirect after successful login
  useEffect(() => {
    if (shouldRedirect) {
      const now = new Date();
      const dashboardUrl = `/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
      window.location.href = dashboardUrl;
    }
  }, [shouldRedirect]);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw new Error(mapSupabaseError(signInError));
      }

      toast.success("Zalogowano pomyślnie! Przekierowywanie...");

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

      // Focus na email przy błędzie
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
      }
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
                  aria-label="Adres email"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.email}
                  aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                  {...field}
                />
              </FormControl>
              <FormMessage id="email-error" />
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
                <PasswordInput
                  placeholder="••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-label="Hasło"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.password}
                  aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                  {...field}
                />
              </FormControl>
              <FormMessage id="password-error" />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end">
          <a
            href="/reset-password"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Zapomniałem hasła
          </a>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !form.formState.isValid}
          aria-label={isSubmitting ? "Logowanie w toku" : "Zaloguj się"}
        >
          {isSubmitting ? "Logowanie..." : "Zaloguj"}
        </Button>
      </form>
    </Form>
  );
}
