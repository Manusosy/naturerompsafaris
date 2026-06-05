import configPromise from "@payload-config";
import { cache } from "react";
import { getPayload } from "payload";

export type PublicDestinationNavItem = {
  country: string;
  name: string;
  region: string;
  slug: string;
  summary: string;
};

export const getPublishedDestinationsForNav = cache(async (): Promise<PublicDestinationNavItem[]> => {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "destinations" as never,
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: "name",
      where: {
        status: { equals: "published" },
      } as never,
    });

    return (result.docs as Array<Record<string, unknown>>)
      .map((doc) => ({
        country: String(doc.country ?? "").toLowerCase(),
        name: String(doc.name ?? "").trim(),
        region: String(doc.region ?? "").trim(),
        slug: String(doc.slug ?? "").trim(),
        summary: String(doc.summary ?? "").trim(),
      }))
      .filter((doc) => doc.name && doc.slug);
  } catch {
    return [];
  }
});
