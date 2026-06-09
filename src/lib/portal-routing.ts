export type PortalRouteAction =
  | { type: "next" }
  | { destination: URL; type: "redirect" };

const allowedPortalPrefixes = [
  "/admin",
  "/assets",
  "/cms-admin",
  "/api",
  "/_next",
  "/media",
  "/favicon.ico",
];

function normalizeHost(host: string | null) {
  return (host ?? "").split(":")[0].toLowerCase();
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function isMainSiteHost(host: string, siteHost: string) {
  return host === siteHost || host === `www.${siteHost}`;
}

export function resolvePortalRoute({
  host,
  nextUrl,
  portalHost,
  siteUrl,
}: {
  host: string | null;
  nextUrl: URL;
  portalHost: string;
  siteUrl: string;
}): PortalRouteAction {
  const normalizedHost = normalizeHost(host);
  const normalizedPortalHost = normalizeHost(portalHost);
  const siteHost = normalizeHost(new URL(siteUrl).host);
  const isPortalHost = normalizedHost === normalizedPortalHost;
  const isMainHost = isMainSiteHost(normalizedHost, siteHost);
  const pathname = nextUrl.pathname;

  if (pathname === "/admin/create-first-user") {
    return { type: "redirect", destination: new URL("/admin/login", nextUrl) };
  }

  if (isPortalHost) {
    if (pathname === "/") {
      return { type: "redirect", destination: new URL("/admin", nextUrl) };
    }

    if (allowedPortalPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return { type: "next" };
    }

    return { type: "redirect", destination: new URL("/admin", nextUrl) };
  }

  if (
    isMainHost &&
    (pathname.startsWith("/admin") || pathname.startsWith("/cms-admin")) &&
    !isLocalHost(normalizedHost)
  ) {
    const destination = new URL(nextUrl);
    destination.protocol = new URL(siteUrl).protocol;
    destination.hostname = normalizedPortalHost;
    destination.port = "";
    return { type: "redirect", destination };
  }

  return { type: "next" };
}
