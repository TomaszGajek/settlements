/**
 * Testy jednostkowe dla auth.schema.ts
 * TC zgodne z planem testów - walidacja formularzy autentykacji
 */

import { describe, it, expect } from "vitest";
import { loginFormSchema, registerFormSchema, resetPasswordFormSchema } from "@/lib/schemas/auth.schema";

describe("loginFormSchema", () => {
  describe("valid data", () => {
    it("should accept valid email and password", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should lowercase email", () => {
      const validData = {
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      };

      const result = loginFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    // Note: email() validator runs before trim(), so emails with
    // leading/trailing spaces will be rejected by email() validator

    it("should accept minimum password length (6 characters)", () => {
      const validData = {
        email: "test@example.com",
        password: "123456",
      };

      const result = loginFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
      };

      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format adresu email");
      }
    });

    it("should reject email without @", () => {
      const invalidData = {
        email: "testexample.com",
        password: "password123",
      };

      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing email", () => {
      const invalidData = {
        password: "password123",
      };

      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Email jest wymagany");
      }
    });
  });

  describe("password validation", () => {
    it("should reject password shorter than 6 characters", () => {
      const invalidData = {
        email: "test@example.com",
        password: "12345",
      };

      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło musi mieć minimum 6 znaków");
      }
    });

    it("should reject missing password", () => {
      const invalidData = {
        email: "test@example.com",
      };

      const result = loginFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło jest wymagane");
      }
    });
  });
});

describe("registerFormSchema", () => {
  describe("valid data", () => {
    it("should accept valid registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should lowercase email", () => {
      const validData = {
        email: "TEST@EXAMPLE.COM",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    // Note: email() validator runs before trim(), so emails with
    // leading/trailing spaces will be rejected by email() validator
  });

  describe("password confirmation", () => {
    it("should reject when passwords do not match", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
      };

      const result = registerFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasła muszą być identyczne");
        expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
      }
    });

    it("should reject missing confirm password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = registerFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Potwierdzenie hasła jest wymagane");
      }
    });

    it("should accept matching passwords", () => {
      const validData = {
        email: "test@example.com",
        password: "MySecurePassword123!",
        confirmPassword: "MySecurePassword123!",
      };

      const result = registerFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format adresu email");
      }
    });
  });

  describe("password validation", () => {
    it("should reject password shorter than 6 characters", () => {
      const invalidData = {
        email: "test@example.com",
        password: "12345",
        confirmPassword: "12345",
      };

      const result = registerFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło musi mieć minimum 6 znaków");
      }
    });
  });
});

describe("resetPasswordFormSchema", () => {
  describe("valid data", () => {
    it("should accept valid email", () => {
      const validData = {
        email: "test@example.com",
      };

      const result = resetPasswordFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should lowercase email", () => {
      const validData = {
        email: "TEST@EXAMPLE.COM",
      };

      const result = resetPasswordFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    // Note: email() validator runs before trim(), so emails with
    // leading/trailing spaces will be rejected by email() validator
  });

  describe("email validation", () => {
    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
      };

      const result = resetPasswordFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format adresu email");
      }
    });

    it("should reject missing email", () => {
      const invalidData = {};

      const result = resetPasswordFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Email jest wymagany");
      }
    });
  });
});
