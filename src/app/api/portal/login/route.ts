import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { createPortalAuthCookie } from "@/lib/portal/session";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const payload = await getPayload({ config: configPromise });
    const result = await payload.login({
      collection: "users",
      data: {
        email: data.email?.trim().toLowerCase() ?? "",
        password: data.password ?? "",
      },
    });

    if (!result.token) {
      return NextResponse.json(
        { message: "The email or password provided is incorrect." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        message: "Authentication passed",
        user: result.user,
      },
      {
        headers: {
          "Set-Cookie": createPortalAuthCookie({ payload, token: result.token }),
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "The email or password provided is incorrect." },
      { status: 401 },
    );
  }
}
