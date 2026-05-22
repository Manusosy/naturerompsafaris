import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PackageCard } from "@/components/Cards";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/Sections";
import { packages, seoHubs } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ hub: string }> };

export async function generateStaticParams() {
  return seoHubs.map((hub) => ({ hub: hub.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hub } = await params;
  const page = seoHubs.find((item) => item.slug === hub);
  if (!page) return {};
  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: `/${page.slug}`,
    keywords: page.keywords,
  });
}

export default async function HubPage({ params }: Props) {
  const { hub } = await params;
  const page = seoHubs.find((item) => item.slug === hub);
  if (!page) notFound();

  return (
    <main>
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: page.title, url: `/${page.slug}` },
      ])} />
      <PageHero title={page.title} />
      <section className="content-page">
        <div className="container split">
          <article>
            <SectionHeader title={page.title} />
            <p>{page.intro}</p>
            <p>
              Nature Romp Safaris designs each safari around season, wildlife
              goals, route flow, comfort level and budget. Travelers can start
              in Nairobi or connect into Tanzania depending on the desired
              itinerary.
            </p>
            <div className="faq-grid">
              <article>
                <h3>How much does a Kenya Tanzania safari cost?</h3>
                <p>Cost depends on season, duration, accommodation, park fees, group size and whether the journey is private or shared.</p>
              </article>
              <article>
                <h3>How many days are ideal?</h3>
                <p>Seven to fourteen days is ideal for combined Kenya Tanzania safari adventures, while shorter Kenya-only routes can work in three to six days.</p>
              </article>
              <article>
                <h3>Can Nature Romp Safaris customize this?</h3>
                <p>Yes. The team can adapt routes for families, couples, solo travelers, photography, migration timing and beach extensions.</p>
              </article>
            </div>
          </article>
          <EnquiryForm subject={page.title} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeader title="Suggested Safari Packages" />
          <div className="card-grid">
            {packages.slice(0, 3).map((item) => <PackageCard item={item} key={item.slug} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
