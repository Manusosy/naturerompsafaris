import type { PortalUser } from "@/lib/portal/data";

const roleCollections = {
  admin: new Set([
    "navigation-items",
    "trips",
    "packages",
    "destinations",
    "itineraries",
    "posts",
    "post-categories",
    "article-tags",
    "gallery",
    "media",
    "enquiries",
    "bookings",
    "accommodations",
  ]),
  editor: new Set([
    "navigation-items",
    "trips",
    "packages",
    "destinations",
    "itineraries",
    "posts",
    "post-categories",
    "article-tags",
    "gallery",
    "media",
  ]),
  operations: new Set(["enquiries", "bookings", "accommodations"]),
};

const roleGlobals = {
  admin: new Set(["site-settings", "flight-affiliate-settings"]),
  editor: new Set(["site-settings", "flight-affiliate-settings"]),
  operations: new Set<string>(),
};

export function canManagePortalCollection(user: PortalUser, collection: string) {
  const role = user.role === "editor" || user.role === "operations" ? user.role : "admin";
  return roleCollections[role].has(collection);
}

export function canManagePortalGlobal(user: PortalUser, globalSlug: string) {
  const role = user.role === "editor" || user.role === "operations" ? user.role : "admin";
  return roleGlobals[role].has(globalSlug);
}

export function isTrustedPortalOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestHost = request.headers.get("host");
  try {
    const originUrl = new URL(origin);
    return originUrl.host === requestHost;
  } catch {
    return false;
  }
}
