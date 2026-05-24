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

  if (action.type === "redirect") {
    return NextResponse.redirect(action.destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)"],
};
