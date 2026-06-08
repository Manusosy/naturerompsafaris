import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ChevronRight, Clock, Compass, MapPin } from "lucide-react";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { DetailGallerySlider, type DetailGalleryImage } from "@/components/DetailGallerySlider";
import { EnquiryForm } from "@/components/EnquiryForm";
import { JsonLd } from "@/components/JsonLd";
import { PackageEnhancementsView } from "@/components/PackageEnhancements";
import { PackageLinkedTrips } from "@/components/PackageLinkedTrips";
import { formatPackageDestinations } from "@/lib/cms-relations";
import {
  fetchLinkedTripsForPackage,
  packageRouteFromTrips,
  primaryLinkedTrip,
  resolvePackageDuration,
  resolvePackagePriceText,
} from "@/lib/package-trips";
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

function collectPackageGalleryImages(
  item: Record<string, unknown>,
  title: string,
): DetailGalleryImage[] {
  const images: DetailGalleryImage[] = [];
  const seen = new Set<string>();

  const addImage = (src: string | undefined, alt: string) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    images.push({ alt, src });
  };

  addImage(getImageUrl(item.image), getMediaAlt(item.image, title));

  const seo = item.seo && typeof item.seo === "object" ? (item.seo as Record<string, unknown>) : null;
  addImage(getImageUrl(seo?.openGraphImage), getMediaAlt(seo?.openGraphImage, title));

  const accommodations = Array.isArray(item.accommodations) ? item.accommodations : [];
  for (const accommodation of accommodations) {
    if (!accommodation || typeof accommodation !== "object") continue;
    const record = accommodation as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "Safari accommodation";
    const photos = Array.isArray(record.photos) ? record.photos : [];
    for (const photo of photos) {
      addImage(getImageUrl(photo), getMediaAlt(photo, name));
    }
  }

  return images;
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
    depth: 2,
    overrideAccess: true,
  });
  const item = result.docs[0];
  if (!item) notFound();

  const linkedTrips = await fetchLinkedTripsForPackage(payload, item.id);
  const catalogFields = {
    bestTime: typeof item.bestTime === "string" ? item.bestTime : undefined,
    duration: typeof item.duration === "string" ? item.duration : undefined,
    priceText: typeof item.priceText === "string" ? item.priceText : undefined,
  };
  const primaryTrip = primaryLinkedTrip(linkedTrips);
  const displayDuration = resolvePackageDuration(catalogFields, linkedTrips);
  const displayPrice = resolvePackagePriceText(catalogFields, linkedTrips);
  const destinationsLabel = formatPackageDestinations(item);
  const tripRoute = packageRouteFromTrips(linkedTrips);
  const route = tripRoute ?? routeEndpoints(destinationsLabel);

  const packageFaqs = Array.isArray(item.faqs)
    ? (item.faqs as Array<Record<string, unknown>>)
        .map((entry) => ({
          answer: typeof entry.answer === "string" ? entry.answer.trim() : "",
          question: typeof entry.question === "string" ? entry.question.trim() : "",
        }))
        .filter((entry) => entry.question && entry.answer)
    : [];
  const tripFaqs = primaryTrip?.faqs ?? [];
  const faqs = packageFaqs.length ? packageFaqs : tripFaqs;

  const inclusions = primaryTrip?.included?.length
    ? primaryTrip.included
    : [
        "Private 4x4 safari vehicle with pop-up roof",
        "Expert driver-guide and park fees guidance",
        "Flexible pacing tailored to your group",
        "Direct support from Nature Romp Safaris",
      ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventures.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: item.title,
    description: item.excerpt,
    provider: { "@type": "TravelAgency", name: site.company },
    touristType: ["Family travelers", "Private safari guests", "Wildlife travelers"],
    itinerary: destinationsLabel,
    ...(displayDuration ? { duration: displayDuration } : {}),
    ...(linkedTrips.length
      ? {
          hasPart: linkedTrips.map((trip) => ({
            "@type": "TouristTrip",
            name: trip.title,
            url: `${siteUrl}/trips/${trip.slug}`,
          })),
        }
      : {}),
  };

  const enhancements = await getPackageEnhancements(slug);
  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title);
  const galleryImages = collectPackageGalleryImages(
    item as Record<string, unknown>,
    item.title,
  );
  const overviewText =
    stripHtml(item.content) ||
    item.excerpt ||
    (primaryTrip?.overview
      ? stripHtml(primaryTrip.overview)
      : `This ${displayDuration || "custom"} safari package is planned around ${destinationsLabel}, with flexible pacing, private guiding and practical support from Nature Romp Safaris.`);

  return (
    <main className="pkg-detail">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Safari Packages", url: "/safari-packages" },
        { name: item.title, url: `/safari-packages/${item.slug}` },
      ])} />

      <section className="pkg-detail__mobile-gallery" aria-label="Package image gallery">
        <DetailGallerySlider images={galleryImages} />
      </section>

      <section className="pkg-detail__mobile-head">
        <div className="container">
          <span className="pkg-detail__category">{item.category || "Safari Package"}</span>
          <h1>{item.title}</h1>
          <div className="pkg-route-card pkg-route-card--compact" aria-label="Trip route">
            <div className="pkg-route-card__stop">
              <Compass aria-hidden size={40} />
              <span>Starts in</span>
              <strong>{route.start}</strong>
            </div>
            <span className="pkg-route-card__line" aria-hidden />
            <div className="pkg-route-card__stop">
              <MapPin aria-hidden size={40} />
              <span>Ends in</span>
              <strong>{route.end}</strong>
            </div>
          </div>
        </div>
      </section>

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
                <strong>{displayDuration || "Custom duration"}</strong>
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
                <h3>{primaryTrip?.included?.length ? "What's included" : "Highlights & Inclusions"}</h3>
                <ul>
                  {inclusions.map((entry) => (
                    <li key={entry}>
                      <CheckCircle2 aria-hidden size={16} />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <PackageLinkedTrips packageTitle={item.title} trips={linkedTrips} />

            {faqs.length ? (
              <section className="pkg-panel pkg-faq">
                <h2>Frequently Asked Questions</h2>
                <div className="pkg-faq__list">
                  {faqs.map((entry) => (
                    <article key={entry.question}>
                      <h3>
                        <Compass aria-hidden size={16} /> {entry.question}
                      </h3>
                      <p>{entry.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="pkg-detail__enhancements">
              <PackageEnhancementsView {...enhancements} />
            </div>
          </div>

          <aside className="pkg-sidebar">
            <div className="pkg-sidebar__summary">
              <span>Package inquiry</span>
              <h2>{item.title}</h2>
              {displayPrice ? <p className="pkg-sidebar__price">{displayPrice}</p> : null}
              <p>
                {linkedTrips.length
                  ? "Choose a linked tour above for full pricing tables, or send your dates here for a tailored quote."
                  : "Share your travel dates, group size and comfort level. We will respond with a specific quote for this safari."}
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
