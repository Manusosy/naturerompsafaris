import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { createExpiredPortalAuthCookie } from "@/lib/portal/session";

export async function POST() {
  const payload = await getPayload({ config: configPromise });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": createExpiredPortalAuthCookie(payload),
      },
    },
  );
}
