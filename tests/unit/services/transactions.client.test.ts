import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchTransactionCounts,
} from "@/lib/services/transactions.client";

describe("transactions.client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("fetchTransactions", () => {
    it("should successfully fetch transactions with default pagination", async () => {
      // Arrange
      const mockResponse = {
        transactions: [
          {
            id: "1",
            amount: "100.00",
            date: "2025-10-15",
            category_id: "cat-1",
            type: "expense",
            note: "Test",
          },
        ],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });
      global.fetch = mockFetch;

      // Act
      const result = await fetchTransactions(10, 2025);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/transactions?month=10&year=2025&page=1&pageSize=20", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should fetch transactions with custom pagination parameters", async () => {
      // Arrange
      const mockResponse = {
        transactions: [],
        pagination: { page: 2, pageSize: 10, totalCount: 25, totalPages: 3 },
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });
      global.fetch = mockFetch;

      // Act
      const result = await fetchTransactions(5, 2024, 2, 10);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/transactions?month=5&year=2024&page=2&pageSize=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Unauthorized" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchTransactions(10, 2025)).rejects.toThrow("Unauthorized");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchTransactions(10, 2025)).rejects.toThrow("Failed to fetch transactions");
    });
  });

  describe("createTransaction", () => {
    it("should successfully create a transaction", async () => {
      // Arrange
      const newTransaction = {
        amount: "150.50",
        date: "2025-10-15",
        categoryId: "cat-1",
        type: "expense" as const,
        note: "Test expense",
      };
      const mockResponse = {
        transaction: {
          id: "txn-1",
          ...newTransaction,
          user_id: "user-1",
          created_at: "2025-10-15T10:00:00Z",
        },
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });
      global.fetch = mockFetch;

      // Act
      const result = await createTransaction(newTransaction);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw specific error for invalid category (422)", async () => {
      // Arrange
      const newTransaction = {
        amount: "100.00",
        date: "2025-10-15",
        categoryId: "invalid-cat",
        type: "expense" as const,
        note: "",
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: vi.fn().mockResolvedValue({ message: "Invalid category" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(createTransaction(newTransaction)).rejects.toThrow(
        "Kategoria nie istnieje lub nie należy do użytkownika"
      );
    });

    it("should throw generic error for other errors", async () => {
      // Arrange
      const newTransaction = {
        amount: "100.00",
        date: "2025-10-15",
        categoryId: "cat-1",
        type: "expense" as const,
        note: "",
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(createTransaction(newTransaction)).rejects.toThrow("Server error");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const newTransaction = {
        amount: "100.00",
        date: "2025-10-15",
        categoryId: "cat-1",
        type: "expense" as const,
        note: "",
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(createTransaction(newTransaction)).rejects.toThrow("Failed to create transaction");
    });
  });

  describe("updateTransaction", () => {
    it("should successfully update a transaction", async () => {
      // Arrange
      const transactionId = "txn-1";
      const updateData = {
        amount: "200.00",
        note: "Updated expense",
      };
      const mockResponse = {
        transaction: {
          id: transactionId,
          amount: "200.00",
          date: "2025-10-15",
          category_id: "cat-1",
          type: "expense",
          note: "Updated expense",
          user_id: "user-1",
          created_at: "2025-10-15T10:00:00Z",
        },
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });
      global.fetch = mockFetch;

      // Act
      const result = await updateTransaction(transactionId, updateData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw specific error for not found (404)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ message: "Not found" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateTransaction("txn-999", { amount: "100.00" })).rejects.toThrow(
        "Transakcja nie została znaleziona"
      );
    });

    it("should throw specific error for forbidden (403)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: "Forbidden" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateTransaction("txn-1", { amount: "100.00" })).rejects.toThrow(
        "Brak uprawnień do edycji tej transakcji"
      );
    });

    it("should throw generic error for other errors", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateTransaction("txn-1", { amount: "100.00" })).rejects.toThrow("Server error");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateTransaction("txn-1", { amount: "100.00" })).rejects.toThrow(
        "Failed to update transaction"
      );
    });
  });

  describe("deleteTransaction", () => {
    it("should successfully delete a transaction", async () => {
      // Arrange
      const transactionId = "txn-1";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });
      global.fetch = mockFetch;

      // Act
      await deleteTransaction(transactionId);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should throw specific error for not found (404)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ message: "Not found" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteTransaction("txn-999")).rejects.toThrow("Transakcja nie została znaleziona");
    });

    it("should throw specific error for forbidden (403)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: "Forbidden" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteTransaction("txn-1")).rejects.toThrow("Brak uprawnień do usunięcia tej transakcji");
    });

    it("should throw generic error for other errors", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteTransaction("txn-1")).rejects.toThrow("Server error");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteTransaction("txn-1")).rejects.toThrow("Failed to delete transaction");
    });
  });

  describe("fetchTransactionCounts", () => {
    it("should return empty object as placeholder", async () => {
      // Act
      const result = await fetchTransactionCounts();

      // Assert
      expect(result).toEqual({});
    });
  });
});

