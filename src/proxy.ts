import { NextResponse, type NextRequest } from "next/server";

import { getEnv } from "@/lib/env";
import { resolvePortalRoute } from "@/lib/portal-routing";

export function proxy(request: NextRequest) {
  const env = getEnv();
  const action = resolvePortalRoute({
    host: request.headers.get("host"),
    nextUrl: request.nextUrl,
    portalHost: env.PORTAL_HOST,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
  });

  if (action.type === "redirect") {
    return NextResponse.redirect(action.destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)"],
};
