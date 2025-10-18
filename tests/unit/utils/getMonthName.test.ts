import { describe, it, expect } from "vitest";
import { getMonthName } from "@/lib/utils/getMonthName";

describe("getMonthName", () => {
  it("should return correct Polish name for January (1)", () => {
    expect(getMonthName(1)).toBe("Styczeń");
  });

  it("should return correct Polish name for February (2)", () => {
    expect(getMonthName(2)).toBe("Luty");
  });

  it("should return correct Polish name for March (3)", () => {
    expect(getMonthName(3)).toBe("Marzec");
  });

  it("should return correct Polish name for April (4)", () => {
    expect(getMonthName(4)).toBe("Kwiecień");
  });

  it("should return correct Polish name for May (5)", () => {
    expect(getMonthName(5)).toBe("Maj");
  });

  it("should return correct Polish name for June (6)", () => {
    expect(getMonthName(6)).toBe("Czerwiec");
  });

  it("should return correct Polish name for July (7)", () => {
    expect(getMonthName(7)).toBe("Lipiec");
  });

  it("should return correct Polish name for August (8)", () => {
    expect(getMonthName(8)).toBe("Sierpień");
  });

  it("should return correct Polish name for September (9)", () => {
    expect(getMonthName(9)).toBe("Wrzesień");
  });

  it("should return correct Polish name for October (10)", () => {
    expect(getMonthName(10)).toBe("Październik");
  });

  it("should return correct Polish name for November (11)", () => {
    expect(getMonthName(11)).toBe("Listopad");
  });

  it("should return correct Polish name for December (12)", () => {
    expect(getMonthName(12)).toBe("Grudzień");
  });

  it("should return error message for invalid month 0", () => {
    expect(getMonthName(0)).toBe("Nieprawidłowy miesiąc");
  });

  it("should return error message for invalid month 13", () => {
    expect(getMonthName(13)).toBe("Nieprawidłowy miesiąc");
  });

  it("should return error message for negative month", () => {
    expect(getMonthName(-1)).toBe("Nieprawidłowy miesiąc");
  });

  it("should return error message for very large month number", () => {
    expect(getMonthName(100)).toBe("Nieprawidłowy miesiąc");
  });
});

