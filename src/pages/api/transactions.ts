import type { APIRoute } from "astro";
import { z } from "zod";
import { createTransaction, listTransactions } from "@/lib/services/transactions.service";

/**
 * Validation schema for listing transactions query parameters.
 *
 * Validates:
 * - month: number between 1 and 12 (required)
 * - year: number between 1900 and 2100 (required)
 * - page: positive integer, defaults to 1 (optional)
 * - pageSize: integer between 1 and 100, defaults to 20 (optional)
 */
const TransactionsQuerySchema = z.object({
  month: z.coerce
    .number({ required_error: "Month is required" })
    .int()
    .min(1, "Month must be at least 1")
    .max(12, "Month must be at most 12"),
  year: z.coerce
    .number({ required_error: "Year is required" })
    .int()
    .min(1900, "Year must be at least 1900")
    .max(2100, "Year must be at most 2100"),
  page: z
    .string()
    .nullish()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  pageSize: z
    .string()
    .nullish()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1, "Page size must be at least 1").max(100, "Page size must be at most 100")),
});

/**
 * Validation schema for creating a new transaction.
 *
 * Validates:
 * - amount: positive number with max 2 decimal places
 * - date: ISO date string (YYYY-MM-DD) that represents a valid calendar date
 * - categoryId: valid UUID format
 * - type: must be either "income" or "expense"
 * - note: optional string with max 500 characters
 */
const CreateTransactionSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be positive")
    .refine((val) => {
      // Validate max 2 decimal places
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 2;
    }, "Amount can have at most 2 decimal places"),

  date: z
    .string({ required_error: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),

  categoryId: z.string({ required_error: "Category ID is required" }).uuid("Category ID must be a valid UUID"),

  type: z.enum(["income", "expense"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be either 'income' or 'expense'",
  }),

  note: z.string().max(500, "Note must be at most 500 characters").optional().nullable(),
});

/**
 * GET /api/transactions
 *
 * Retrieve a paginated list of transactions for a specific month and year.
 *
 * Query parameters:
 * - month (number, required): Month to retrieve data for (1-12)
 * - year (number, required): Year to retrieve data for (e.g., 2025)
 * - page (number, optional): Page number for pagination (default: 1)
 * - pageSize (number, optional): Items per page (default: 20, max: 100)
 *
 * Responses:
 * - 200 OK: List of transactions with pagination metadata
 * - 400 Bad Request: Validation errors (invalid month, year, page, or pageSize)
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ url, locals }) => {
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

    // 2. Extract query parameters
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");

    // 3. Validate query parameters
    const validationResult = TransactionsQuerySchema.safeParse({
      month,
      year,
      page,
      pageSize,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.format();

      // Extract only the first error message for each field
      const details: Record<string, string | undefined> = {};
      if (errors.month?._errors[0]) details.month = errors.month._errors[0];
      if (errors.year?._errors[0]) details.year = errors.year._errors[0];
      if (errors.page?._errors[0]) details.page = errors.page._errors[0];
      if (errors.pageSize?._errors[0]) details.pageSize = errors.pageSize._errors[0];

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

    const {
      month: validMonth,
      year: validYear,
      page: validPage,
      pageSize: validPageSize,
    } = validationResult.data;

    // 4. Call service layer to retrieve transactions
    const result = await listTransactions(
      locals.supabase,
      validMonth,
      validYear,
      validPage ?? 1,
      validPageSize ?? 20
    );

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[List Transactions API] Unexpected error:", error);

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
 * POST /api/transactions
 *
 * Create a new transaction.
 *
 * Request body:
 * - amount (number, required): Transaction amount, must be positive with max 2 decimals
 * - date (string, required): Transaction date in YYYY-MM-DD format
 * - categoryId (string, required): UUID of the category to assign
 * - type (string, required): Either "income" or "expense"
 * - note (string, optional): Optional description, max 500 characters
 *
 * Responses:
 * - 201 Created: Transaction created successfully
 * - 400 Bad Request: Validation errors
 * - 401 Unauthorized: User not authenticated
 * - 422 Unprocessable Entity: Invalid category ID or category doesn't belong to user
 * - 500 Internal Server Error: Unexpected error
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

    // 3. Validate request body
    const validationResult = CreateTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();

      // Extract only the first error message for each field
      const details: Record<string, string | undefined> = {};
      if (errors.amount?._errors[0]) details.amount = errors.amount._errors[0];
      if (errors.date?._errors[0]) details.date = errors.date._errors[0];
      if (errors.categoryId?._errors[0]) details.categoryId = errors.categoryId._errors[0];
      if (errors.type?._errors[0]) details.type = errors.type._errors[0];
      if (errors.note?._errors[0]) details.note = errors.note._errors[0];

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

    // 4. Call service layer to create transaction
    const transaction = await createTransaction(locals.supabase, {
      amount: validData.amount,
      date: validData.date,
      categoryId: validData.categoryId,
      type: validData.type,
      note: validData.note,
    });

    // 5. Return success response with 201 Created
    return new Response(JSON.stringify(transaction), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle specific business logic errors
    if (error instanceof Error && error.message === "INVALID_CATEGORY") {
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

    // 7. Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[Create Transaction API] Unexpected error:", error);

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
