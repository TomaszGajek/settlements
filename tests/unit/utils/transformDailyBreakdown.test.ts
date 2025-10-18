/**
 * Testy jednostkowe dla funkcji transformDailyBreakdown
 */

import { describe, it, expect } from "vitest";
import { transformDailyBreakdown } from "@/lib/utils/transformDailyBreakdown";

describe("transformDailyBreakdown", () => {
  it("should transform daily breakdown data correctly", () => {
    const input = [
      { date: "2025-10-01", income: 5000, expenses: 0 },
      { date: "2025-10-15", income: 0, expenses: 150.5 },
    ];

    const result = transformDailyBreakdown(input);

    expect(result).toEqual([
      {
        date: "01",
        fullDate: "2025-10-01",
        income: 5000,
        expenses: 0,
      },
      {
        date: "15",
        fullDate: "2025-10-15",
        income: 0,
        expenses: 150.5,
      },
    ]);
  });

  it("should extract day correctly from date string", () => {
    const input = [{ date: "2025-10-05", income: 100, expenses: 50 }];

    const result = transformDailyBreakdown(input);

    expect(result[0].date).toBe("05");
    expect(result[0].fullDate).toBe("2025-10-05");
  });

  it("should handle empty array", () => {
    const input: { date: string; income: number; expenses: number }[] = [];

    const result = transformDailyBreakdown(input);

    expect(result).toEqual([]);
  });

  it("should handle single entry", () => {
    const input = [{ date: "2025-10-20", income: 1000, expenses: 200 }];

    const result = transformDailyBreakdown(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "20",
      fullDate: "2025-10-20",
      income: 1000,
      expenses: 200,
    });
  });

  it("should handle all days of month", () => {
    const input = Array.from({ length: 31 }, (_, i) => ({
      date: `2025-10-${String(i + 1).padStart(2, "0")}`,
      income: i * 10,
      expenses: i * 5,
    }));

    const result = transformDailyBreakdown(input);

    expect(result).toHaveLength(31);
    expect(result[0].date).toBe("01");
    expect(result[30].date).toBe("31");
  });

  it("should preserve income and expenses values", () => {
    const input = [{ date: "2025-10-15", income: 1234.56, expenses: 789.12 }];

    const result = transformDailyBreakdown(input);

    expect(result[0].income).toBe(1234.56);
    expect(result[0].expenses).toBe(789.12);
  });

  it("should handle zero income and expenses", () => {
    const input = [{ date: "2025-10-10", income: 0, expenses: 0 }];

    const result = transformDailyBreakdown(input);

    expect(result[0]).toEqual({
      date: "10",
      fullDate: "2025-10-10",
      income: 0,
      expenses: 0,
    });
  });

  it("should handle different months", () => {
    const input = [
      { date: "2025-01-01", income: 100, expenses: 50 },
      { date: "2025-12-31", income: 200, expenses: 100 },
    ];

    const result = transformDailyBreakdown(input);

    expect(result[0].date).toBe("01");
    expect(result[0].fullDate).toBe("2025-01-01");
    expect(result[1].date).toBe("31");
    expect(result[1].fullDate).toBe("2025-12-31");
  });

  it("should handle leap year date", () => {
    const input = [{ date: "2024-02-29", income: 1000, expenses: 500 }];

    const result = transformDailyBreakdown(input);

    expect(result[0].date).toBe("29");
    expect(result[0].fullDate).toBe("2024-02-29");
  });
});
