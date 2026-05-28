import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PackageEnhancementsView } from "@/components/PackageEnhancements";
import { getPackageEnhancements } from "@/lib/portal-content";
import { PageHero } from "@/components/PageHero";
import { packages, site } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return packages.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = packages.find((pkg) => pkg.slug === slug);
  if (!item) return {};
  return buildMetadata({
    title: item.title,
    description: item.excerpt,
    path: `/safari-packages/${item.slug}`,
    keywords: `${item.title}, ${item.category}, Kenya Tanzania safari adventure`,
    image: item.image,
  });
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = packages.find((pkg) => pkg.slug === slug);
  if (!item) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: item.title,
    description: item.excerpt,
    provider: { "@type": "TravelAgency", name: site.company },
    touristType: ["Family travelers", "Private safari guests", "Wildlife travelers"],
    itinerary: item.destinations,
  };

  const enhancements = await getPackageEnhancements(slug);

  return (
    <main>
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Safari Packages", url: "/safari-packages" },
        { name: item.title, url: `/safari-packages/${item.slug}` },
      ])} />
      <PageHero title={item.title} />
      <section className="content-page">
        <div className="container split">
          <div>
            <Image src={item.image} alt={item.title} width={800} height={540} />
            <h2>{item.title}</h2>
            <p>{item.excerpt}</p>
            <ul className="info-list">
              <li><strong>Duration:</strong> {item.duration}</li>
              <li><strong>Destinations:</strong> {item.destinations}</li>
              <li><strong>Safari Type:</strong> {item.category}</li>
              <li><strong>Best For:</strong> Wildlife, photography, family travel and private East Africa safari planning.</li>
            </ul>
            <h2>Direct Answers</h2>
            <div className="faq-grid">
              <article>
                <h3>How many days do you need?</h3>
                <p>This route is designed around {item.duration}, with pacing adjusted for travel season, group style and accommodation preference.</p>
              </article>
              <article>
                <h3>Can this be private or family-friendly?</h3>
                <p>Yes. Nature Romp Safaris can adapt this package for private, family, budget, mid-range or comfort-focused travel.</p>
              </article>
              <article>
                <h3>Can it connect with Tanzania?</h3>
                <p>Kenya routes can be extended into Tanzania for Serengeti, Ngorongoro and broader Kenya Tanzania safari adventure itineraries.</p>
              </article>
            </div>
            <PackageEnhancementsView {...enhancements} />
          </div>
          <EnquiryForm subject={item.title} />
        </div>
      </section>
    </main>
  );
}
