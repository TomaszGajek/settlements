import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  listTransactions,
} from "@/lib/services/transactions.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn(),
    },
  };
  return mockSupabase as unknown as SupabaseClient;
};

describe("transactions.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe("createTransaction", () => {
    it("should successfully create a transaction", async () => {
      // Arrange
      const command = {
        amount: "150.50",
        date: "2025-10-15",
        categoryId: "cat-1",
        type: "expense" as const,
        note: "Test expense",
      };
      const mockUser = { id: "user-123" };
      const mockTransaction = {
        id: "txn-1",
        date: "2025-10-15",
        amount: "150.50",
        type: "expense",
        note: "Test expense",
        created_at: "2025-10-15T10:00:00Z",
        category: { id: "cat-1", name: "Jedzenie" },
      };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      // Act
      const result = await createTransaction(mockSupabase, command);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("transactions");
      expect(result).toEqual({
        id: "txn-1",
        date: "2025-10-15",
        amount: "150.50",
        type: "expense",
        note: "Test expense",
        category: { id: "cat-1", name: "Jedzenie" },
        createdAt: "2025-10-15T10:00:00Z",
      });
    });

    it("should throw error when user is not authenticated", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      // Act & Assert
      await expect(
        createTransaction(mockSupabase, {
          amount: "100.00",
          date: "2025-10-15",
          categoryId: "cat-1",
          type: "expense",
          note: "",
        })
      ).rejects.toThrow("User not authenticated");
    });

    it("should throw error for invalid category (foreign key violation)", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "23503", message: "foreign key violation" },
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(
        createTransaction(mockSupabase, {
          amount: "100.00",
          date: "2025-10-15",
          categoryId: "invalid-cat",
          type: "expense",
          note: "",
        })
      ).rejects.toThrow("INVALID_CATEGORY");
    });

    it("should throw error when database insert fails", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "UNKNOWN", message: "Database error" },
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(
        createTransaction(mockSupabase, {
          amount: "100.00",
          date: "2025-10-15",
          categoryId: "cat-1",
          type: "expense",
          note: "",
        })
      ).rejects.toThrow("Failed to create transaction: Database error");
    });

    it("should handle transaction with empty note", async () => {
      // Arrange
      const command = {
        amount: "100.00",
        date: "2025-10-15",
        categoryId: "cat-1",
        type: "income" as const,
        note: "",
      };
      const mockUser = { id: "user-123" };
      const mockTransaction = {
        id: "txn-1",
        date: "2025-10-15",
        amount: "100.00",
        type: "income",
        note: null,
        created_at: "2025-10-15T10:00:00Z",
        category: { id: "cat-1", name: "Wynagrodzenie" },
      };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      // Act
      const result = await createTransaction(mockSupabase, command);

      // Assert
      expect(result.note).toBeNull();
    });
  });

  describe("deleteTransaction", () => {
    it("should successfully delete a transaction", async () => {
      // Arrange
      const transactionId = "txn-1";
      const mockUser = { id: "user-123" };
      const mockTransaction = { id: transactionId, user_id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      // Act
      await deleteTransaction(mockSupabase, transactionId);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("transactions");
    });

    it("should throw error when user is not authenticated", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      // Act & Assert
      await expect(deleteTransaction(mockSupabase, "txn-1")).rejects.toThrow("User not authenticated");
    });

    it("should throw NOT_FOUND error when transaction doesn't exist", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116", message: "not found" },
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(deleteTransaction(mockSupabase, "txn-999")).rejects.toThrow("NOT_FOUND");
    });

    it("should throw FORBIDDEN error when transaction belongs to another user", async () => {
      // Arrange
      const mockUser = { id: "user-123" };
      const mockTransaction = { id: "txn-1", user_id: "user-456" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(deleteTransaction(mockSupabase, "txn-1")).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("updateTransaction", () => {
    it("should successfully update a transaction", async () => {
      // Arrange
      const transactionId = "txn-1";
      const command = { amount: "200.00", note: "Updated note" };
      const mockUser = { id: "user-123" };
      const mockUpdated = {
        id: transactionId,
        date: "2025-10-15",
        amount: "200.00",
        type: "expense",
        note: "Updated note",
        created_at: "2025-10-15T10:00:00Z",
        category: { id: "cat-1", name: "Jedzenie" },
      };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdated,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await updateTransaction(mockSupabase, transactionId, command);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(result.amount).toBe("200.00");
      expect(result.note).toBe("Updated note");
    });

    it("should throw error when user is not authenticated", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      // Act & Assert
      await expect(updateTransaction(mockSupabase, "txn-1", { amount: "100.00" })).rejects.toThrow(
        "User not authenticated"
      );
    });

    it("should throw error for invalid category (foreign key violation)", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "23503", message: "foreign key violation" },
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(updateTransaction(mockSupabase, "txn-1", { categoryId: "invalid-cat" })).rejects.toThrow(
        "INVALID_CATEGORY"
      );
    });

    it("should handle partial updates correctly", async () => {
      // Arrange
      const transactionId = "txn-1";
      const command = { note: "Only update note" };
      const mockUser = { id: "user-123" };
      const mockUpdated = {
        id: transactionId,
        date: "2025-10-15",
        amount: "150.50",
        type: "expense",
        note: "Only update note",
        created_at: "2025-10-15T10:00:00Z",
        category: { id: "cat-1", name: "Jedzenie" },
      };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdated,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await updateTransaction(mockSupabase, transactionId, command);

      // Assert
      expect(result.note).toBe("Only update note");
      expect(result.amount).toBe("150.50"); // Other fields unchanged
    });
  });

  describe("listTransactions", () => {
    it("should successfully list transactions with pagination", async () => {
      // Arrange
      const mockTransactions = [
        {
          id: "txn-1",
          date: "2025-10-15",
          amount: "150.50",
          type: "expense",
          note: "Test",
          created_at: "2025-10-15T10:00:00Z",
          category: { id: "cat-1", name: "Jedzenie" },
        },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              count: 25,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await listTransactions(mockSupabase, 10, 2025, 1, 20);

      // Assert
      expect(result.transactions).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 25,
        totalPages: 2,
      });
    });

    it("should handle empty results", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await listTransactions(mockSupabase, 10, 2025);

      // Assert
      expect(result.transactions).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should calculate pagination correctly", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              count: 45,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await listTransactions(mockSupabase, 10, 2025, 2, 20);

      // Assert
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 20,
        totalItems: 45,
        totalPages: 3,
      });
    });

    it("should throw error when count query fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              count: null,
              error: { message: "Count error" },
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(listTransactions(mockSupabase, 10, 2025)).rejects.toThrow(
        "Failed to count transactions: Count error"
      );
    });

    it("should throw error when data query fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              count: 10,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Data error" },
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(listTransactions(mockSupabase, 10, 2025)).rejects.toThrow(
        "Failed to fetch transactions: Data error"
      );
    });
  });
});

