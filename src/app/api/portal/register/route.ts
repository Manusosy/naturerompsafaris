import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { isAuthorizedAdminEmail } from "@/lib/admin-auth";
import { getEnv } from "@/lib/env";
import {
  SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE,
  validateSignupPassword,
} from "@/lib/portal-signup";
import {
  cleanupExpiredSignupVerifications,
  userExistsForSignup,
  verifySignupVerification,
} from "@/lib/portal-signup-store";
import { isTrustedPortalOrigin } from "@/lib/portal/security";
import { createPortalAuthCookie } from "@/lib/portal/session";

export async function POST(request: Request) {
  if (!isTrustedPortalOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const env = getEnv();
  if (!env.PORTAL_SIGNUP_ENABLED || !env.hasSignupSmtpProvider) {
    return NextResponse.json(
      { message: SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE },
      { status: 403 },
    );
  }

  let body: {
    code?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { message: SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const code = body.code?.trim() ?? "";
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const password = body.password ?? "";

  if (
    !email ||
    !code ||
    !firstName ||
    !lastName ||
    !password ||
    !isAuthorizedAdminEmail(email, env.ADMIN_EMAIL_DOMAIN)
  ) {
    return NextResponse.json(
      { message: SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE },
      { status: 400 },
    );
  }

  const passwordError = validateSignupPassword(password);
  if (passwordError) {
    return NextResponse.json({ message: passwordError }, { status: 400 });
  }

  try {
    const payload = await getPayload({ config: configPromise });
    await cleanupExpiredSignupVerifications(payload);

    if (await userExistsForSignup(payload, email)) {
      return NextResponse.json(
        { message: SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE },
        { status: 400 },
      );
    }

    const verification = await verifySignupVerification({
      code,
      email,
      payload,
      secret: env.getPayloadSecret(),
    });

    if (!verification.ok) {
      return NextResponse.json(
        { message: SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE },
        { status: 400 },
      );
    }

    await payload.create({
      collection: "users",
      data: {
        email: verification.email,
        firstName,
        lastName,
        password,
      },
      overrideAccess: true,
    });

    const loginResult = await payload.login({
      collection: "users",
      data: {
        email: verification.email,
        password,
      },
    });

    if (!loginResult.token) {
      return NextResponse.json(
        { message: "Account created. Please sign in." },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        message: "Account created",
        user: loginResult.user,
      },
      {
        headers: {
          "Set-Cookie": createPortalAuthCookie({ payload, token: loginResult.token }),
        },
        status: 201,
      },
    );
  } catch {
    return NextResponse.json(
      { message: SIGNUP_GENERIC_REGISTER_FAILURE_MESSAGE },
      { status: 400 },
    );
  }
}
