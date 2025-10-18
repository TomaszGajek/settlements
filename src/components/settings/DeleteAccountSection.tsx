import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";

export interface DeleteAccountSectionProps {
  onDeleteAccount: () => void;
}

/**
 * DeleteAccountSection component - "Danger Zone" in Settings.
 *
 * Features:
 * - Destructive alert with clear warning
 * - Explains consequences of account deletion
 * - Red destructive button
 * - Icon indicators (AlertTriangle, Trash2)
 *
 * @param onDeleteAccount - Callback when user clicks "Usuń konto"
 */
export const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({ onDeleteAccount }) => {
  return (
    <div className="space-y-4">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Strefa niebezpieczna</AlertTitle>
        <AlertDescription>
          Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, w tym transakcji, kategorii i ustawień.
          Ta operacja jest nieodwracalna.
        </AlertDescription>
      </Alert>

      {/* Delete Account Button */}
      <Button variant="destructive" onClick={onDeleteAccount} className="w-full sm:w-auto">
        <Trash2 className="w-4 h-4 mr-2" />
        Usuń konto
      </Button>
    </div>
  );
};
