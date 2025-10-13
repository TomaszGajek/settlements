import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ############################################################################
// #
// # ENTITY DTOs
// #
// ############################################################################

/**
 * Represents a simplified category object for nesting within other DTOs.
 * @see CategoryDto for the full category representation.
 */
export type NestedCategoryDto = Pick<Tables<"categories">, "id" | "name">;

/**
 * Represents a category object as returned by the API.
 * Derived from the 'categories' table, with 'is_deletable' renamed to 'isDeletable'.
 */
export type CategoryDto = NestedCategoryDto & {
  isDeletable: Tables<"categories">["is_deletable"];
};

/**
 * Represents a transaction object as returned by the API.
 * Derived from the 'transactions' table, with 'created_at' renamed to 'createdAt'
 * and 'category_id' replaced with a nested 'category' object.
 */
export type TransactionDto = Omit<Tables<"transactions">, "created_at" | "category_id" | "user_id"> & {
  createdAt: Tables<"transactions">["created_at"];
  category: NestedCategoryDto | null;
};

// ############################################################################
// #
// # DASHBOARD
// #
// ############################################################################

/**
 * DTO for the dashboard summary response.
 * This is a computed type, not directly mapped to a single database table.
 */
export interface DashboardSummaryDto {
  summary: {
    income: number;
    expenses: number;
    balance: number;
  };
  dailyBreakdown: {
    date: string;
    income: number;
    expenses: number;
  }[];
}

// ############################################################################
// #
// # TRANSACTIONS
// #
// ############################################################################

/**
 * DTO for the response of listing transactions.
 * Contains a paginated list of transactions.
 */
export interface ListTransactionsResponseDto {
  transactions: TransactionDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Command model for creating a new transaction.
 * Derived from the 'transactions' insert type, with 'category_id' renamed to 'categoryId'.
 */
export type CreateTransactionCommand = Pick<TablesInsert<"transactions">, "amount" | "date" | "note" | "type"> & {
  categoryId: Tables<"transactions">["category_id"];
};

/**
 * DTO for the response of creating a transaction.
 */
export type CreateTransactionResponseDto = TransactionDto;

/**
 * Command model for updating an existing transaction.
 * All fields are optional.
 */
export type UpdateTransactionCommand = Partial<CreateTransactionCommand>;

/**
 * DTO for the response of updating a transaction.
 */
export type UpdateTransactionResponseDto = TransactionDto;

// ############################################################################
// #
// # CATEGORIES
// #
// ############################################################################

/**
 * DTO for the response of listing categories.
 */
export type ListCategoriesResponseDto = CategoryDto[];

/**
 * Command model for creating a new category.
 * Derived from the 'categories' insert type.
 */
export type CreateCategoryCommand = Pick<TablesInsert<"categories">, "name">;

/**
 * DTO for the response of creating a category.
 */
export type CreateCategoryResponseDto = CategoryDto;

/**
 * Command model for updating an existing category.
 * Derived from the 'categories' update type.
 */
export type UpdateCategoryCommand = Pick<TablesUpdate<"categories">, "name">;

/**
 * DTO for the response of updating a category.
 */
export type UpdateCategoryResponseDto = CategoryDto;
