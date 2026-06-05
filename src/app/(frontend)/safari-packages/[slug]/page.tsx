import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ChevronRight, Clock, Compass, MapPin } from "lucide-react";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PackageEnhancementsView } from "@/components/PackageEnhancements";
import { formatPackageDestinations } from "@/lib/cms-relations";
import { getPackageEnhancements } from "@/lib/portal-content";
import { site } from "@/content/site";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { getImageUrl, getMediaAlt } from "@/components/Cards";

type Props = { params: Promise<{ slug: string }> };

function routeEndpoints(route: string) {
  const cleaned = route.replace(/\s+/g, " ").trim();
  const explicitParts = cleaned
    .split(/\s+(?:to|towards)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (explicitParts.length >= 2) {
    return {
      start: explicitParts[0],
      end: explicitParts[explicitParts.length - 1],
    };
  }

  const stops = cleaned
    .split(/\s*(?:,|\/|→|->|–|-|\+)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    start: "Nairobi",
    end: stops[stops.length - 1] || cleaned || "East Africa",
  };
}

function stripHtml(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "packages",
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "packages",
    where: { slug: { equals: slug } },
    depth: 1,
    overrideAccess: true,
  });
  const item = result.docs[0];
  if (!item) return {};
  return buildMetadata({
    title: item.title,
    description: item.excerpt,
    path: `/safari-packages/${item.slug}`,
    keywords: `${item.title}, ${item.category}, Kenya Tanzania safari adventure`,
    image: getImageUrl(item.image),
  });
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "packages",
    where: { slug: { equals: slug } },
    depth: 1,
    overrideAccess: true,
  });
  const item = result.docs[0];
  if (!item) notFound();

  const destinationsLabel = formatPackageDestinations(item);

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: item.title,
    description: item.excerpt,
    provider: { "@type": "TravelAgency", name: site.company },
    touristType: ["Family travelers", "Private safari guests", "Wildlife travelers"],
    itinerary: destinationsLabel,
  };

  const enhancements = await getPackageEnhancements(slug);
  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title);
  const route = routeEndpoints(destinationsLabel);
  const overviewText =
    stripHtml(item.content) ||
    item.excerpt ||
    `This ${item.duration || "custom"} safari package is planned around ${destinationsLabel}, with flexible pacing, private guiding and practical support from Nature Romp Safaris.`;

  return (
    <main className="pkg-detail">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Safari Packages", url: "/safari-packages" },
        { name: item.title, url: `/safari-packages/${item.slug}` },
      ])} />

      <section className="pkg-detail__hero">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          className="pkg-detail__hero-image"
          unoptimized
        />
        <div className="pkg-detail__hero-overlay" />
        <div className="container pkg-detail__hero-inner">
          <span className="pkg-detail__category">{item.category || "Safari Package"}</span>
          <h1>{item.title}</h1>
          <div className="pkg-route-card" aria-label="Trip route">
            <div className="pkg-route-card__stop">
              <Compass aria-hidden size={58} />
              <span>Starts in</span>
              <strong>{route.start}</strong>
            </div>
            <span className="pkg-route-card__line" aria-hidden />
            <div className="pkg-route-card__stop">
              <MapPin aria-hidden size={58} />
              <span>Ends in</span>
              <strong>{route.end}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="pkg-detail__breadcrumb-wrap">
        <nav className="container pkg-detail__breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <Link href="/safari-packages">Packages</Link>
          <ChevronRight size={12} />
          <span>{item.title}</span>
        </nav>
      </div>

      <section className="pkg-detail__body">
        <div className="container pkg-detail__layout">
          <div className="pkg-detail__main">
            <section className="pkg-facts" aria-label="Package quick facts">
              <div className="pkg-fact">
                <Clock aria-hidden size={20} />
                <span>Duration</span>
                <strong>{item.duration || "Custom duration"}</strong>
              </div>
              <div className="pkg-fact pkg-fact--wide">
                <MapPin aria-hidden size={20} />
                <span>Route</span>
                <strong>{destinationsLabel}</strong>
              </div>
              <div className="pkg-fact">
                <Compass aria-hidden size={20} />
                <span>Style</span>
                <strong>{item.packageTier || "Private safari"}</strong>
              </div>
            </section>

            <section className="pkg-panel">
              <h2>Safari Overview</h2>
              <div className="pkg-prose">
                <p>{overviewText}</p>
                <p>
                  This route covers <strong>{destinationsLabel}</strong> with a plan that can be tuned for your travel season, comfort level, group size and pace.
                </p>
              </div>

              <div className="pkg-inclusions">
                <h3>Highlights & Inclusions</h3>
                <ul>
                  <li>
                    <CheckCircle2 aria-hidden size={16} />
                    <span>Best For: Wildlife, Photography, Scenic landscapes</span>
                  </li>
                  <li>
                    <CheckCircle2 aria-hidden size={16} />
                    <span>Transport: Custom-built 4x4 open-roof safari landcruiser/jeep</span>
                  </li>
                  <li>
                    <CheckCircle2 aria-hidden size={16} />
                    <span>Pacing: Relaxed & custom-adjusted with expert guides</span>
                  </li>
                  <li>
                    <CheckCircle2 aria-hidden size={16} />
                    <span>Support: Fully vetted team with emergency radio systems</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="pkg-panel pkg-faq">
              <h2>Frequently Asked Questions</h2>
              <div className="pkg-faq__list">
                <article>
                  <h3>
                    <Compass aria-hidden size={16} /> How many days do you need?
                  </h3>
                  <p>
                    This route is designed around {item.duration}, with pacing adjusted for travel season, group style and accommodation preference.
                  </p>
                </article>

                <article>
                  <h3>
                    <Compass aria-hidden size={16} /> Can this be private or family-friendly?
                  </h3>
                  <p>
                    Yes. Nature Romp Safaris can adapt this package for private, family, budget, mid-range or comfort-focused travel. We offer child car seat mounts and custom meal pacing for family safaris.
                  </p>
                </article>

                <article>
                  <h3>
                    <Compass aria-hidden size={16} /> Can it connect with Tanzania?
                  </h3>
                  <p>
                    Kenya routes can be extended into Tanzania for Serengeti, Ngorongoro and broader Kenya Tanzania safari adventure itineraries. Please check our combined package options or request custom adjustments in the booking form.
                  </p>
                </article>
              </div>
            </section>

            <div className="pkg-detail__enhancements">
              <PackageEnhancementsView {...enhancements} />
            </div>
          </div>

          <aside className="pkg-sidebar">
            <div className="pkg-sidebar__summary">
              <span>Package inquiry</span>
              <h2>{item.title}</h2>
              {item.priceText ? <p className="pkg-sidebar__price">{item.priceText}</p> : null}
              <p>
                Share your travel dates, group size and comfort level. We will respond with a specific quote for this safari.
              </p>
            </div>
            <EnquiryForm
              messagePlaceholder={`I am interested in ${item.title}. My preferred travel dates, group size and accommodation level are...`}
              subject={item.title}
              submitLabel="Send Package Inquiry"
              title="Request This Safari"
              variant="package"
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
