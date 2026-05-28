import configPromise from "@payload-config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

import { getEnv } from "@/lib/env";
import { ensureDefaultNavigation } from "@/lib/public-navigation";
import { verifyPortalToken } from "@/lib/portal/session";

export type PortalUser = {
  email?: string;
  id?: number | string;
  name?: string;
  role?: string;
};

export async function getPayloadClient() {
  return getPayload({ config: configPromise });
}

export async function getPortalUser(): Promise<PortalUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.getAll().find((cookie) => cookie.name.endsWith("-token"));
    const token = tokenCookie?.value;
    if (!token) return null;

    const payload = await getPayloadClient();
    const tokenPayload = await verifyPortalToken(token, payload.secret);
    if (
      !tokenPayload?.id ||
      tokenPayload.collection !== "users"
    ) {
      return null;
    }

    const user = await payload.findByID({
      collection: "users",
      depth: 0,
      id: tokenPayload.id,
      overrideAccess: true,
    });

    return {
      email: user.email,
      id: user.id,
      name: user.name || [user.firstName, user.lastName].filter(Boolean).join(" "),
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requirePortalUser() {
  const user = await getPortalUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function countCollection(collection: string, where?: Record<string, unknown>) {
  try {
    const payload = await getPayloadClient();
    const result = await payload.count({
      collection: collection as never,
      overrideAccess: true,
      where: where as never,
    });
    return result.totalDocs;
  } catch {
    return 0;
  }
}

export async function findCollection(
  collection: string,
  limit = 20,
  where?: Record<string, unknown>,
  page = 1,
) {
  try {
    const payload = await getPayloadClient();
    if (collection === "navigation-items") {
      await ensureDefaultNavigation(payload);
    }
    return await payload.find({
      collection: collection as never,
      depth: 1,
      limit,
      overrideAccess: true,
      page,
      sort: "-updatedAt",
      where: where as never,
    });
  } catch {
    return { docs: [], totalDocs: 0 };
  }
}

export async function getRelationOptions(collection: string) {
  const result = await findCollection(collection, 100);
  return (result.docs as Array<Record<string, unknown>>).map((doc) => ({
    label: String(doc.title ?? doc.name ?? doc.email ?? doc.filename ?? doc.id),
    value: String(doc.id),
  }));
}

export async function getMediaOptions() {
  const result = await findCollection("media", 100);
  return (result.docs as Array<Record<string, unknown>>).map((doc) => {
    const sizes = doc.sizes && typeof doc.sizes === "object" ? doc.sizes as Record<string, unknown> : {};
    const thumb = sizes.thumb && typeof sizes.thumb === "object" ? sizes.thumb as Record<string, unknown> : {};
    const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};
    return {
      alt: String(doc.alt ?? ""),
      caption: String(doc.caption ?? ""),
      filename: String(doc.filename ?? ""),
      id: String(doc.id),
      thumbUrl: String(thumb.url ?? card.url ?? doc.url ?? ""),
      url: String(card.url ?? doc.url ?? ""),
    };
  });
}

export async function findDocument(collection: string, id: string) {
  const payload = await getPayloadClient();
  return payload.findByID({
    collection: collection as never,
    depth: 1,
    id,
    overrideAccess: true,
  });
}

export async function getGlobal(slug: string) {
  const payload = await getPayloadClient();
  return payload.findGlobal({
    depth: 1,
    overrideAccess: true,
    slug: slug as never,
  });
}

export function portalHostLabel() {
  return getEnv().PORTAL_HOST;
}
