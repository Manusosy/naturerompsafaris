import { describe, expect, it } from "vitest";

import {
  assertAuthorizedAdminEmail,
  isAuthorizedAdminEmail,
  normalizeAdminEmail,
  prepareUserAuthData,
  unauthorizedAdminEmailMessage,
} from "./admin-auth";

describe("admin email authorization", () => {
  it("normalizes admin email addresses before saving", () => {
    expect(normalizeAdminEmail(" ADMIN@NatureRompSafaris.com ")).toBe(
      "admin@naturerompsafaris.com",
    );
  });

  it("accepts the configured admin email domain", () => {
    expect(
      isAuthorizedAdminEmail(
        "operations@naturerompsafaris.com",
        "naturerompsafaris.com",
      ),
    ).toBe(true);
  });

  it("rejects non-authorized admin email domains with a generic message", () => {
    expect(() =>
      assertAuthorizedAdminEmail("owner@example.com", "naturerompsafaris.com"),
    ).toThrow(unauthorizedAdminEmailMessage);
  });

  it("forces unauthenticated first-user creation to admin", () => {
    expect(
      prepareUserAuthData(
        {
          email: " FIRST@NatureRompSafaris.com ",
          firstName: "  Grace  ",
          lastName: "  Wanjiku  Owner ",
          role: "operations",
        },
        {
          allowedDomain: "naturerompsafaris.com",
          forceAdminRole: true,
        },
      ),
    ).toEqual({
      email: "first@naturerompsafaris.com",
      firstName: "Grace",
      lastName: "Wanjiku Owner",
      name: "Grace Wanjiku Owner",
      role: "admin",
    });
  });
});
