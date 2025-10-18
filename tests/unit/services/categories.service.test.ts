import { describe, it, expect, vi, beforeEach } from "vitest";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/services/categories.service";
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
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn(),
    },
  };
  return mockSupabase as unknown as SupabaseClient;
};

describe("categories.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe("listCategories", () => {
    it("should successfully list all categories sorted by name", async () => {
      // Arrange
      const mockCategories = [
        { id: "1", name: "Jedzenie", is_deletable: true },
        { id: "2", name: "Transport", is_deletable: true },
        { id: "3", name: "Inne", is_deletable: false },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await listCategories(mockSupabase);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(result).toEqual([
        { id: "1", name: "Jedzenie", isDeletable: true },
        { id: "2", name: "Transport", isDeletable: true },
        { id: "3", name: "Inne", isDeletable: false },
      ]);
    });

    it("should return empty array when no categories exist", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await listCategories(mockSupabase);

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(listCategories(mockSupabase)).rejects.toThrow("Failed to fetch categories: Database error");
    });

    it("should handle null data gracefully", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await listCategories(mockSupabase);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("createCategory", () => {
    it("should successfully create a new category", async () => {
      // Arrange
      const command = { name: "Zakupy" };
      const mockUser = { id: "user-123" };
      const mockCategory = { id: "cat-1", name: "Zakupy", is_deletable: true };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCategory,
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await createCategory(mockSupabase, command);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(result).toEqual({ id: "cat-1", name: "Zakupy", isDeletable: true });
    });

    it("should throw error when user is not authenticated", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: null },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(createCategory(mockSupabase, { name: "Test" })).rejects.toThrow("User not authenticated");
    });

    it("should throw error for duplicate category name", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "23505", message: "duplicate key value" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(createCategory(mockSupabase, { name: "Duplicate" })).rejects.toThrow("DUPLICATE_NAME");
    });

    it("should throw error when database insert fails", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "UNKNOWN", message: "Database error" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(createCategory(mockSupabase, { name: "Test" })).rejects.toThrow(
        "Failed to create category: Database error"
      );
    });

    it("should throw error when category data is not returned", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(createCategory(mockSupabase, { name: "Test" })).rejects.toThrow(
        "Category created but could not be retrieved"
      );
    });
  });

  describe("updateCategory", () => {
    it("should successfully update a category", async () => {
      // Arrange
      const categoryId = "cat-1";
      const command = { name: "Updated Name" };
      const mockUser = { id: "user-123" };
      const mockExisting = { id: categoryId, name: "Old Name", user_id: "user-123", is_deletable: true };
      const mockUpdated = { id: categoryId, name: "Updated Name", is_deletable: true };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // First call: check if category exists
      // Second call: update the category
      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockExisting,
                error: null,
              }),
            }),
          }),
        } as unknown as ReturnType<typeof mockSupabase.from>)
        .mockReturnValueOnce({
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
        } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await updateCategory(mockSupabase, categoryId, command);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(result).toEqual({ id: categoryId, name: "Updated Name", isDeletable: true });
    });

    it("should throw error when category not found", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(updateCategory(mockSupabase, "cat-999", { name: "Test" })).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("deleteCategory", () => {
    it("should successfully delete a category", async () => {
      // Arrange
      const categoryId = "cat-1";
      const mockUser = { id: "user-123" };
      const mockExisting = { id: categoryId, user_id: "user-123", is_deletable: true };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // First call: check if category exists
      // Second call: delete the category
      vi.spyOn(mockSupabase, "from")
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockExisting,
                error: null,
              }),
            }),
          }),
        } as unknown as ReturnType<typeof mockSupabase.from>)
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      await deleteCategory(mockSupabase, categoryId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
    });

    it("should throw error when category not found", async () => {
      // Arrange
      const mockUser = { id: "user-123" };

      vi.spyOn(mockSupabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as unknown as ReturnType<typeof mockSupabase.from>);

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(deleteCategory(mockSupabase, "cat-999")).rejects.toThrow("NOT_FOUND");
    });
  });
});
