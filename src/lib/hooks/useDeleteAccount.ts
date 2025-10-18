import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUserAccount } from "@/lib/services/auth.service";
import { supabaseClient } from "@/db/supabase.client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

/**
 * React Query mutation hook for deleting user account.
 *
 * This hook handles the complete account deletion flow:
 * 1. Verifies user password (authentication check)
 * 2. Calls API to delete account (CASCADE deletes all user data)
 * 3. Clears all cached data (React Query)
 * 4. Signs out the user (Supabase)
 * 5. Redirects to home page
 *
 * @returns Mutation object with mutate function that accepts password string
 *
 * @example
 * ```tsx
 * const deleteAccountMutation = useDeleteAccount();
 *
 * const handleDelete = async (password: string) => {
 *   try {
 *     await deleteAccountMutation.mutateAsync(password);
 *     // User is now logged out and redirected
 *   } catch (error) {
 *     // Error toast is shown automatically
 *   }
 * };
 * ```
 */
export function useDeleteAccount() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      // Step 1: Verify password by attempting to sign in
      // This ensures the user knows their password before deleting account
      if (!user?.email) {
        throw new Error("Użytkownik nie jest zalogowany");
      }

      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (signInError) {
        throw new Error("Nieprawidłowe hasło");
      }

      // Step 2: Delete user account via API
      // This will cascade delete all user data (profile, categories, transactions)
      await deleteUserAccount();
    },
    onSuccess: async () => {
      // Step 3: Clear all cached data
      queryClient.clear();

      // Step 4: Sign out user
      await signOut();

      // Step 5: Show success toast and redirect
      toast.success("Konto zostało usunięte");

      // Redirect to home page (login)
      window.location.href = "/";
    },
    onError: (error: Error) => {
      // Show error toast with translated message
      toast.error(error.message || "Nie udało się usunąć konta");
      console.error("Delete account error:", error);
    },
  });

  return deleteAccountMutation;
}
