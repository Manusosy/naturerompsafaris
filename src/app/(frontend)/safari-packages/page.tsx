import type { Metadata } from "next";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { PackageCard, type Package } from "@/components/Cards";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { packages as staticPackages } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Safari Packages",
  description:
    "Browse Kenya safari packages, Tanzania safari packages and combined Kenya Tanzania safari adventures by Nature Romp Safaris.",
  path: "/safari-packages",
  keywords:
    "Kenya Tanzania safari packages, Kenya safari packages, Tanzania safari packages, budget safari, private safari",
});

export default async function PackagesPage(props: {
  searchParams?: Promise<{ category?: string; experience?: string; group?: string; tier?: string }>;
}) {
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });
  const category = searchParams?.category;
  const group = searchParams?.group;
  const tier = searchParams?.tier;

  const result = await payload.find({
    collection: "packages",
    where: { 
      and: [
        { status: { equals: "published" } },
        ...(category ? [{ category: { equals: category } }] : []),
        ...(group ? [{ packageGroup: { equals: group } }] : []),
        ...(tier ? [{ packageTier: { equals: tier } }] : []),
      ] 
    },
    limit: 100,
    depth: 1,
    overrideAccess: true,
  });

  const packages = result.docs as unknown as Package[];

  return (
    <main>
      <PageHero title="Package Listing" />
      <section className="section">
        <div className="container">
          <SectionHeader title={category || group || tier ? "Filtered Packages" : "Our Safari Packages"} />
          <div className="card-grid">
            {packages.map((item) => <PackageCard item={item} key={item.slug} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
