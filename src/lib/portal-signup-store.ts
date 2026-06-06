import type { Payload } from "payload";

import { normalizeAdminEmail } from "@/lib/admin-auth";
import {
  generateSignupCode,
  hashClientIp,
  hashSignupCode,
  isWithinEmailCooldown,
  SIGNUP_CODE_TTL_MS,
  SIGNUP_EMAIL_HOURLY_LIMIT,
  SIGNUP_IP_HOURLY_LIMIT,
  SIGNUP_MAX_VERIFY_ATTEMPTS,
  verifySignupCode,
} from "@/lib/portal-signup";

const verificationCollection = "portal-signup-verifications" as const;

type SignupVerificationRecord = {
  id: number | string;
  email: string;
  codeHash: string;
  expiresAt: string;
  attempts?: number | null;
  createdAt: string;
  requestIpHash?: string | null;
};

export async function cleanupExpiredSignupVerifications(payload: Payload) {
  await payload.delete({
    collection: verificationCollection,
    overrideAccess: true,
    where: {
      expiresAt: {
        less_than: new Date().toISOString(),
      },
    },
  });
}

export async function userExistsForSignup(payload: Payload, email: string) {
  const normalizedEmail = normalizeAdminEmail(email);
  if (typeof normalizedEmail !== "string") return false;

  const existing = await payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
  });

  return existing.docs.length > 0;
}

export async function canSendSignupCode({
  email,
  ipHash,
  payload,
}: {
  email: string;
  ipHash: string;
  payload: Payload;
}) {
  const normalizedEmail = normalizeAdminEmail(email);
  if (typeof normalizedEmail !== "string") {
    return { allowed: false, reason: "invalid-email" as const };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [emailRequests, ipRequests, latestForEmail] = await Promise.all([
    payload.find({
      collection: verificationCollection,
      depth: 0,
      limit: SIGNUP_EMAIL_HOURLY_LIMIT + 1,
      overrideAccess: true,
      sort: "-createdAt",
      where: {
        and: [
          { email: { equals: normalizedEmail } },
          { createdAt: { greater_than: hourAgo } },
        ],
      },
    }),
    payload.find({
      collection: verificationCollection,
      depth: 0,
      limit: SIGNUP_IP_HOURLY_LIMIT + 1,
      overrideAccess: true,
      sort: "-createdAt",
      where: {
        and: [
          { requestIpHash: { equals: ipHash } },
          { createdAt: { greater_than: hourAgo } },
        ],
      },
    }),
    payload.find({
      collection: verificationCollection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: "-createdAt",
      where: {
        email: {
          equals: normalizedEmail,
        },
      },
    }),
  ]);

  if (emailRequests.docs.length >= SIGNUP_EMAIL_HOURLY_LIMIT) {
    return { allowed: false, reason: "email-hourly-limit" as const };
  }

  if (ipRequests.docs.length >= SIGNUP_IP_HOURLY_LIMIT) {
    return { allowed: false, reason: "ip-hourly-limit" as const };
  }

  const latest = latestForEmail.docs[0] as SignupVerificationRecord | undefined;
  if (latest?.createdAt && isWithinEmailCooldown(latest.createdAt)) {
    return { allowed: false, reason: "email-cooldown" as const };
  }

  return { allowed: true as const };
}

export async function deleteSignupVerificationForEmail(payload: Payload, email: string) {
  const normalizedEmail = normalizeAdminEmail(email);
  if (typeof normalizedEmail !== "string") return;

  await payload.delete({
    collection: verificationCollection,
    overrideAccess: true,
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
  });
}

export async function createSignupVerification({
  email,
  ipHash,
  payload,
  secret,
}: {
  email: string;
  ipHash: string;
  payload: Payload;
  secret: string;
}) {
  const normalizedEmail = normalizeAdminEmail(email);
  if (typeof normalizedEmail !== "string") {
    throw new Error("Invalid email");
  }

  await payload.delete({
    collection: verificationCollection,
    overrideAccess: true,
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
  });

  const code = generateSignupCode();
  const expiresAt = new Date(Date.now() + SIGNUP_CODE_TTL_MS).toISOString();

  await payload.create({
    collection: verificationCollection,
    data: {
      attempts: 0,
      codeHash: hashSignupCode(code, normalizedEmail, secret),
      email: normalizedEmail,
      expiresAt,
      requestIpHash: ipHash,
    },
    overrideAccess: true,
  });

  return { code, email: normalizedEmail };
}

export async function verifySignupVerification({
  code,
  email,
  payload,
  secret,
}: {
  code: string;
  email: string;
  payload: Payload;
  secret: string;
}) {
  const normalizedEmail = normalizeAdminEmail(email);
  if (typeof normalizedEmail !== "string") {
    return { ok: false as const, reason: "invalid-email" as const };
  }

  const sanitizedCode = code.trim();
  if (!/^\d{6}$/.test(sanitizedCode)) {
    return { ok: false as const, reason: "invalid-code" as const };
  }

  const result = await payload.find({
    collection: verificationCollection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: "-createdAt",
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
  });

  const record = result.docs[0] as SignupVerificationRecord | undefined;
  if (!record) {
    return { ok: false as const, reason: "missing-record" as const };
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    await payload.delete({
      collection: verificationCollection,
      id: record.id,
      overrideAccess: true,
    });
    return { ok: false as const, reason: "expired" as const };
  }

  const attempts = record.attempts ?? 0;
  if (attempts >= SIGNUP_MAX_VERIFY_ATTEMPTS) {
    await payload.delete({
      collection: verificationCollection,
      id: record.id,
      overrideAccess: true,
    });
    return { ok: false as const, reason: "too-many-attempts" as const };
  }

  const matches = verifySignupCode(sanitizedCode, normalizedEmail, record.codeHash, secret);
  if (!matches) {
    const nextAttempts = attempts + 1;
    if (nextAttempts >= SIGNUP_MAX_VERIFY_ATTEMPTS) {
      await payload.delete({
        collection: verificationCollection,
        id: record.id,
        overrideAccess: true,
      });
    } else {
      await payload.update({
        collection: verificationCollection,
        id: record.id,
        data: {
          attempts: nextAttempts,
        },
        overrideAccess: true,
      });
    }

    return { ok: false as const, reason: "invalid-code" as const };
  }

  await payload.delete({
    collection: verificationCollection,
    id: record.id,
    overrideAccess: true,
  });

  return { ok: true as const, email: normalizedEmail };
}

export function hashSignupRequestIp(ip: string, secret: string) {
  return hashClientIp(ip, secret);
}
