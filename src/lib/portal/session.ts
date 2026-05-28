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
