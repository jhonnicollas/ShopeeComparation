import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("hashPassword", () => {
  it("returns hash and salt", async () => {
    const result = await hashPassword("password123");
    expect(result.hash).toBeDefined();
    expect(result.salt).toBeDefined();
    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.salt.length).toBeGreaterThan(0);
  });

  it("generates different hashes for same password", async () => {
    const result1 = await hashPassword("password123");
    const result2 = await hashPassword("password123");
    expect(result1.hash).not.toBe(result2.hash);
    expect(result1.salt).not.toBe(result2.salt);
  });

  it("generates different hashes for different passwords", async () => {
    const result1 = await hashPassword("password123");
    const result2 = await hashPassword("differentPassword");
    expect(result1.hash).not.toBe(result2.hash);
  });

  it("includes pepper in hash", async () => {
    const result1 = await hashPassword("password123", "pepper1");
    const result2 = await hashPassword("password123", "pepper2");
    expect(result1.hash).not.toBe(result2.hash);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const { hash, salt } = await hashPassword("password123");
    const isValid = await verifyPassword("password123", hash, salt);
    expect(isValid).toBe(true);
  });

  it("returns false for incorrect password", async () => {
    const { hash, salt } = await hashPassword("password123");
    const isValid = await verifyPassword("wrongPassword", hash, salt);
    expect(isValid).toBe(false);
  });

  it("returns false for different salt", async () => {
    const { hash } = await hashPassword("password123");
    const isValid = await verifyPassword("password123", hash, "dW5yZWxhdGVkc2FsdA==");
    expect(isValid).toBe(false);
  });

  it("verifies with matching pepper", async () => {
    const { hash, salt } = await hashPassword("password123", "myPepper");
    const isValid1 = await verifyPassword("password123", hash, salt, "myPepper");
    expect(isValid1).toBe(true);
    const isValid2 = await verifyPassword("password123", hash, salt, "wrongPepper");
    expect(isValid2).toBe(false);
  });
});
