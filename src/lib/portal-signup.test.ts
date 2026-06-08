import { describe, expect, it } from "vitest";

import {
  generateSignupCode,
  hashSignupCode,
  isWithinEmailCooldown,
  validateSignupPassword,
  verifySignupCode,
} from "./portal-signup";

describe("portal signup verification", () => {
  it("generates a 6-digit numeric code", () => {
    const code = generateSignupCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashes and verifies signup codes without leaking mismatches", () => {
    const secret = "test-secret-with-enough-length";
    const email = "admin@naturerompsafaris.com";
    const code = "483920";
    const hash = hashSignupCode(code, email, secret);

    expect(verifySignupCode(code, email, hash, secret)).toBe(true);
    expect(verifySignupCode("483921", email, hash, secret)).toBe(false);
    expect(verifySignupCode(code, "other@naturerompsafaris.com", hash, secret)).toBe(false);
  });

  it("enforces signup password complexity", () => {
    expect(validateSignupPassword("short")).toMatch(/12 characters/);
    expect(validateSignupPassword("twelvechars!!")).toMatch(/one number/);
    expect(validateSignupPassword("123456789012")).toMatch(/one letter/);
    expect(validateSignupPassword("SecurePass123")).toBeNull();
  });

  it("applies the email resend cooldown window", () => {
    const recent = new Date(Date.now() - 30_000).toISOString();
    const older = new Date(Date.now() - 90_000).toISOString();

    expect(isWithinEmailCooldown(recent)).toBe(true);
    expect(isWithinEmailCooldown(older)).toBe(false);
  });
});
