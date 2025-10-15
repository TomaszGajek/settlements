import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabaseClient } from "@/db/supabase.client";
import { resetPasswordFormSchema } from "@/lib/schemas/auth.schema";
import type { ResetPasswordFormData, ResetPasswordFormProps } from "@/lib/types/auth.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { CheckCircle2 } from "lucide-react";

/**
 * Helper function to map Supabase errors to user-friendly messages
 */
function mapSupabaseError(error: unknown): string {
  const errorMessage = (error as { message?: string })?.message || "";

  if (errorMessage.includes("Email")) {
    return "Nieprawidłowy format adresu email";
  }
  return "Wystąpił błąd. Spróbuj ponownie później";
}

/**
 * Formularz resetowania hasła
 */
export function ResetPasswordForm({ defaultEmail }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: defaultEmail || "",
    },
  });

  // Auto-focus na email przy montowaniu
  useEffect(() => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (emailInput && !defaultEmail) {
      emailInput.focus();
    }
  }, [defaultEmail]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (resetError) {
        throw new Error(mapSupabaseError(resetError));
      }

      const successMsg = `Link do resetowania hasła został wysłany na ${data.email}. Sprawdź swoją skrzynkę email.`;
      setSuccessMessage(successMsg);
      toast.success("Link wysłany! Sprawdź swoją skrzynkę email.");
      form.reset({ email: "" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <AuthErrorDisplay error={error} onDismiss={() => setError(null)} />}

        {successMessage && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">{successMessage}</AlertDescription>
          </Alert>
        )}

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

        <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
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
