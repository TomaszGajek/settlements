/**
 * Delete the authenticated user's account.
 *
 * This function calls the DELETE /api/auth/delete-account endpoint to permanently
 * delete the user's account and all associated data. This operation is irreversible.
 *
 * Database CASCADE will automatically delete:
 * - User profile (public.profiles)
 * - All user categories (public.categories)
 * - All user transactions (public.transactions)
 * - Auth user record (auth.users)
 *
 * @returns void on success (204 No Content)
 * @throws Error if API call fails
 *
 * @example
 * ```typescript
 * try {
 *   await deleteUserAccount();
 *   // Account deleted successfully
 *   // User should be logged out and redirected to login page
 * } catch (error) {
 *   console.error('Failed to delete account:', error);
 * }
 * ```
 */
export async function deleteUserAccount(): Promise<void> {
  const response = await fetch("/api/auth/delete-account", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to delete account" }));

    throw new Error(error.message || "Nie udało się usunąć konta");
  }

  // 204 No Content - success
}
