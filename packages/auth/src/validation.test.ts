import { describe, expect, it } from "vitest";
import {
  validateAuthInput,
  validateEmail,
  validateName,
  validatePassword,
} from "./validation.js";

describe("validateEmail", () => {
  it("returns valid for correct email", () => {
    const result = validateEmail("user@example.com");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns invalid for empty string", () => {
    const result = validateEmail("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for missing @", () => {
    const result = validateEmail("userexample.com");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for missing domain", () => {
    const result = validateEmail("user@");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for missing local part", () => {
    const result = validateEmail("@example.com");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for spaces", () => {
    const result = validateEmail("user @example.com");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for too long email", () => {
    const longEmail = "a".repeat(250) + "@example.com";
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
  });
});

describe("validatePassword", () => {
  it("returns valid for password with min length", () => {
    const result = validatePassword("12345678");
    expect(result.valid).toBe(true);
  });

  it("returns invalid for empty string", () => {
    const result = validatePassword("");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for password too short", () => {
    const result = validatePassword("1234567");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least");
  });

  it("returns invalid for password too long", () => {
    const result = validatePassword("a".repeat(129));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at most");
  });

  it("accepts long passwords within limit", () => {
    const result = validatePassword("a".repeat(128));
    expect(result.valid).toBe(true);
  });
});

describe("validateName", () => {
  it("returns valid for empty string", () => {
    const result = validateName("");
    expect(result.valid).toBe(true);
  });

  it("returns valid for normal name", () => {
    const result = validateName("John Doe");
    expect(result.valid).toBe(true);
  });

  it("returns invalid for too long name", () => {
    const result = validateName("a".repeat(101));
    expect(result.valid).toBe(false);
  });
});

describe("validateAuthInput", () => {
  it("returns valid for complete valid input", () => {
    const result = validateAuthInput("user@example.com", "password123", "John");
    expect(result.valid).toBe(true);
  });

  it("returns valid without name", () => {
    const result = validateAuthInput("user@example.com", "password123");
    expect(result.valid).toBe(true);
  });

  it("returns invalid for bad email", () => {
    const result = validateAuthInput("invalid", "password123");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for short password", () => {
    const result = validateAuthInput("user@example.com", "short");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for long name", () => {
    const result = validateAuthInput(
      "user@example.com",
      "password123",
      "a".repeat(101)
    );
    expect(result.valid).toBe(false);
  });
});
