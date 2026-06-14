import configPromise from "@payload-config";
import { getPayload } from "payload";

type MediaDoc = {
  alt?: string;
  url?: string;
};

type AccommodationDoc = {
  id?: number | string;
  slug?: string;
  country?: string;
  price?: number;
  availability?: "available" | "limited" | "on-request" | "unavailable";
  description?: string;
  location?: string;
  name?: string;
  photos?: Array<MediaDoc | number | string>;
  priceText?: string;
  type?: string;
};

type LocalPayloadReader = {
  find: (args: {
    collection: string;
    depth?: number;
    limit?: number;
    overrideAccess?: boolean;
    where?: Record<string, unknown>;
  }) => Promise<{ docs?: Array<unknown> }>;
  findGlobal: (args: {
    overrideAccess?: boolean;
    slug: string;
  }) => Promise<unknown>;
};

export type PackageEnhancements = {
  accommodations: Array<{
    id: string;
    slug: string;
    country: string;
    price: number | null;
    availability: string;
    description?: string;
    imageAlt: string;
    imageUrl?: string;
    location: string;
    name: string;
    priceText?: string;
    type: string;
  }>;
  flightAffiliate:
  | {
    ctaLabel: string;
    href: string;
    provider: string;
  }
  | null;
};

export async function getPackageEnhancements(
  slug: string,
): Promise<PackageEnhancements> {
  try {
    const payload = (await getPayload({ config: configPromise })) as unknown as LocalPayloadReader;
    const packageResult = await payload.find({
      collection: "packages",
      where: { slug: { equals: slug } },
      depth: 2,
      limit: 1,
      overrideAccess: true,
    });
    const packageDoc = packageResult.docs?.[0] as
      | { accommodations?: AccommodationDoc[] }
      | undefined;
    const rawAccommodations = Array.isArray(packageDoc?.accommodations)
      ? (packageDoc.accommodations as AccommodationDoc[])
      : [];
    const flightSettings = await payload.findGlobal({
      slug: "flight-affiliate-settings",
      overrideAccess: true,
    }) as Record<string, unknown> | null;

    return {
      accommodations: rawAccommodations
        .filter((item) => typeof item === "object" && item?.name)
        .map((item) => {
          const firstPhoto = Array.isArray(item.photos)
            ? item.photos.find((photo) => typeof photo === "object")
            : undefined;
          const media = firstPhoto as MediaDoc | undefined;

          return {
            id: String(item.id ?? ""),
            slug: item.slug ?? String(item.id ?? ""),
            country: item.country ?? "kenya",
            price: item.price != null ? Number(item.price) : null,
            availability: item.availability ?? "on-request",
            description: item.description,
            imageAlt: media?.alt ?? item.name ?? "Safari accommodation",
            imageUrl: media?.url,
            location: item.location ?? "East Africa",
            name: item.name ?? "Accommodation option",
            priceText: item.priceText,
            type: item.type ?? "stay",
          };
        }),
      flightAffiliate:
        typeof flightSettings?.provider === "string" &&
          flightSettings.provider !== "disabled" &&
          typeof flightSettings.affiliateUrl === "string"
          ? {
            ctaLabel:
              typeof flightSettings.ctaLabel === "string"
                ? flightSettings.ctaLabel
                : "Check Flights",
            href: flightSettings.affiliateUrl,
            provider: flightSettings.provider,
          }
          : null,
    };
  } catch {
    return {
      accommodations: [],
      flightAffiliate: null,
    };
  }
}
