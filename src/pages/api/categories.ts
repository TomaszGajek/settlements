import type { APIRoute } from "astro";
import { z } from "zod";
import { listCategories, createCategory } from "@/lib/services/categories.service";

/**
 * Validation schema for creating a category.
 * Validates the request body for POST /api/categories endpoint.
 */
const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});

/**
 * GET /api/categories
 *
 * Retrieve a list of all categories for the authenticated user.
 *
 * This endpoint returns all categories (both user-created and default categories)
 * sorted alphabetically by name. The "Inne" category has isDeletable set to false
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
 *     "name": "Rachunki",
 *     "isDeletable": true
 *   },
 *   {
 *     "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
 *     "name": "Jedzenie",
 *     "isDeletable": true
 *   },
 *   {
 *     "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
 *     "name": "Inne",
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

/**
 * POST /api/categories
 *
 * Create a new category for the authenticated user.
 *
 * This endpoint allows users to create custom categories for organizing transactions.
 * Category names must be unique per user (case-sensitive). The name is trimmed of
 * whitespace and must be between 1-100 characters.
 *
 * Request body:
 * - name (string, required): Category name, max 100 characters
 *
 * Responses:
 * - 201 Created: Category created successfully
 * - 400 Bad Request: Invalid request body or validation error
 * - 401 Unauthorized: User not authenticated
 * - 409 Conflict: Category with this name already exists
 * - 500 Internal Server Error: Unexpected error
 *
 * @example Request body:
 * ```json
 * {
 *   "name": "Subscriptions"
 * }
 * ```
 *
 * @example Response (201 Created):
 * ```json
 * {
 *   "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
 *   "name": "Subscriptions",
 *   "isDeletable": true
 * }
 * ```
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validate request body using Zod schema
    const validationResult = CreateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            name: errors.name?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validData = validationResult.data;

    // 4. Call service layer to create category
    const category = await createCategory(locals.supabase, {
      name: validData.name,
    });

    // 5. Return success response with 201 Created
    return new Response(JSON.stringify(category), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle specific error: duplicate category name
    if (error instanceof Error && error.message === "DUPLICATE_NAME") {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "A category with this name already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 7. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Create Category API] Unexpected error:", error);

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
