import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabaseClient } from "@/db/supabase.client";
import { updatePasswordFormSchema } from "@/lib/schemas/auth.schema";
import type { UpdatePasswordFormData, UpdatePasswordFormProps } from "@/lib/types/auth.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { PasswordInput } from "./PasswordInput";
import { AlertCircle } from "lucide-react";

/**
 * Helper function to map Supabase errors to user-friendly messages
 */
function mapSupabaseError(error: unknown): string {
  const errorMessage = (error as { message?: string })?.message || "";

  if (errorMessage.includes("same")) {
    return "Nowe hasło nie może być takie samo jak poprzednie";
  }
  if (errorMessage.includes("weak")) {
    return "Hasło jest zbyt słabe. Użyj silniejszego hasła";
  }
  return "Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie później";
}

/**
 * Formularz zmiany hasła (po kliknięciu w link z emaila)
 */
export function UpdatePasswordForm({ onSuccess }: UpdatePasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data.session) {
          setHasValidSession(false);
          setError("Link do resetowania hasła wygasł lub jest nieprawidłowy. Spróbuj ponownie zresetować hasło.");
        } else {
          setHasValidSession(true);
        }
      } catch (err) {
        setHasValidSession(false);
        setError("Wystąpił błąd podczas weryfikacji sesji");
      }
    };

    checkSession();
  }, []);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Update the password using Supabase
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw new Error(mapSupabaseError(updateError));
      }

      toast.success("Hasło zostało zmienione pomyślnie!");

      // Redirect to dashboard after successful password update
      setTimeout(() => {
        const now = new Date();
        window.location.href = `/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
      }, 1000);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking session
  if (hasValidSession === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Weryfikacja sesji...</p>
        </div>
      </div>
    );
  }

  // Show error if no valid session
  if (!hasValidSession) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Link do resetowania hasła wygasł lub jest nieprawidłowy. Spróbuj ponownie zresetować hasło.
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <a href="/reset-password" className="text-sm text-primary hover:underline underline-offset-4">
            Wyślij nowy link resetujący
          </a>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <AuthErrorDisplay error={error} onDismiss={() => setError(null)} />}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nowe hasło</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Wprowadź nowe hasło"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  showRequirements
                  {...field}
                />
              </FormControl>
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
                <PasswordInput
                  placeholder="Potwierdź nowe hasło"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting ? "Zmiana hasła..." : "Zmień hasło"}
        </Button>

        <div className="text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            Powrót do logowania
          </a>
        </div>
      </form>
    </Form>
  );
}
