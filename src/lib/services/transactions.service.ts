import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateTransactionCommand,
  CreateTransactionResponseDto,
  ListTransactionsResponseDto,
  TransactionDto,
  UpdateTransactionCommand,
  UpdateTransactionResponseDto,
} from "@/types";

/**
 * Create a new transaction.
 *
 * This function inserts a new transaction into the database and returns the complete
 * transaction object including category details. The transaction is automatically
 * associated with the authenticated user via RLS.
 *
 * @param supabase - Authenticated Supabase client (with user context from RLS)
 * @param command - Transaction creation data (amount, date, categoryId, type, note)
 * @returns Newly created transaction with full details including category info
 * @throws Error with "User not authenticated" if user is not logged in
 * @throws Error with "INVALID_CATEGORY" if category doesn't exist or doesn't belong to user
 * @throws Error with detailed message for other database failures
 *
 * @example
 * ```typescript
 * const transaction = await createTransaction(
 *   supabase,
 *   {
 *     amount: 150.75,
 *     date: "2025-10-13",
 *     categoryId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
 *     type: "expense",
 *     note: "Weekly groceries"
 *   }
 * );
 * ```
 */
export async function createTransaction(
  supabase: SupabaseClient,
  command: CreateTransactionCommand
): Promise<CreateTransactionResponseDto> {
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Handle authentication errors early
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Insert transaction with category join in response
  // Using .select() with join to get category details in one query
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      category_id: command.categoryId,
      amount: command.amount,
      date: command.date,
      type: command.type,
      note: command.note || null,
    })
    .select(
      `
        id,
        date,
        amount,
        type,
        note,
        created_at,
        category:categories (
          id,
          name
        )
      `
    )
    .single();

  // Handle database errors early
  if (error) {
    // Check if it's a foreign key violation (category doesn't exist or doesn't belong to user)
    // PostgreSQL error code 23503 = foreign_key_violation
    if (error.code === "23503") {
      throw new Error("INVALID_CATEGORY");
    }
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  // Ensure data was returned
  if (!data) {
    throw new Error("Transaction created but could not be retrieved");
  }

  // Transform database response to DTO format
  // Map snake_case to camelCase and restructure category
  return {
    id: data.id,
    date: data.date,
    amount: data.amount,
    type: data.type,
    note: data.note,
    category: data.category
      ? {
          id: data.category.id,
          name: data.category.name,
        }
      : null,
    createdAt: data.created_at,
  };
}

/**
 * Delete a transaction.
 *
 * This function permanently deletes a transaction from the database. The user can only
 * delete their own transactions, enforced by RLS policies. For security reasons, the
 * function returns NOT_FOUND for both non-existent transactions and transactions
 * belonging to other users, preventing information disclosure.
 *
 * @param supabase - Authenticated Supabase client (with user context from RLS)
 * @param transactionId - UUID of the transaction to delete
 * @returns void - No return value on success
 * @throws Error with "User not authenticated" if user is not logged in
 * @throws Error with "NOT_FOUND" if transaction doesn't exist or doesn't belong to user
 * @throws Error with "FORBIDDEN" if ownership check fails (should never happen due to RLS)
 * @throws Error with detailed message for other database failures
 *
 * Security Note:
 * Due to RLS policies, users can only see their own transactions. This means we cannot
 * distinguish between a transaction that doesn't exist and one that belongs to another
 * user. We return NOT_FOUND in both cases to prevent enumeration attacks.
 *
 * @example
 * ```typescript
 * await deleteTransaction(supabase, "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d");
 * // Transaction deleted successfully
 * ```
 */
export async function deleteTransaction(supabase: SupabaseClient, transactionId: string): Promise<void> {
  // Get authenticated user early
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Handle authentication errors early
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // STEP 1: Check if transaction exists and verify ownership BEFORE deletion
  // This is necessary because RLS on SELECT only allows users to see their own transactions
  // We need to distinguish between 404 (doesn't exist) and 403 (belongs to someone else)
  const { data: existingTransaction, error: selectError } = await supabase
    .from("transactions")
    .select("id, user_id")
    .eq("id", transactionId)
    .single();

  // Handle SELECT errors
  if (selectError) {
    // Supabase returns PGRST116 error code when .single() finds no rows
    if (selectError.code === "PGRST116") {
      // Transaction doesn't exist (RLS filtered it out or it truly doesn't exist)
      // Since we can only see our own transactions due to RLS, this means it either:
      // 1. Doesn't exist at all → 404
      // 2. Exists but belongs to another user → Also 404 (don't leak existence)
      // For security: we return 404 in both cases to avoid information disclosure
      throw new Error("NOT_FOUND");
    }
    throw new Error(`Failed to check transaction: ${selectError.message}`);
  }

  // STEP 2: Verify ownership
  // If we got here, the transaction exists and belongs to current user (thanks to RLS)
  // This check is redundant due to RLS, but kept for explicitness and defense in depth
  if (existingTransaction.user_id !== user.id) {
    // This should never happen due to RLS, but we handle it just in case
    throw new Error("FORBIDDEN");
  }

  // STEP 3: Delete transaction
  // RLS policy ensures user can only delete their own transactions
  const { error: deleteError } = await supabase.from("transactions").delete().eq("id", transactionId);

  // Handle DELETE errors
  if (deleteError) {
    throw new Error(`Failed to delete transaction: ${deleteError.message}`);
  }

  // Success - transaction deleted (no return value)
}

/**
 * Update an existing transaction.
 *
 * This function updates a transaction in the database with the provided fields.
 * Only fields included in the command object will be updated (partial update).
 * The transaction must belong to the authenticated user, enforced by RLS.
 * Returns the complete updated transaction including category details.
 *
 * @param supabase - Authenticated Supabase client (with user context from RLS)
 * @param transactionId - UUID of the transaction to update
 * @param command - Fields to update (all optional, but at least one required)
 * @returns Updated transaction with full details including category info
 * @throws Error with "User not authenticated" if user is not logged in
 * @throws Error with "NOT_FOUND" if transaction doesn't exist
 * @throws Error with "FORBIDDEN" if transaction belongs to another user
 * @throws Error with "INVALID_CATEGORY" if category doesn't exist or doesn't belong to user
 * @throws Error with detailed message for other database failures
 *
 * @example
 * ```typescript
 * const transaction = await updateTransaction(
 *   supabase,
 *   "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d",
 *   {
 *     amount: 205.00,
 *     note: "New gaming headphones"
 *   }
 * );
 * ```
 */
export async function updateTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  command: UpdateTransactionCommand
): Promise<UpdateTransactionResponseDto> {
  // Get authenticated user early
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Handle authentication errors early
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Prepare update data - only include provided fields
  // Map camelCase (categoryId) to snake_case (category_id)
  const updateData: Record<string, string | number | null> = {};
  if (command.amount !== undefined) updateData.amount = command.amount;
  if (command.date !== undefined) updateData.date = command.date;
  if (command.type !== undefined) updateData.type = command.type;
  if (command.note !== undefined) updateData.note = command.note;
  if (command.categoryId !== undefined) {
    updateData.category_id = command.categoryId;
  }

  // Update transaction with category join in response using RETURNING clause
  // This gets the updated data in a single database round-trip
  const { data, error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", transactionId)
    .select(
      `
        id,
        date,
        amount,
        type,
        note,
        created_at,
        category:categories (
          id,
          name
        )
      `
    )
    .single();

  // Handle database errors early
  if (error) {
    // Check if it's a foreign key violation (invalid category)
    // PostgreSQL error code 23503 = foreign_key_violation
    if (error.code === "23503") {
      throw new Error("INVALID_CATEGORY");
    }

    // Check if no rows were affected (transaction not found or forbidden)
    // Supabase returns PGRST116 error code when .single() finds no rows
    if (error.code === "PGRST116") {
      // Query to check if transaction exists (without RLS filter)
      // We need to distinguish between 404 (doesn't exist) and 403 (exists but not yours)
      const { data: existingTransaction } = await supabase
        .from("transactions")
        .select("id, user_id")
        .eq("id", transactionId)
        .single();

      if (!existingTransaction) {
        // Transaction doesn't exist at all
        throw new Error("NOT_FOUND");
      } else if (existingTransaction.user_id !== user.id) {
        // Transaction exists but belongs to another user
        throw new Error("FORBIDDEN");
      }
    }

    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  // Ensure data was returned
  if (!data) {
    throw new Error("Transaction updated but could not be retrieved");
  }

  // Transform database response to DTO format
  // Map snake_case to camelCase and restructure category
  return {
    id: data.id,
    date: data.date,
    amount: data.amount,
    type: data.type,
    note: data.note,
    category: data.category
      ? {
          id: data.category.id,
          name: data.category.name,
        }
      : null,
    createdAt: data.created_at,
  };
}

/**
 * Get paginated list of transactions for a specific month and year.
 *
 * This function retrieves transactions from the database for a given period,
 * sorted by date in descending order (newest first). It includes category
 * information via LEFT JOIN and applies pagination. User isolation is
 * automatically handled by RLS policies.
 *
 * @param supabase - Authenticated Supabase client (with user context from RLS)
 * @param month - Month to retrieve data for (1-12)
 * @param year - Year to retrieve data for (e.g., 2025)
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Items per page (default: 20, max: 100)
 * @returns Paginated list of transactions with metadata
 * @throws Error with detailed message for database failures
 *
 * @example
 * ```typescript
 * const result = await listTransactions(supabase, 10, 2025, 1, 20);
 * // Returns: { transactions: [...], pagination: { page: 1, pageSize: 20, totalItems: 45, totalPages: 3 } }
 * ```
 */
export async function listTransactions(
  supabase: SupabaseClient,
  month: number,
  year: number,
  page = 1,
  pageSize = 20
): Promise<ListTransactionsResponseDto> {
  // Calculate date range for the specified month and year
  // startDate: first day of the month (e.g., 2025-10-01)
  // endDate: last day of the month (e.g., 2025-10-31)
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // Calculate pagination offset
  // Page 1: offset 0, Page 2: offset 20 (if pageSize=20), etc.
  const offset = (page - 1) * pageSize;

  // Get total count for pagination metadata
  // Uses head: true to avoid fetching data, only count
  const { count, error: countError } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  // Handle count query errors early
  if (countError) {
    throw new Error(`Failed to count transactions: ${countError.message}`);
  }

  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Query transactions with category join
  // LEFT JOIN ensures transactions without categories are still returned
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      `
        id,
        date,
        amount,
        type,
        note,
        created_at,
        category:categories (
          id,
          name
        )
      `
    )
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Handle query errors early
  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Transform database rows to DTOs
  // Map snake_case to camelCase and restructure nested category
  const transactionDtos: TransactionDto[] = (transactions || []).map((t) => ({
    id: t.id,
    date: t.date,
    amount: t.amount,
    type: t.type,
    note: t.note,
    category: t.category
      ? {
          id: t.category.id,
          name: t.category.name,
        }
      : null,
    createdAt: t.created_at,
  }));

  // Return formatted response with transactions and pagination metadata
  return {
    transactions: transactionDtos,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
