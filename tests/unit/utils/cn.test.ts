import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge single class name", () => {
    const result = cn("text-red-500");
    expect(result).toBe("text-red-500");
  });

  it("should merge multiple class names", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const isHidden = false;
    const result = cn("base-class", isActive && "conditional-class", isHidden && "hidden-class");
    expect(result).toBe("base-class conditional-class");
  });

  it("should handle undefined and null values", () => {
    const result = cn("text-red-500", undefined, null, "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should merge conflicting Tailwind classes (twMerge)", () => {
    // twMerge should keep the last conflicting class
    const result = cn("px-4 py-2", "px-8");
    expect(result).toBe("py-2 px-8");
  });

  it("should handle array of class names", () => {
    const result = cn(["text-red-500", "bg-blue-500"]);
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle object with boolean values", () => {
    const result = cn({
      "text-red-500": true,
      "bg-blue-500": false,
      "p-4": true,
    });
    expect(result).toBe("text-red-500 p-4");
  });

  it("should handle empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle complex nested inputs", () => {
    const result = cn("base", ["nested-1", "nested-2"], { dynamic: true, hidden: false }, "final");
    expect(result).toBe("base nested-1 nested-2 dynamic final");
  });

  it("should trim whitespace", () => {
    const result = cn("  text-red-500  ", "  bg-blue-500  ");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should merge same tailwind utility classes correctly", () => {
    // When using the same utility with different values, last one wins
    const result = cn("text-sm text-lg text-xl");
    expect(result).toBe("text-xl");
  });

  it("should handle mixed responsive and state variants", () => {
    const result = cn("hover:text-red-500", "md:text-blue-500", "lg:hover:text-green-500");
    expect(result).toBe("hover:text-red-500 md:text-blue-500 lg:hover:text-green-500");
  });
});
