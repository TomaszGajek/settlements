import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteUserAccount } from "@/lib/services/auth.service";

describe("auth.service", () => {
  // Save original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock fetch before each test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("deleteUserAccount", () => {
    it("should successfully delete user account", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });
      global.fetch = mockFetch;

      // Act
      await deleteUserAccount();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should throw error when API returns error response", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: "Server error" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteUserAccount()).rejects.toThrow("Server error");
    });

    it("should throw default error message when response.json() fails", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteUserAccount()).rejects.toThrow("Failed to delete account");
    });

    it("should throw default error message when API returns no message", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(deleteUserAccount()).rejects.toThrow("Nie udało się usunąć konta");
    });
  });
});
