import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { isAuthorizedAdminEmail } from "@/lib/admin-auth";
import { getEnv } from "@/lib/env";
import { getClientIp, SIGNUP_GENERIC_SENT_MESSAGE } from "@/lib/portal-signup";
import {
  canSendSignupCode,
  cleanupExpiredSignupVerifications,
  createSignupVerification,
  deleteSignupVerificationForEmail,
  hashSignupRequestIp,
  userExistsForSignup,
} from "@/lib/portal-signup-store";
import { isTrustedPortalOrigin } from "@/lib/portal/security";
import { sendSignupVerificationEmail } from "@/lib/signup-mailer";

export async function POST(request: Request) {
  if (!isTrustedPortalOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const env = getEnv();
  if (!env.PORTAL_SIGNUP_ENABLED || !env.hasSignupSmtpProvider) {
    return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
  }

  let email = "";
  try {
    const data = (await request.json()) as { email?: string };
    email = data.email?.trim().toLowerCase() ?? "";
  } catch {
    return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
  }

  if (!email || !isAuthorizedAdminEmail(email, env.ADMIN_EMAIL_DOMAIN)) {
    return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
  }

  try {
    const payload = await getPayload({ config: configPromise });
    await cleanupExpiredSignupVerifications(payload);

    if (await userExistsForSignup(payload, email)) {
      return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
    }

    const ipHash = hashSignupRequestIp(getClientIp(request), env.getPayloadSecret());
    const sendAllowed = await canSendSignupCode({
      email,
      ipHash,
      payload,
    });

    if (!sendAllowed.allowed) {
      return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
    }

    const verification = await createSignupVerification({
      email,
      ipHash,
      payload,
      secret: env.getPayloadSecret(),
    });

    try {
      await sendSignupVerificationEmail({
        code: verification.code,
        email: verification.email,
      });
    } catch (mailError) {
      await deleteSignupVerificationForEmail(payload, verification.email);
      console.error("[portal-signup] Failed to send verification email", mailError);
      return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
    }
  } catch (error) {
    console.error("[portal-signup] Failed to prepare verification code", error);
    return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
  }

  return NextResponse.json({ message: SIGNUP_GENERIC_SENT_MESSAGE });
}
