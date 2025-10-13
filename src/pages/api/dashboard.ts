import type { APIRoute } from "astro";
import { z } from "zod";
import { getDashboardSummary } from "@/lib/services/dashboard.service";

/**
 * Zod schema for validating dashboard query parameters.
 * Ensures month is between 1-12 and year is within reasonable range.
 */
const DashboardQuerySchema = z.object({
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
});

/**
 * GET /api/dashboard
 *
 * Retrieves aggregated financial summary for a specific month and year.
 *
 * @query month - Month to retrieve data for (1-12)
 * @query year - Year to retrieve data for (e.g., 2025)
 *
 * @returns 200 - Dashboard summary with totals and daily breakdown
 * @returns 400 - Invalid query parameters
 * @returns 401 - User not authenticated
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Check authentication
    // Extract user from authenticated Supabase client
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    // Handle authentication errors
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

    // 2. Extract and validate query parameters
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    const validationResult = DashboardQuerySchema.safeParse({ month, year });

    if (!validationResult.success) {
      // Format validation errors for better user experience
      const errors = validationResult.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            month: errors.month?._errors[0],
            year: errors.year?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { month: validMonth, year: validYear } = validationResult.data;

    // 3. Call service layer to fetch and aggregate dashboard data
    const dashboardData = await getDashboardSummary(locals.supabase, validMonth, validYear);

    // 4. Return success response
    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Handle unexpected errors
    // Log error for debugging but don't expose internals to client
    // eslint-disable-next-line no-console
    console.error("[Dashboard API] Unexpected error:", error);

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
