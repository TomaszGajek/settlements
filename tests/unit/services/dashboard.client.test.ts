import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDashboardSummary } from "@/lib/services/dashboard.client";

describe("dashboard.client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("fetchDashboardSummary", () => {
    it("should successfully fetch dashboard summary", async () => {
      // Arrange
      const mockSummary = {
        totalIncome: "5000.00",
        totalExpense: "2000.00",
        balance: "3000.00",
        dailyBreakdown: [
          { day: 1, income: "1000.00", expense: "500.00" },
          { day: 2, income: "0.00", expense: "200.00" },
        ],
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSummary),
      });
      global.fetch = mockFetch;

      // Act
      const result = await fetchDashboardSummary(10, 2025);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/dashboard?month=10&year=2025", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockSummary);
    });

    it("should handle different month and year values", async () => {
      // Arrange
      const mockSummary = {
        totalIncome: "0.00",
        totalExpense: "0.00",
        balance: "0.00",
        dailyBreakdown: [],
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSummary),
      });
      global.fetch = mockFetch;

      // Act
      const result = await fetchDashboardSummary(1, 2024);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/dashboard?month=1&year=2024", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockSummary);
    });

    it("should throw error when API returns error", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Unauthorized" }),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchDashboardSummary(10, 2025)).rejects.toThrow("Unauthorized");
    });

    it("should throw default error when json parsing fails", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchDashboardSummary(10, 2025)).rejects.toThrow("Failed to fetch dashboard");
    });

    it("should throw default error when API returns no message", async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      });
      global.fetch = mockFetch;

      // Act & Assert
      await expect(fetchDashboardSummary(10, 2025)).rejects.toThrow("Failed to fetch dashboard");
    });
  });
});
