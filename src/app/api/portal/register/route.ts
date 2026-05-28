import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import {
  prepareUserAuthData,
  unauthorizedAdminEmailMessage,
} from "@/lib/admin-auth";
import { getEnv } from "@/lib/env";
import { createPortalAuthCookie } from "@/lib/portal/session";

const genericRegisterError = "This account cannot be created.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const password = typeof body.password === "string" ? body.password : "";

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Use a password with at least 8 characters." },
        { status: 400 },
      );
    }

    const data = prepareUserAuthData(
      {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password,
        role: "admin",
      },
      {
        allowedDomain: getEnv().ADMIN_EMAIL_DOMAIN,
        forceAdminRole: true,
      },
    );

    const payload = await getPayload({ config: configPromise });
    await payload.create({
      collection: "users",
      data,
      overrideAccess: true,
    });

    const loginResult = await payload.login({
      collection: "users",
      data: {
        email: String(data.email),
        password,
      },
    });

    if (!loginResult.token) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: true, user: loginResult.user },
      {
        headers: {
          "Set-Cookie": createPortalAuthCookie({
            payload,
            token: loginResult.token,
          }),
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === unauthorizedAdminEmailMessage) {
      return NextResponse.json({ message: genericRegisterError }, { status: 403 });
    }

    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("unique"))
    ) {
      return NextResponse.json(
        { message: "An account with this email already exists. Please log in." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: genericRegisterError }, { status: 400 });
  }
}
