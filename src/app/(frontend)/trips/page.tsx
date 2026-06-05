import configPromise from "@payload-config";
import type { Metadata } from "next";
import { getPayload } from "payload";

import { TripCard, type Trip } from "@/components/Cards";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Safari Tours",
  description: "Browse quote-first Kenya, Tanzania, Zanzibar, and combined East Africa safari tours by Nature Romp Safaris.",
  keywords: "Kenya safari tours, Tanzania safari tours, Zanzibar safari holiday, Kenya Tanzania safari adventure",
  path: "/trips",
});

function normalizeTrip(doc: Record<string, unknown>): Trip {
  const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  return {
    availability: typeof doc.availability === "string" ? doc.availability : undefined,
    budget: doc.budget && typeof doc.budget === "object" ? doc.budget as Trip["budget"] : undefined,
    days: typeof doc.days === "number" ? doc.days : undefined,
    galleryImages: gallery.map((item) => item && typeof item === "object" ? (item as Record<string, unknown>).image : item),
    location: typeof doc.location === "string" ? doc.location : undefined,
    nights: typeof doc.nights === "number" ? doc.nights : undefined,
    overview: typeof doc.overview === "string" ? doc.overview : undefined,
    priceText: typeof doc.priceText === "string" ? doc.priceText : undefined,
    slug: typeof doc.slug === "string" ? doc.slug : undefined,
    title: typeof doc.title === "string" ? doc.title : undefined,
  };
}

export default async function TripsPage(props: {
  searchParams?: Promise<{ experience?: string; tier?: string }>;
}) {
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "trips" as never,
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: "-updatedAt",
    where: {
      and: [
        { status: { equals: "published" } },
        ...(searchParams?.tier ? [{ packageTier: { equals: searchParams.tier } }] : []),
        ...(searchParams?.experience ? [{ experienceTypes: { contains: searchParams.experience } }] : []),
      ],
    } as never,
  });
  const trips = (result.docs as Array<Record<string, unknown>>).map(normalizeTrip);

  return (
    <main>
      <PageHero title="Safari Tours" />
      <section className="section">
        <div className="container">
          <SectionHeader title="Explore Safari Tours" />
          {trips.length ? (
            <div className="card-grid">
              {trips.map((item) => <TripCard item={item} key={item.slug} />)}
            </div>
          ) : (
            <p>Published trips will appear here once they are added from the portal.</p>
          )}
        </div>
      </section>
    </main>
  );
}
