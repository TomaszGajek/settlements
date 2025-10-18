/**
 * Testy jednostkowe dla funkcji formatCurrency i parseCurrency
 */

import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { parseCurrency } from "@/lib/utils/parseCurrency";

describe("formatCurrency", () => {
  it("should format positive amount correctly", () => {
    const result = formatCurrency(1500.5);
    // NBSP (U+00A0) jest używany przez Intl.NumberFormat
    expect(result).toMatch(/1[\s\u00A0]?500,50\s?zł/);
  });

  it("should format zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0,00\s?zł/);
  });

  it("should format large amounts correctly", () => {
    const result = formatCurrency(1000000);
    expect(result).toMatch(/1[\s\u00A0]?000[\s\u00A0]?000,00\s?zł/);
  });

  it("should round to 2 decimal places", () => {
    const result = formatCurrency(10.999);
    expect(result).toMatch(/11,00\s?zł/);
  });

  it("should format decimal places correctly", () => {
    const result = formatCurrency(123.45);
    expect(result).toMatch(/123,45\s?zł/);
  });

  it("should handle very small amounts", () => {
    const result = formatCurrency(0.01);
    expect(result).toMatch(/0,01\s?zł/);
  });

  it("should handle negative amounts", () => {
    const result = formatCurrency(-100.5);
    expect(result).toMatch(/-100,50\s?zł/);
  });
});

describe("parseCurrency", () => {
  it("should parse formatted currency string", () => {
    const result = parseCurrency("1 234,50");
    expect(result).toBe(1234.5);
  });

  it("should parse currency without spaces", () => {
    const result = parseCurrency("1234,50");
    expect(result).toBe(1234.5);
  });

  it("should parse currency with zł suffix", () => {
    const result = parseCurrency("150,00 zł");
    expect(result).toBe(150);
  });

  it("should parse currency without decimals", () => {
    const result = parseCurrency("150");
    expect(result).toBe(150);
  });

  it("should parse currency with dot as decimal separator", () => {
    const result = parseCurrency("150.50");
    expect(result).toBe(150.5);
  });

  it("should parse zero", () => {
    const result = parseCurrency("0,00");
    expect(result).toBe(0);
  });

  it("should return undefined for invalid input (empty string)", () => {
    const result = parseCurrency("");
    expect(result).toBeUndefined();
  });

  it("should return undefined for non-numeric string", () => {
    const result = parseCurrency("abc");
    expect(result).toBeUndefined();
  });

  it("should return undefined for null", () => {
    const result = parseCurrency(null as any);
    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined", () => {
    const result = parseCurrency(undefined as any);
    expect(result).toBeUndefined();
  });

  it("should handle negative amounts", () => {
    const result = parseCurrency("-100,50");
    expect(result).toBe(-100.5);
  });

  it("should handle currency with multiple spaces", () => {
    const result = parseCurrency("1   234,50");
    expect(result).toBe(1234.5);
  });
});

describe("currency round-trip", () => {
  it("should parse formatted currency back to original value", () => {
    const original = 1234.56;
    const formatted = formatCurrency(original);
    const parsed = parseCurrency(formatted);

    expect(parsed).toBe(original);
  });

  it("should handle zero in round-trip", () => {
    const original = 0;
    const formatted = formatCurrency(original);
    const parsed = parseCurrency(formatted);

    expect(parsed).toBe(original);
  });
});
