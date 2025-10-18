import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { useDeleteAccount } from "@/lib/hooks/useDeleteAccount";

export interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DeleteAccountDialog component for confirming account deletion.
 *
 * Features:
 * - Multi-step confirmation (password + checkbox)
 * - Password input for authentication
 * - Confirmation checkbox ("I understand...")
 * - Disabled submit until both conditions met
 * - Lists what will be deleted (transactions, categories, account)
 * - Severe warning alerts
 * - Loading state during deletion
 * - Auto-logout and redirect on success
 * - Integration with useDeleteAccount hook
 *
 * Security:
 * - Requires password verification before deletion
 * - Explicit user confirmation required
 * - Cannot be undone
 *
 * @param isOpen - Whether dialog is visible
 * @param onClose - Callback to close dialog
 */
export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmed(false);
    }
  }, [isOpen]);

  // Check if user can proceed with deletion
  const canDelete = password.length > 0 && confirmed && !deleteAccountMutation.isPending;

  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      await deleteAccountMutation.mutateAsync(password);
      // Success handling is done in the hook (logout, redirect, toast)
      // Dialog will close automatically after redirect
    } catch {
      // Error handling is done in the hook (toast)
      // Keep dialog open so user can try again
    }
  };

  // Focus password input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const passwordInput = document.getElementById("delete-account-password") as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń konto?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Severe Warning */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>UWAGA:</strong> Ta operacja jest nieodwracalna!
                </AlertDescription>
              </Alert>

              {/* What will be deleted */}
              <div className="space-y-2">
                <p className="text-sm">Zostaną trwale usunięte:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                  <li>Wszystkie transakcje</li>
                  <li>Wszystkie kategorie</li>
                  <li>Twoje konto użytkownika</li>
                </ul>
              </div>

              {/* Password Confirmation */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="delete-account-password">Potwierdź hasłem</Label>
                  <Input
                    id="delete-account-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wpisz swoje hasło"
                    disabled={deleteAccountMutation.isPending}
                    aria-label="Hasło"
                    aria-describedby="password-description"
                  />
                  <p id="password-description" className="text-xs text-gray-400">
                    Wprowadź swoje hasło, aby potwierdzić tożsamość
                  </p>
                </div>

                {/* Confirmation Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-account-confirm"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(!!checked)}
                    disabled={deleteAccountMutation.isPending}
                    aria-describedby="confirm-description"
                  />
                  <Label htmlFor="delete-account-confirm" className="text-sm cursor-pointer font-normal">
                    Rozumiem, że ta operacja jest nieodwracalna
                  </Label>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={deleteAccountMutation.isPending}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={!canDelete} className="bg-red-600 hover:bg-red-700">
            {deleteAccountMutation.isPending ? "Usuwanie..." : "Usuń konto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
