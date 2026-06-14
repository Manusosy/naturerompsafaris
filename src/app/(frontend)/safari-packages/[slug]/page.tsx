import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, CircleDollarSign, Clock, Compass, MapPin, Sun } from "lucide-react";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { DetailGallerySlider, type DetailGalleryImage } from "@/components/DetailGallerySlider";
import { JsonLd } from "@/components/JsonLd";
import { PackageEnhancementsView } from "@/components/PackageEnhancements";
import { PackageFaqsSection } from "@/components/PackageFaqsSection";
import { PackageLinkedTrips } from "@/components/PackageLinkedTrips";
import { formatPackageDestinations } from "@/lib/cms-relations";
import { packageTierLabel } from "@/lib/package-labels";
import { createWhatsAppLink } from "@/lib/enquiry";
import { getPublicSiteSettings } from "@/lib/public-site-settings";
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
import { sanitizeHtml } from "@/lib/sanitize-html";
import { getImageUrl, getMediaAlt } from "@/components/Cards";
import { shouldSkipBuildTimePayload } from "@/lib/build-static-params";

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

function formatOverviewBlocks(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  return normalized
    .split(/(?=\bTour Highlights\b)/i)
    .map((block) => block.trim())
    .filter(Boolean);
}

function PackageRouteMini({
  route,
  variant = "hero",
}: {
  route: { start: string; end: string };
  variant?: "hero" | "mobile";
}) {
  return (
    <div
      aria-label={`Route from ${route.start} to ${route.end}`}
      className={`pkg-route-mini${variant === "mobile" ? " pkg-route-mini--mobile" : ""}`}
    >
      <span className="pkg-route-mini__point">
        <Compass aria-hidden size={16} strokeWidth={2.2} />
        <span>{route.start}</span>
      </span>
      <span aria-hidden className="pkg-route-mini__divider" />
      <span className="pkg-route-mini__point">
        <MapPin aria-hidden size={16} strokeWidth={2.2} />
        <span>{route.end}</span>
      </span>
    </div>
  );
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
  if (shouldSkipBuildTimePayload()) return [];

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
  const bestTime = typeof item.bestTime === "string" ? item.bestTime.trim() : "";
  const styleLabel = item.packageTier
    ? packageTierLabel(String(item.packageTier))
    : "Private safari";

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

  const enhancements = await getPackageEnhancements(slug);
  const siteSettings = await getPublicSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.canonicalUrl;
  const packagePageUrl = `${siteUrl}/safari-packages/${item.slug}`;
  const packageSummaryParts = [
    displayDuration ? `${displayDuration} safari` : "Safari package",
    destinationsLabel ? `to ${destinationsLabel}` : "",
    styleLabel ? `${styleLabel} style` : "",
    displayPrice ? `from ${displayPrice}` : "",
  ].filter(Boolean);
  const packageSummary = packageSummaryParts.join(" · ");
  const whatsappHref = createWhatsAppLink({
    message: `Hi Nature Romp Safaris, I would like help planning "${item.title}". ${packageSummary}. ${packagePageUrl}`,
    phone: siteSettings.whatsapp || site.whatsapp,
  });
  const factCount = 3 + (bestTime ? 1 : 0) + (displayPrice ? 1 : 0);

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

  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title);
  const galleryImages = collectPackageGalleryImages(
    item as Record<string, unknown>,
    item.title,
  );
  const sanitizedContent = item.content ? sanitizeHtml(item.content) : "";
  const overviewText =
    stripHtml(item.content) ||
    item.excerpt ||
    (primaryTrip?.overview
      ? stripHtml(primaryTrip.overview)
      : `This ${displayDuration || "custom"} safari package covers ${destinationsLabel} with private guiding and support from Nature Romp Safaris.`);
  const overviewBlocks = formatOverviewBlocks(overviewText);

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
          <PackageRouteMini route={route} variant="mobile" />
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
          <PackageRouteMini route={route} />
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
        <div className="container pkg-detail__summary">
          <dl
            aria-label="Package quick facts"
            className="pkg-facts pkg-facts--linear"
            style={{ "--pkg-fact-cols": factCount } as CSSProperties}
          >
            <div className="pkg-fact-line">
              <Clock aria-hidden className="pkg-fact-line__icon" size={20} />
              <dt>Duration</dt>
              <dd>{displayDuration || "Custom duration"}</dd>
            </div>
            <div className="pkg-fact-line">
              <MapPin aria-hidden className="pkg-fact-line__icon" size={20} />
              <dt>Destinations</dt>
              <dd>{destinationsLabel}</dd>
            </div>
            <div className="pkg-fact-line">
              <Compass aria-hidden className="pkg-fact-line__icon" size={20} />
              <dt>Style</dt>
              <dd>{styleLabel}</dd>
            </div>
            {bestTime ? (
              <div className="pkg-fact-line">
                <Sun aria-hidden className="pkg-fact-line__icon" size={20} />
                <dt>Best time</dt>
                <dd>{bestTime}</dd>
              </div>
            ) : null}
            {displayPrice ? (
              <div className="pkg-fact-line pkg-fact-line--price">
                <CircleDollarSign aria-hidden className="pkg-fact-line__icon" size={20} />
                <dt>From</dt>
                <dd>{displayPrice}</dd>
              </div>
            ) : null}
          </dl>

          <div className="pkg-detail__intro">
            {sanitizedContent ? (
              <div
                className="pkg-detail__lede blog-article-prose"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                style={{ textAlign: "left", width: "100%", maxWidth: "100%" }}
              />
            ) : (
              <div className="pkg-detail__lede">
                {overviewBlocks.map((block, index) => (
                  <p key={index}>{block}</p>
                ))}
              </div>
            )}
            <p className="pkg-detail__note">
              {linkedTrips.length
                ? "This page is the package overview. Open any tour below for the full day-by-day itinerary, seasonal pricing, inclusions, exclusions and enquiries."
                : "Published tours for this package will appear here once linked from the dashboard."}
            </p>
          </div>
        </div>

        <PackageLinkedTrips packageTitle={item.title} trips={linkedTrips} />

        <PackageFaqsSection faqs={faqs} packageSummary={packageSummary} whatsappHref={whatsappHref} />

        <div className="container pkg-detail__extras">
          <PackageEnhancementsView {...enhancements} />
        </div>
      </section>
    </main>
  );
}
