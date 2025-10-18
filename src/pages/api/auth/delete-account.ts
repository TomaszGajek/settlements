import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/db/supabase.admin";

/**
 * DELETE /api/auth/delete-account
 *
 * Permanently deletes the authenticated user's account and all associated data.
 *
 * This endpoint performs a complete account deletion:
 * - Deletes the user from auth.users (Supabase Auth)
 * - Database CASCADE automatically deletes:
 *   - User profile (public.profiles)
 *   - All user categories (public.categories)
 *   - All user transactions (public.transactions)
 *
 * This operation is irreversible and cannot be undone.
 *
 * Authentication: Required (user must be logged in)
 *
 * Responses:
 * - 204 No Content: Account deleted successfully (empty response body)
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Failed to delete account
 *
 * @example Request:
 * ```bash
 * DELETE /api/auth/delete-account
 * Authorization: Bearer <JWT_TOKEN>
 * ```
 *
 * @example Response (204 No Content):
 * ```
 * HTTP/1.1 204 No Content
 * Content-Length: 0
 * ```
 *
 * @security
 * - Requires valid authentication token
 * - Uses Supabase Admin client to bypass RLS
 * - Database CASCADE handles data cleanup
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // 1. Check authentication early
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Delete user using Supabase Admin client
    // This will cascade delete all user data via database foreign key constraints
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("[Delete Account API] Supabase delete error:", deleteError);
      throw deleteError;
    }

    // 3. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // 4. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Delete Account API] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while deleting the account",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
