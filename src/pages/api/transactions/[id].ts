import type { APIRoute } from "astro";
import { z } from "zod";
import { updateTransaction } from "@/lib/services/transactions.service";

/**
 * Validation schema for transaction ID path parameter.
 *
 * Validates:
 * - id: must be a valid UUID format
 */
const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});

/**
 * Validation schema for updating a transaction.
 *
 * Validates:
 * - amount: positive number with max 2 decimal places (optional)
 * - date: ISO date string (YYYY-MM-DD) that represents a valid calendar date (optional)
 * - categoryId: valid UUID format (optional)
 * - type: must be either "income" or "expense" (optional)
 * - note: optional string with max 500 characters (nullable)
 * - At least one field must be provided for update
 */
const UpdateTransactionSchema = z
  .object({
    amount: z
      .number()
      .positive("Amount must be positive")
      .refine((val) => {
        // Validate max 2 decimal places
        const decimals = val.toString().split(".")[1];
        return !decimals || decimals.length <= 2;
      }, "Amount can have at most 2 decimal places")
      .optional(),

    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => !isNaN(Date.parse(date)), "Invalid date")
      .optional(),

    categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),

    type: z
      .enum(["income", "expense"], {
        invalid_type_error: "Type must be either 'income' or 'expense'",
      })
      .optional(),

    note: z.string().max(500, "Note must be at most 500 characters").optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * PATCH /api/transactions/{id}
 *
 * Update an existing transaction (partial update).
 *
 * Path parameters:
 * - id (string, required): UUID of the transaction to update
 *
 * Request body (all fields optional, but at least one required):
 * - amount (number, optional): Transaction amount, must be positive with max 2 decimals
 * - date (string, optional): Transaction date in YYYY-MM-DD format
 * - categoryId (string, optional): UUID of the category to assign
 * - type (string, optional): Either "income" or "expense"
 * - note (string, optional, nullable): Optional description, max 500 characters
 *
 * Responses:
 * - 200 OK: Transaction updated successfully
 * - 400 Bad Request: Validation errors (invalid ID, invalid fields, no fields provided)
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: Transaction belongs to another user
 * - 404 Not Found: Transaction doesn't exist
 * - 422 Unprocessable Entity: Invalid category ID or category doesn't belong to user
 * - 500 Internal Server Error: Unexpected error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter (transaction ID)
    const idValidation = TransactionIdSchema.safeParse({ id: params.id });

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

    const { id: transactionId } = idValidation.data;

    // 2. Check authentication early
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

    // 4. Validate request body
    const validationResult = UpdateTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();

      // Extract only the first error message for each field
      const details: Record<string, string | undefined> = {};
      if (errors.amount?._errors[0]) details.amount = errors.amount._errors[0];
      if (errors.date?._errors[0]) details.date = errors.date._errors[0];
      if (errors.categoryId?._errors[0]) details.categoryId = errors.categoryId._errors[0];
      if (errors.type?._errors[0]) details.type = errors.type._errors[0];
      if (errors.note?._errors[0]) details.note = errors.note._errors[0];
      if (errors._errors && errors._errors.length > 0) {
        details._errors = errors._errors[0];
      }

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validData = validationResult.data;

    // 5. Call service layer to update transaction
    const transaction = await updateTransaction(locals.supabase, transactionId, {
      amount: validData.amount,
      date: validData.date,
      categoryId: validData.categoryId,
      type: validData.type,
      note: validData.note,
    });

    // 6. Return success response with 200 OK
    return new Response(JSON.stringify(transaction), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 7. Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Transaction not found",
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
            message: "You do not have permission to update this transaction",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "INVALID_CATEGORY") {
        return new Response(
          JSON.stringify({
            error: "Unprocessable Entity",
            message: "Invalid category ID or category does not belong to user",
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 8. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Update Transaction API] Unexpected error:", error);

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
