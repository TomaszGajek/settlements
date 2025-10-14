import type { APIRoute } from "astro";
import { listCategories } from "@/lib/services/categories.service";

/**
 * GET /api/categories
 *
 * Retrieve a list of all categories for the authenticated user.
 *
 * This endpoint returns all categories (both user-created and default categories)
 * sorted alphabetically by name. The "Other" category has isDeletable set to false
 * and cannot be deleted.
 *
 * Query parameters: None
 *
 * Responses:
 * - 200 OK: Array of category objects with id, name, and isDeletable
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Unexpected error
 *
 * @example Response (200 OK):
 * ```json
 * [
 *   {
 *     "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
 *     "name": "Bills",
 *     "isDeletable": true
 *   },
 *   {
 *     "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
 *     "name": "Food",
 *     "isDeletable": true
 *   },
 *   {
 *     "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
 *     "name": "Other",
 *     "isDeletable": false
 *   }
 * ]
 * ```
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // 2. Call service layer to retrieve categories
    // RLS automatically filters categories by authenticated user
    const categories = await listCategories(locals.supabase);

    // 3. Return success response
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 4. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Categories API] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
