import type {
  CreateTransactionCommand,
  CreateTransactionResponseDto,
  ListTransactionsResponseDto,
  UpdateTransactionCommand,
  UpdateTransactionResponseDto,
} from "@/types";

/**
 * Fetch paginated list of transactions from client-side API endpoint.
 *
 * @param month - Month to retrieve data for (1-12)
 * @param year - Year to retrieve data for (e.g., 2025)
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Items per page (default: 20)
 * @returns Paginated list of transactions with metadata
 * @throws Error if API call fails
 */
export async function fetchTransactions(
  month: number,
  year: number,
  page: number = 1,
  pageSize: number = 20
): Promise<ListTransactionsResponseDto> {
  const response = await fetch(
    `/api/transactions?month=${month}&year=${year}&page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch transactions" }));
    throw new Error(error.message || "Failed to fetch transactions");
  }

  return response.json();
}

/**
 * Create a new transaction via client-side API endpoint.
 *
 * @param data - Transaction creation data
 * @returns Newly created transaction with full details
 * @throws Error if API call fails or validation fails
 */
export async function createTransaction(data: CreateTransactionCommand): Promise<CreateTransactionResponseDto> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create transaction" }));

    // Handle specific error codes
    if (response.status === 422) {
      throw new Error("Kategoria nie istnieje lub nie należy do użytkownika");
    }

    throw new Error(error.message || "Failed to create transaction");
  }

  return response.json();
}

/**
 * Update an existing transaction via client-side API endpoint.
 *
 * @param id - Transaction ID
 * @param data - Fields to update
 * @returns Updated transaction with full details
 * @throws Error if API call fails or transaction not found
 */
export async function updateTransaction(
  id: string,
  data: UpdateTransactionCommand
): Promise<UpdateTransactionResponseDto> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update transaction" }));

    if (response.status === 404) {
      throw new Error("Transakcja nie została znaleziona");
    }

    if (response.status === 403) {
      throw new Error("Brak uprawnień do edycji tej transakcji");
    }

    throw new Error(error.message || "Failed to update transaction");
  }

  return response.json();
}

/**
 * Delete a transaction via client-side API endpoint.
 *
 * @param id - Transaction ID
 * @throws Error if API call fails or transaction not found
 */
export async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to delete transaction" }));

    if (response.status === 404) {
      throw new Error("Transakcja nie została znaleziona");
    }

    if (response.status === 403) {
      throw new Error("Brak uprawnień do usunięcia tej transakcji");
    }

    throw new Error(error.message || "Failed to delete transaction");
  }
}

/**
 * Fetch transaction counts per category from client-side.
 *
 * This is a simplified approach for Settings page - we use the client-side
 * Supabase client to fetch only category IDs and count them.
 *
 * @returns Object mapping category IDs to transaction counts
 * @throws Error if query fails
 */
export async function fetchTransactionCounts(): Promise<Record<string, number>> {
  // We'll implement this using Supabase client directly
  // This will be imported and used in the hook
  // For now, return empty object - will be implemented in the hook
  return {};
}

