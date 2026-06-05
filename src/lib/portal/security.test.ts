import { describe, expect, it } from "vitest";

import {
  canManagePortalCollection,
  canManagePortalGlobal,
  isTrustedPortalOrigin,
} from "./security";

describe("portal security helpers", () => {
  it("limits operations users to operational collections", () => {
    const user = { role: "operations" };

    expect(canManagePortalCollection(user, "enquiries")).toBe(true);
    expect(canManagePortalCollection(user, "bookings")).toBe(false);
    expect(canManagePortalCollection(user, "trips")).toBe(false);
    expect(canManagePortalGlobal(user, "site-settings")).toBe(false);
  });

  it("allows editors to manage content but not operational leads", () => {
    const user = { role: "editor" };

    expect(canManagePortalCollection(user, "navigation-items")).toBe(true);
    expect(canManagePortalCollection(user, "posts")).toBe(true);
    expect(canManagePortalCollection(user, "enquiries")).toBe(false);
  });

  it("rejects unlisted collections even for admins", () => {
    const user = { role: "admin" };

    expect(canManagePortalCollection(user, "users")).toBe(false);
    expect(canManagePortalCollection(user, "payload-preferences")).toBe(false);
  });

  it("accepts same-origin mutations and rejects foreign origins", () => {
    const sameOrigin = new Request("http://localhost:3000/api/portal/records", {
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    });
    const foreignOrigin = new Request("http://localhost:3000/api/portal/records", {
      headers: { host: "localhost:3000", origin: "https://evil.example" },
    });

    expect(isTrustedPortalOrigin(sameOrigin)).toBe(true);
    expect(isTrustedPortalOrigin(foreignOrigin)).toBe(false);
  });
});
