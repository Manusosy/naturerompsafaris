import configPromise from "@payload-config";
import { getPayload } from "payload";

import { normalizeMediaUrl } from "@/lib/cms-media";

export type DestinationCard = {
  country: string;
  description: string;
  id: string;
  imageAlt: string;
  imageUrl: string;
  name: string;
  region: string;
  slug: string;
  summary: string;
};

export type DestinationFaq = {
  answer: string;
  question: string;
};

export type DestinationDetail = DestinationCard & {
  content: string;
  faqs: DestinationFaq[];
  galleryUrls: string[];
  latitude: string;
  longitude: string;
  mapEmbedUrl: string;
};

type RawMedia = { alt?: string; url?: string; sizes?: Record<string, { url?: string }> };

function normaliseMedia(value: unknown): { url: string; alt: string } {
  if (value && typeof value === "object") {
    const media = value as RawMedia;
    const rawUrl = media.sizes?.card?.url ?? media.sizes?.medium?.url ?? media.url ?? "";
    return { url: normalizeMediaUrl(rawUrl), alt: media.alt ?? "" };
  }
  return { url: "", alt: "" };
}

function mapDestinationDoc(doc: Record<string, unknown>): DestinationCard {
  const hero = normaliseMedia(doc.heroImage);
  return {
    country: String(doc.country ?? ""),
    description: String(doc.summary ?? doc.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    id: String(doc.id),
    imageAlt: hero.alt || String(doc.name ?? ""),
    imageUrl: hero.url,
    name: String(doc.name ?? ""),
    region: String(doc.region ?? ""),
    slug: String(doc.slug ?? doc.id),
    summary: String(doc.summary ?? ""),
  };
}

export async function getAllDestinations(opts: {
  country?: string;
  limit?: number;
  region?: string;
} = {}): Promise<DestinationCard[]> {
  try {
    const payload = await getPayload({ config: configPromise });
    const where: Record<string, unknown> = {
      status: { equals: "published" },
    };
    if (opts.country && opts.country !== "__all") where.country = { equals: opts.country };
    if (opts.region) where.region = { equals: opts.region };

    const result = await payload.find({
      collection: "destinations",
      depth: 1,
      limit: opts.limit ?? 100,
      overrideAccess: true,
      sort: "name",
      where: where as never,
    });

    return (result.docs as Array<Record<string, unknown>>).map(mapDestinationDoc);
  } catch {
    return [];
  }
}

export async function getDestinationBySlug(slug: string): Promise<DestinationDetail | null> {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "destinations",
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
      } as never,
    });

    const doc = result.docs[0] as Record<string, unknown> | undefined;
    if (!doc) return null;

    const base = mapDestinationDoc(doc);
    const hero = normaliseMedia(doc.heroImage);
    const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
    const galleryUrls = gallery
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const record = item as Record<string, unknown>;
        return normaliseMedia(record.image).url;
      })
      .filter(Boolean);

    const faqs = Array.isArray(doc.faqs)
      ? (doc.faqs as Array<Record<string, unknown>>)
          .map((item) => ({
            answer: String(item.answer ?? ""),
            question: String(item.question ?? ""),
          }))
          .filter((item) => item.question && item.answer)
      : [];

    return {
      ...base,
      content: String(doc.content ?? ""),
      faqs,
      galleryUrls: [...new Set([hero.url, ...galleryUrls].filter(Boolean))],
      latitude: String(doc.latitude ?? ""),
      longitude: String(doc.longitude ?? ""),
      mapEmbedUrl: String(doc.mapEmbedUrl ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getDestinationRegions(country?: string): Promise<string[]> {
  try {
    const payload = await getPayload({ config: configPromise });
    const where: Record<string, unknown> = {
      status: { equals: "published" },
    };
    if (country && country !== "__all") where.country = { equals: country };

    const result = await payload.find({
      collection: "destinations",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      where: where as never,
    });

    const regions = (result.docs as Array<Record<string, unknown>>)
      .map((doc) => String(doc.region ?? "").trim())
      .filter(Boolean);

    return [...new Set(regions)].sort();
  } catch {
    return [];
  }
}
