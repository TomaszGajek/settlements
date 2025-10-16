import type { APIRoute } from "astro";
import { z } from "zod";
import { updateCategory, deleteCategory } from "@/lib/services/categories.service";

/**
 * Validation schema for category ID path parameter.
 * Validates the UUID format for category endpoints.
 */
const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

/**
 * Validation schema for updating a category.
 * Validates the request body for PATCH /api/categories/{id} endpoint.
 */
const UpdateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});

/**
 * PATCH /api/categories/{id}
 *
 * Update a category's name for the authenticated user.
 *
 * This endpoint allows users to rename their editable categories. The "Inne"
 * category cannot be renamed (is_deletable = false). The new name must be unique
 * per user. Only the category's name can be updated.
 *
 * Path parameters:
 * - id (string, UUID): ID of the category to update
 *
 * Request body:
 * - name (string, required): New category name, max 100 characters, must be unique per user
 *
 * Responses:
 * - 200 OK: Category updated successfully (returns updated category)
 * - 400 Bad Request: Invalid UUID format or validation errors
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: Category is not editable or belongs to another user
 * - 404 Not Found: Category doesn't exist
 * - 409 Conflict: New name already exists for user
 * - 500 Internal Server Error: Unexpected error
 *
 * @example Request:
 * ```bash
 * PATCH /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
 * Authorization: Bearer <JWT_TOKEN>
 * Content-Type: application/json
 *
 * {
 *   "name": "Monthly Subscriptions"
 * }
 * ```
 *
 * @example Response (200 OK):
 * ```json
 * {
 *   "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
 *   "name": "Monthly Subscriptions",
 *   "isDeletable": true
 * }
 * ```
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = CategoryIdSchema.safeParse({ id: params.id });

    if (!idValidation.success) {
      const errors = idValidation.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            id: errors.id?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: categoryId } = idValidation.data;

    // 2. Check authentication
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

    // 3. Parse request body
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

    // 4. Validate request body using Zod schema
    const validationResult = UpdateCategorySchema.safeParse(body);

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

    // 5. Call service layer to update category
    const category = await updateCategory(locals.supabase, categoryId, {
      name: validData.name,
    });

    // 6. Return success response with updated category
    return new Response(JSON.stringify(category), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 7. Handle specific errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Category not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "FORBIDDEN") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to update this category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "NOT_EDITABLE") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Cannot update non-editable category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "DUPLICATE_NAME") {
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
    }

    // 8. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Update Category API] Unexpected error:", error);

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
 * DELETE /api/categories/{id}
 *
 * Delete a specific category for the authenticated user.
 *
 * This endpoint allows users to delete their own deletable categories. The "Inne"
 * category cannot be deleted (is_deletable = false). Before deletion, a database
 * trigger automatically reassigns all transactions associated with the deleted
 * category to the user's "Inne" category, ensuring no transactions are orphaned.
 *
 * Path parameters:
 * - id (string, UUID): ID of the category to delete
 *
 * Responses:
 * - 204 No Content: Category deleted successfully (empty response body)
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: Category is not deletable or belongs to another user
 * - 404 Not Found: Category doesn't exist
 * - 500 Internal Server Error: Unexpected error
 *
 * @example Request:
 * ```bash
 * DELETE /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
 * Authorization: Bearer <JWT_TOKEN>
 * ```
 *
 * @example Response (204 No Content):
 * ```
 * HTTP/1.1 204 No Content
 * Content-Length: 0
 * ```
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = CategoryIdSchema.safeParse({ id: params.id });

    if (!idValidation.success) {
      const errors = idValidation.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            id: errors.id?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: categoryId } = idValidation.data;

    // 2. Check authentication
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

    // 3. Call service layer to delete category
    await deleteCategory(locals.supabase, categoryId);

    // 4. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // 5. Handle specific errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Category not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "FORBIDDEN") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to delete this category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "NOT_DELETABLE") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Cannot delete non-deletable category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 6. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Delete Category API] Unexpected error:", error);

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
