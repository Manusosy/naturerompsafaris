import { jwtVerify } from "jose";
import { generateExpiredPayloadCookie, generatePayloadCookie, type Payload } from "payload";

export function createPortalAuthCookie({
  payload,
  token,
}: {
  payload: Payload;
  token: string;
}) {
  const usersCollection = payload.collections.users;

  return generatePayloadCookie({
    collectionAuthConfig: usersCollection.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  });
}

export function createExpiredPortalAuthCookie(payload: Payload) {
  return generateExpiredPayloadCookie({
    collectionAuthConfig: payload.collections.users.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
  });
}

export type PortalTokenPayload = {
  collection?: string;
  email?: string;
  exp?: number;
  id?: number | string;
  sid?: string;
};

export async function verifyPortalToken(
  token: string,
  secret: string,
): Promise<PortalTokenPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as PortalTokenPayload;
  } catch {
    return null;
  }
}

function parseCookieHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const segment of cookieHeader.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator);
    if (key !== name) continue;
    return decodeURIComponent(trimmed.slice(separator + 1));
  }
  return null;
}

/** Read the Payload auth token from request headers or Next cookie stores. */
export async function readPortalAuthToken({
  cookieHeader,
  cookieName,
  cookieStore,
}: {
  cookieHeader?: string | null;
  cookieName: string;
  cookieStore?: {
    get: (name: string) => { value: string } | undefined;
    getAll: () => Array<{ name: string; value: string }>;
  };
}) {
  if (cookieHeader) {
    const fromHeader = parseCookieHeader(cookieHeader, cookieName);
    if (fromHeader) return fromHeader;
  }

  if (cookieStore) {
    const direct = cookieStore.get(cookieName)?.value;
    if (direct) return direct;
    const fallback = cookieStore.getAll().find((cookie) => cookie.name.endsWith("-token"));
    if (fallback?.value) return fallback.value;
  }

  return null;
}
