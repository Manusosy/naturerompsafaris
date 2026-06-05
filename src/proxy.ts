import { NextResponse, type NextRequest } from "next/server";

import { resolvePortalRoute } from "@/lib/portal-routing";

export function proxy(request: NextRequest) {
  const action = resolvePortalRoute({
    host: request.headers.get("host"),
    nextUrl: request.nextUrl,
    portalHost:
      process.env.PORTAL_HOST ?? "portal.kenyatanzaniasafariadventure.com",
    siteUrl:
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://kenyatanzaniasafariadventure.com",
  });

  const response = action.type === "redirect"
    ? NextResponse.redirect(action.destination)
    : NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)"],
};
