import type { Metadata } from "next";

import { PackageCard } from "@/components/Cards";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { packages } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Safari Packages",
  description:
    "Browse Kenya safari packages, Tanzania safari packages and combined Kenya Tanzania safari adventures by Nature Romp Safaris.",
  path: "/safari-packages",
  keywords:
    "Kenya Tanzania safari packages, Kenya safari packages, Tanzania safari packages, budget safari, private safari",
});

export default function PackagesPage() {
  return (
    <main>
      <PageHero title="Package Listing" />
      <section className="section">
        <div className="container">
          <SectionHeader title="Our Featured Packages" />
          <div className="card-grid">
            {packages.map((item) => <PackageCard item={item} key={item.slug} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
