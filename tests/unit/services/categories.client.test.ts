import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/services/categories.client";

describe("categories.client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("fetchCategories", () => {
    it("should successfully fetch categories", async () => {
      // Arrange
      const mockCategories = {
        categories: [
          { id: "1", name: "Jedzenie", user_id: "user-1", is_deletable: true },
          { id: "2", name: "Transport", user_id: "user-1", is_deletable: true },
        ],
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCategories),
      });
      global.fetch = mockFetch;

      // Act
      const result = await fetchCategories();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockCategories);
    });

    it("should throw error when API returns error", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Unauthorized" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchCategories()).rejects.toThrow("Unauthorized");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchCategories()).rejects.toThrow("Failed to fetch categories");
    });
  });

  describe("createCategory", () => {
    it("should successfully create a category", async () => {
      // Arrange
      const newCategory = { name: "Zakupy" };
      const mockResponse = {
        category: { id: "3", name: "Zakupy", user_id: "user-1", is_deletable: true },
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });
      global.fetch = mockFetch;

      // Act
      const result = await createCategory(newCategory);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw specific error for duplicate category name (409)", async () => {
      // Arrange
      const newCategory = { name: "Jedzenie" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: vi.fn().mockResolvedValue({ message: "Duplicate name" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(createCategory(newCategory)).rejects.toThrow("Kategoria o tej nazwie już istnieje");
    });

    it("should throw generic error for other errors", async () => {
      // Arrange
      const newCategory = { name: "Test" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(createCategory(newCategory)).rejects.toThrow("Server error");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const newCategory = { name: "Test" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(createCategory(newCategory)).rejects.toThrow("Failed to create category");
    });
  });

  describe("updateCategory", () => {
    it("should successfully update a category", async () => {
      // Arrange
      const categoryId = "1";
      const updateData = { name: "Jedzenie i Napoje" };
      const mockResponse = {
        category: { id: "1", name: "Jedzenie i Napoje", user_id: "user-1", is_deletable: true },
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });
      global.fetch = mockFetch;

      // Act
      const result = await updateCategory(categoryId, updateData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw specific error for forbidden update (403)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: "Forbidden" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateCategory("1", { name: "Test" })).rejects.toThrow("Nie można edytować tej kategorii");
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
      await expect(updateCategory("999", { name: "Test" })).rejects.toThrow("Kategoria nie została znaleziona");
    });

    it("should throw specific error for duplicate name (409)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: vi.fn().mockResolvedValue({ message: "Duplicate" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateCategory("1", { name: "Duplicate" })).rejects.toThrow("Kategoria o tej nazwie już istnieje");
    });

    it("should throw default error for other errors", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(updateCategory("1", { name: "Test" })).rejects.toThrow("Server error");
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
      await expect(updateCategory("1", { name: "Test" })).rejects.toThrow("Failed to update category");
    });
  });

  describe("deleteCategory", () => {
    it("should successfully delete a category", async () => {
      // Arrange
      const categoryId = "1";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });
      global.fetch = mockFetch;

      // Act
      await deleteCategory(categoryId);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should throw specific error for forbidden delete (403)", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: "Forbidden" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteCategory("1")).rejects.toThrow("Nie można usunąć tej kategorii");
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
      await expect(deleteCategory("999")).rejects.toThrow("Kategoria nie została znaleziona");
    });

    it("should throw default error for other errors", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteCategory("1")).rejects.toThrow("Server error");
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
      await expect(deleteCategory("1")).rejects.toThrow("Failed to delete category");
    });
  });
});
