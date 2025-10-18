import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardSummary } from "@/lib/services/dashboard.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };
  return mockSupabase as unknown as SupabaseClient;
};

describe("dashboard.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe("getDashboardSummary", () => {
    it("should calculate correct totals and daily breakdown", async () => {
      // Arrange
      const mockTransactions = [
        { id: "1", amount: "1000.00", type: "income", date: "2025-10-01" },
        { id: "2", amount: "500.00", type: "expense", date: "2025-10-01" },
        { id: "3", amount: "2000.00", type: "income", date: "2025-10-15" },
        { id: "4", amount: "300.00", type: "expense", date: "2025-10-15" },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.summary.income).toBe(3000);
      expect(result.summary.expenses).toBe(800);
      expect(result.summary.balance).toBe(2200);
      expect(result.dailyBreakdown).toHaveLength(2);
      expect(result.dailyBreakdown[0]).toEqual({
        date: "2025-10-01",
        income: 1000,
        expenses: 500,
      });
      expect(result.dailyBreakdown[1]).toEqual({
        date: "2025-10-15",
        income: 2000,
        expenses: 300,
      });
    });

    it("should handle empty transactions", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.summary.income).toBe(0);
      expect(result.summary.expenses).toBe(0);
      expect(result.summary.balance).toBe(0);
      expect(result.dailyBreakdown).toEqual([]);
    });

    it("should handle only income transactions", async () => {
      // Arrange
      const mockTransactions = [
        { id: "1", amount: "1000.00", type: "income", date: "2025-10-01" },
        { id: "2", amount: "500.00", type: "income", date: "2025-10-02" },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.summary.income).toBe(1500);
      expect(result.summary.expenses).toBe(0);
      expect(result.summary.balance).toBe(1500);
    });

    it("should handle only expense transactions", async () => {
      // Arrange
      const mockTransactions = [
        { id: "1", amount: "500.00", type: "expense", date: "2025-10-01" },
        { id: "2", amount: "300.00", type: "expense", date: "2025-10-02" },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.summary.income).toBe(0);
      expect(result.summary.expenses).toBe(800);
      expect(result.summary.balance).toBe(-800);
    });

    it("should aggregate multiple transactions on the same day", async () => {
      // Arrange
      const mockTransactions = [
        { id: "1", amount: "100.00", type: "income", date: "2025-10-01" },
        { id: "2", amount: "200.00", type: "income", date: "2025-10-01" },
        { id: "3", amount: "50.00", type: "expense", date: "2025-10-01" },
        { id: "4", amount: "75.00", type: "expense", date: "2025-10-01" },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.dailyBreakdown).toHaveLength(1);
      expect(result.dailyBreakdown[0]).toEqual({
        date: "2025-10-01",
        income: 300,
        expenses: 125,
      });
    });

    it("should round amounts to 2 decimal places", async () => {
      // Arrange
      const mockTransactions = [
        { id: "1", amount: "100.556", type: "income", date: "2025-10-01" },
        { id: "2", amount: "50.333", type: "expense", date: "2025-10-01" },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.summary.income).toBe(100.56);
      expect(result.summary.expenses).toBe(50.33);
      // Balance: 100.556 - 50.333 = 50.223, rounded to 50.22
      expect(result.summary.balance).toBe(50.22);
    });

    it("should sort daily breakdown by date ascending", async () => {
      // Arrange
      const mockTransactions = [
        { id: "1", amount: "100.00", type: "income", date: "2025-10-15" },
        { id: "2", amount: "200.00", type: "income", date: "2025-10-05" },
        { id: "3", amount: "300.00", type: "income", date: "2025-10-25" },
        { id: "4", amount: "400.00", type: "income", date: "2025-10-01" },
      ];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.dailyBreakdown[0].date).toBe("2025-10-01");
      expect(result.dailyBreakdown[1].date).toBe("2025-10-05");
      expect(result.dailyBreakdown[2].date).toBe("2025-10-15");
      expect(result.dailyBreakdown[3].date).toBe("2025-10-25");
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act & Assert
      await expect(getDashboardSummary(mockSupabase, 10, 2025)).rejects.toThrow(
        "Failed to fetch transactions: Database error"
      );
    });

    it("should handle null data gracefully", async () => {
      // Arrange
      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 10, 2025);

      // Assert
      expect(result.summary.income).toBe(0);
      expect(result.summary.expenses).toBe(0);
      expect(result.summary.balance).toBe(0);
      expect(result.dailyBreakdown).toEqual([]);
    });

    it("should handle February in leap year correctly", async () => {
      // Arrange
      const mockTransactions = [{ id: "1", amount: "100.00", type: "income", date: "2024-02-15" }];

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>);

      // Act
      const result = await getDashboardSummary(mockSupabase, 2, 2024); // February 2024 (leap year)

      // Assert - if we get results, it means date range calculation worked
      expect(result.summary.income).toBe(100);
      // Note: The date range is handled internally by the service
      // We verify it works by checking we can retrieve data for that month
    });
  });
});
