import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AuthErrorDisplayProps } from "@/lib/types/auth.types";

/**
 * Komponent wyświetlający błędy autentykacji w przyjaznej formie
 */
export function AuthErrorDisplay({ error, onDismiss }: AuthErrorDisplayProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="relative">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0"
          onClick={onDismiss}
          aria-label="Zamknij błąd"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
