import configPromise from "@payload-config";
import type { Metadata } from "next";
import { getPayload } from "payload";

import { DestinationCard } from "@/components/Cards";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Safari Destinations",
  description:
    "Explore our top Kenya and Tanzania safari destinations. Discover the Masai Mara, Serengeti, Amboseli, and more.",
  path: "/destinations",
  keywords: "Kenya destinations, Tanzania destinations, safari destinations, East Africa parks",
});

function mediaUrl(value: unknown) {
  if (value && typeof value === "object" && "url" in value) {
    return String((value as { url?: unknown }).url ?? "");
  }
  return "";
}

type DestinationListDoc = {
  country?: string;
  heroImage?: unknown;
  name?: string;
  slug?: string;
  summary?: string;
};

async function getPublishedDestinations() {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "destinations" as never,
      limit: 100,
      overrideAccess: true,
      where: {
        status: { equals: "published" },
      } as never,
      sort: "name",
    });
    
    return (result.docs as DestinationListDoc[]).map((doc) => ({
      name: doc.name,
      slug: doc.slug,
      country: doc.country,
      summary: doc.summary,
      heroImage: mediaUrl(doc.heroImage),
    }));
  } catch {
    return [];
  }
}

export default async function DestinationsPage() {
  const destinations = await getPublishedDestinations();

  return (
    <main>
      <PageHero title="Explore Our Destinations" />
      <section className="section">
        <div className="container">
          <SectionHeader title="Kenya & Tanzania Safari Destinations" />
          <div className="card-grid">
            {destinations.map((item) => (
              <DestinationCard item={item} key={item.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
