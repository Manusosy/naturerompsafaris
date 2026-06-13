import configPromise from "@payload-config";
import { getPayload } from "payload";

import { normalizeMediaUrl } from "@/lib/cms-media";

export type AccommodationCard = {
  availability: string;
  availabilityNote: string;
  comfortLevel: string;
  country: string;
  description: string;
  id: string;
  imageAlt: string;
  imageUrl: string;
  location: string;
  name: string;
  price: number | null;
  priceText: string;
  slug: string;
  type: string;
};

export type AccommodationDetail = AccommodationCard & {
  amenities: string[];
  galleryUrls: string[];
  youtubeUrl: string;
};

type RawMedia = { alt?: string; url?: string; sizes?: Record<string, { url?: string }> };

function normalisePhoto(photo: unknown): { url: string; alt: string } {
  if (photo && typeof photo === "object") {
    const p = photo as RawMedia;
    const rawUrl = p.sizes?.card?.url ?? p.sizes?.medium?.url ?? p.url ?? "";
    return { url: normalizeMediaUrl(rawUrl), alt: p.alt ?? "" };
  }
  return { url: "", alt: "" };
}

export async function getAllAccommodations(opts: {
  comfortLevel?: string;
  country?: string;
  limit?: number;
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  type?: string;
} = {}): Promise<AccommodationCard[]> {
  try {
    const payload = await getPayload({ config: configPromise });

    const where: Record<string, unknown> = {
      status: { equals: "published" },
    };
    if (opts.country && opts.country !== "__all") where.country = { equals: opts.country };
    if (opts.type && opts.type !== "__all") where.type = { equals: opts.type };
    if (opts.comfortLevel && opts.comfortLevel !== "__all") where.comfortLevel = { equals: opts.comfortLevel };
    if (opts.location) where.location = { like: opts.location };
    if (opts.minPrice != null) where.price = { ...((where.price as object) ?? {}), greater_than_equal: opts.minPrice };
    if (opts.maxPrice != null) where.price = { ...((where.price as object) ?? {}), less_than_equal: opts.maxPrice };

    const result = await payload.find({
      collection: "accommodations",
      depth: 1,
      limit: opts.limit ?? 60,
      overrideAccess: true,
      sort: "name",
      where: Object.keys(where).length ? (where as never) : undefined,
    });

    return (result.docs as Array<Record<string, unknown>>).map((doc) => {
      const photos = Array.isArray(doc.photos) ? doc.photos : [];
      const cover = normalisePhoto(photos[0]);
      return {
        availability: String(doc.availability ?? "on-request"),
        availabilityNote: String(doc.availabilityNote ?? ""),
        comfortLevel: String(doc.comfortLevel ?? ""),
        country: String(doc.country ?? ""),
        description: String(doc.description ?? ""),
        id: String(doc.id),
        imageAlt: cover.alt || String(doc.name ?? ""),
        imageUrl: cover.url,
        location: String(doc.location ?? ""),
        name: String(doc.name ?? ""),
        price: doc.price != null ? Number(doc.price) : null,
        priceText: String(doc.priceText ?? ""),
        slug: String(doc.slug ?? doc.id),
        type: String(doc.type ?? "lodge"),
      };
    });
  } catch {
    return [];
  }
}

export async function getAccommodationBySlug(slug: string): Promise<AccommodationDetail | null> {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "accommodations",
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
    });

    const doc = result.docs[0] as Record<string, unknown> | undefined;
    if (!doc) return null;

    const photos = Array.isArray(doc.photos) ? doc.photos : [];
    const cover = normalisePhoto(photos[0]);
    const gallery = photos.slice(1).map((p) => normalisePhoto(p).url).filter(Boolean);

    const rawAmenities = Array.isArray(doc.amenities)
      ? (doc.amenities as Array<Record<string, unknown>>)
          .map((a) => String(a.amenity ?? ""))
          .filter(Boolean)
      : [];

    return {
      amenities: rawAmenities,
      availability: String(doc.availability ?? "on-request"),
      availabilityNote: String(doc.availabilityNote ?? ""),
      comfortLevel: String(doc.comfortLevel ?? ""),
      country: String(doc.country ?? ""),
      description: String(doc.description ?? ""),
      galleryUrls: gallery,
      id: String(doc.id),
      imageAlt: cover.alt || String(doc.name ?? ""),
      imageUrl: cover.url,
      location: String(doc.location ?? ""),
      name: String(doc.name ?? ""),
      price: doc.price != null ? Number(doc.price) : null,
      priceText: String(doc.priceText ?? ""),
      slug: String(doc.slug ?? doc.id),
      type: String(doc.type ?? "lodge"),
      youtubeUrl: String(doc.youtubeUrl ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getAccommodationLocations(country?: string): Promise<string[]> {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "accommodations",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      where: country && country !== "__all" ? { country: { equals: country } } as never : undefined,
    });
    const locs = (result.docs as Array<Record<string, unknown>>)
      .map((d) => String(d.location ?? "").trim())
      .filter(Boolean);
    return [...new Set(locs)].sort();
  } catch {
    return [];
  }
}
