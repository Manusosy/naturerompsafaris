import configPromise from "@payload-config";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getPayload } from "payload";

import { getEnv } from "@/lib/env";
import { readPortalAuthToken, verifyPortalToken } from "@/lib/portal/session";

export type PortalUser = {
  email?: string;
  id?: number | string;
  name?: string;
  role?: string;
};

export async function getPayloadClient() {
  return getPayload({ config: configPromise });
}

async function readPortalAuthTokenFromContext(request?: Pick<Request, "headers">) {
  const payload = await getPayloadClient();
  const cookieName = `${payload.config.cookiePrefix}-token`;
  let cookieStore: Awaited<ReturnType<typeof cookies>> | undefined;

  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = undefined;
  }

  let cookieHeader = request?.headers.get("cookie");
  if (!cookieHeader) {
    try {
      cookieHeader = (await headers()).get("cookie");
    } catch {
      cookieHeader = null;
    }
  }

  return readPortalAuthToken({
    cookieHeader,
    cookieName,
    cookieStore,
  });
}

export async function getPortalUser(request?: Pick<Request, "headers">): Promise<PortalUser | null> {
  try {
    const payload = await getPayloadClient();
    const token = await readPortalAuthTokenFromContext(request);
    if (!token) return null;

    const tokenPayload = await verifyPortalToken(token, payload.secret);
    if (!tokenPayload?.id || tokenPayload.collection !== "users") return null;

    const user = await payload.findByID({
      collection: "users",
      depth: 0,
      id: tokenPayload.id,
      overrideAccess: true,
    });

    if (!user) return null;

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

/** Server actions should throw instead of redirecting — redirect feels like an instant logout. */
export async function requirePortalUserForAction() {
  const user = await getPortalUser();
  if (!user) {
    throw new Error("Your session expired. Refresh the page and sign in again.");
  }
  return user;
}

export const countCollection = cache(async (collection: string, where?: Record<string, unknown>) => {
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
});

export const findCollection = cache(async (
  collection: string,
  limit = 20,
  where?: Record<string, unknown>,
  page = 1,
  sort = "-updatedAt",
) => {
  try {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: collection as never,
      depth: 1,
      limit,
      overrideAccess: true,
      page,
      sort,
      where: where as never,
    });
  } catch {
    return { docs: [], totalDocs: 0 };
  }
});

export const getRelationOptions = cache(async (collection: string) => {
  const result = await findCollection(collection, 100);
  return (result.docs as Array<Record<string, unknown>>).map((doc) => ({
    label: String(doc.title ?? doc.name ?? doc.email ?? doc.filename ?? doc.id),
    value: String(doc.id),
  }));
});

export type WizardLinkOption = {
  category?: string;
  dayCount?: number;
  destinationIds?: string[];
  href?: string;
  label: string;
  mapPlace?: string;
  meta?: string;
  packageTier?: string;
  value: string;
};

function relationDocLabel(doc: Record<string, unknown>) {
  return String(doc.title ?? doc.name ?? doc.id);
}

function packageDocMeta(doc: Record<string, unknown>) {
  return [doc.category, doc.duration, doc.priceText].filter(Boolean).join(" · ");
}

function destinationDocMeta(doc: Record<string, unknown>) {
  const country = doc.country ? String(doc.country) : "";
  const region = doc.region ? String(doc.region) : "";
  return [country, region].filter(Boolean).join(" · ");
}

function destinationMapPlace(doc: Record<string, unknown>) {
  const name = relationDocLabel(doc);
  const country = doc.country === "kenya" ? "Kenya" : doc.country === "tanzania" ? "Tanzania" : "";
  return country ? `${name}, ${country}` : name;
}

export const getTripWizardRelations = cache(async () => {
  const [destinationResult, packageResult, tripResult, itineraryResult] = await Promise.all([
    findCollection("destinations", 100),
    findCollection("packages", 100),
    findCollection("trips", 100),
    findCollection("itineraries", 100),
  ]);

  const destinations = (destinationResult.docs as Array<Record<string, unknown>>)
    .filter((doc) => doc.status === "published")
    .map((doc) => ({
      href: doc.slug ? `/destinations/${String(doc.slug)}` : undefined,
      label: relationDocLabel(doc),
      mapPlace: destinationMapPlace(doc),
      meta: destinationDocMeta(doc),
      value: String(doc.id),
    }));

  const packages = (packageResult.docs as Array<Record<string, unknown>>)
    .filter((doc) => doc.status !== "trashed")
    .map((doc) => {
      const destinationIds = Array.isArray(doc.destinations)
        ? doc.destinations
            .map((item) => {
              if (item && typeof item === "object" && "id" in item) {
                return String((item as { id?: unknown }).id ?? "");
              }
              if (typeof item === "string" || typeof item === "number") return String(item);
              return "";
            })
            .filter(Boolean)
        : [];

      return {
        category: typeof doc.category === "string" ? doc.category : undefined,
        destinationIds,
        href: doc.slug ? `/safari-packages/${String(doc.slug)}` : undefined,
        label: relationDocLabel(doc),
        meta: [
          packageDocMeta(doc),
          doc.status === "draft" ? "Draft" : "",
        ]
          .filter(Boolean)
          .join(" · "),
        packageTier: typeof doc.packageTier === "string" ? doc.packageTier : undefined,
        value: String(doc.id),
      };
    });

  const trips = (tripResult.docs as Array<Record<string, unknown>>)
    .filter((doc) => doc.status === "published")
    .map((doc) => ({
      href: doc.slug ? `/trips/${String(doc.slug)}` : undefined,
      label: relationDocLabel(doc),
      meta: [doc.location, doc.days ? `${doc.days} days` : ""].filter(Boolean).join(" · "),
      value: String(doc.id),
    }));

  const itineraries = (itineraryResult.docs as Array<Record<string, unknown>>).map((doc) => {
    const linkedPackage =
      doc.package && typeof doc.package === "object"
        ? (doc.package as Record<string, unknown>)
        : null;
    return {
      dayCount: doc.dayCount != null ? Number(doc.dayCount) : undefined,
      label: relationDocLabel(doc),
      meta: [
        doc.dayCount ? `${doc.dayCount} days` : "",
        linkedPackage ? `Package: ${relationDocLabel(linkedPackage)}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      value: String(doc.id),
    };
  });

  return { destinations, itineraries, packages, trips };
});

export const getMediaOptions = cache(async () => {
  const result = await findCollection("media", 36);
  const { toPortalMediaOption } = await import("@/lib/portal/media-option");
  return (result.docs as Array<Record<string, unknown>>).map(toPortalMediaOption);
});

export const findDocument = cache(async (collection: string, id: string) => {
  const payload = await getPayloadClient();
  return payload.findByID({
    collection: collection as never,
    depth: 1,
    id,
    overrideAccess: true,
  });
});

export const getGlobal = cache(async (slug: string) => {
  const payload = await getPayloadClient();
  return payload.findGlobal({
    depth: 1,
    overrideAccess: true,
    slug: slug as never,
  });
});

export function portalHostLabel() {
  return getEnv().PORTAL_HOST;
}
