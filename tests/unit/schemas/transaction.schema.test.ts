/**
 * Testy jednostkowe dla transaction.schema.ts
 * TC zgodne z planem testów - walidacja transakcji
 */

import { describe, it, expect } from "vitest";
import { transactionFormSchema } from "@/lib/schemas/transaction.schema";

describe("transactionFormSchema", () => {
  describe("valid data", () => {
    it("should accept valid transaction data with all fields", () => {
      const validData = {
        amount: 150.5,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
        note: "Test transaction note",
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept transaction without note", () => {
      const validData = {
        amount: 100.0,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "income" as const,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept note as null", () => {
      const validData = {
        amount: 100.0,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "income" as const,
        note: null,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept maximum amount", () => {
      const validData = {
        amount: 999999999.99,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept amount with 2 decimal places", () => {
      const validData = {
        amount: 123.45,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept amount with 1 decimal place", () => {
      const validData = {
        amount: 100.5,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("amount validation", () => {
    it("should reject negative amount", () => {
      const invalidData = {
        amount: -100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota musi być większa od 0");
      }
    });

    it("should reject zero amount", () => {
      const invalidData = {
        amount: 0,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota musi być większa od 0");
      }
    });

    it("should reject amount exceeding maximum", () => {
      const invalidData = {
        amount: 1000000000,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota jest zbyt duża");
      }
    });

    it("should reject amount with more than 2 decimal places", () => {
      const invalidData = {
        amount: 100.123,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Maksymalnie 2 miejsca po przecinku");
      }
    });

    it("should reject missing amount", () => {
      const invalidData = {
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota jest wymagana");
      }
    });
  });

  describe("date validation", () => {
    it("should reject invalid date format (DD-MM-YYYY)", () => {
      const invalidData = {
        amount: 100,
        date: "15-10-2025",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format daty");
      }
    });

    it("should reject invalid date format (DD/MM/YYYY)", () => {
      const invalidData = {
        amount: 100,
        date: "15/10/2025",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject obviously invalid date", () => {
      // JavaScript Date.parse jest dość tolerancyjny, więc testujemy coś oczywistego
      const invalidData = {
        amount: 100,
        date: "2025-13-01", // miesiąc 13 nie istnieje
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowa data");
      }
    });

    it("should reject missing date", () => {
      const invalidData = {
        amount: 100,
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Data jest wymagana");
      }
    });
  });

  describe("categoryId validation", () => {
    it("should reject invalid UUID", () => {
      const invalidData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "not-a-uuid",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowa kategoria");
      }
    });

    it("should reject empty categoryId", () => {
      const invalidData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing categoryId", () => {
      const invalidData = {
        amount: 100,
        date: "2025-10-15",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kategoria jest wymagana");
      }
    });
  });

  describe("type validation", () => {
    it('should accept "income" type', () => {
      const validData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "income" as const,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "expense" type', () => {
      const validData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const invalidData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "invalid",
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const invalidData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Typ jest wymagany");
      }
    });
  });

  describe("note validation", () => {
    it("should accept note up to 500 characters", () => {
      const validData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
        note: "a".repeat(500),
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject note longer than 500 characters", () => {
      const invalidData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
        note: "a".repeat(501),
      };

      const result = transactionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Notatka może mieć maksymalnie 500 znaków");
      }
    });

    it("should accept empty string as note", () => {
      const validData = {
        amount: 100,
        date: "2025-10-15",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        type: "expense" as const,
        note: "",
      };

      const result = transactionFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
