import { describe, expect, it } from "vitest";

import { resolvePortalRoute } from "./portal-routing";

const siteUrl = "https://kenyatanzaniasafariadventures.com";
const portalHost = "portal.kenyatanzaniasafariadventures.com";

function resolve(host: string, path: string) {
  return resolvePortalRoute({
    host,
    nextUrl: new URL(`https://${host}${path}`),
    portalHost,
    siteUrl,
  });
}

describe("resolvePortalRoute", () => {
  it("redirects the portal root to the custom admin portal", () => {
    const action = resolve(portalHost, "/");

    expect(action.type).toBe("redirect");
    if (action.type === "redirect") {
      expect(action.destination.pathname).toBe("/admin");
    }
  });

  it("keeps admin, CMS fallback, and API routes available on the portal host", () => {
    expect(resolve(portalHost, "/admin").type).toBe("next");
    expect(resolve(portalHost, "/cms-admin").type).toBe("next");
    expect(resolve(portalHost, "/api/users/me").type).toBe("next");
  });

  it("redirects Payload's internal first-user URL to the portal login URL", () => {
    const action = resolve("localhost:3000", "/admin/create-first-user");

    expect(action.type).toBe("redirect");
    if (action.type === "redirect") {
      expect(action.destination.pathname).toBe("/admin/login");
    }
  });

  it("keeps public routes off the portal host", () => {
    const action = resolve(portalHost, "/safari-packages");

    expect(action.type).toBe("redirect");
    if (action.type === "redirect") {
      expect(action.destination.pathname).toBe("/admin");
    }
  });

  it("redirects main-domain admin traffic to the portal host", () => {
    const action = resolve("kenyatanzaniasafariadventures.com", "/admin");

    expect(action.type).toBe("redirect");
    if (action.type === "redirect") {
      expect(action.destination.host).toBe(portalHost);
      expect(action.destination.pathname).toBe("/admin");
    }
  });

  it("redirects main-domain CMS fallback traffic to the portal host", () => {
    const action = resolve("kenyatanzaniasafariadventures.com", "/cms-admin");

    expect(action.type).toBe("redirect");
    if (action.type === "redirect") {
      expect(action.destination.host).toBe(portalHost);
      expect(action.destination.pathname).toBe("/cms-admin");
    }
  });

  it("leaves local development routes alone", () => {
    const action = resolve("localhost:3000", "/admin");

    expect(action.type).toBe("next");
  });

  it("treats the www main domain the same as the apex domain", () => {
    const action = resolve("www.kenyatanzaniasafariadventures.com", "/admin");

    expect(action.type).toBe("redirect");
    if (action.type === "redirect") {
      expect(action.destination.host).toBe(portalHost);
    }
  });
});
