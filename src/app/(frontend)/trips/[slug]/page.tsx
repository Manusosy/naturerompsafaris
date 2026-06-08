import configPromise from "@payload-config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { JsonLd } from "@/components/JsonLd";
import { TripDetailExperience, type TripDetailData } from "@/components/TripDetailExperience";
import { site } from "@/content/site";
import { normalizeMediaUrl } from "@/lib/cms-media";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { formatTripPrice } from "@/lib/trip-pricing";

type Props = { params: Promise<{ slug: string }> };

function mediaUrl(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return typeof record.url === "string" ? normalizeMediaUrl(record.url) : "";
  }
  return "";
}

function mediaImage(value: unknown, fallbackAlt: string) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const src = mediaUrl(record);
  if (!src) return undefined;
  return {
    alt: String(record.alt || record.filename || fallbackAlt),
    caption: typeof record.caption === "string" ? record.caption : "",
    src,
  };
}

function relationName(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.title ?? "");
  }
  return "";
}

function relationSlug(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return typeof record.slug === "string" ? record.slug : "";
  }
  return "";
}

function arrayItems(value: unknown, key = "item") {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return String((item as Record<string, unknown>)[key] ?? "");
    return "";
  }).filter(Boolean);
}

async function getTrip(slug: string) {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "trips" as never,
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: {
        slug: { equals: slug },
        status: { equals: "published" },
      } as never,
    });
    return (result.docs[0] ?? null) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

async function getReviewSettings() {
  try {
    const payload = await getPayload({ config: configPromise });
    const settings = await payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      slug: "site-settings" as never,
    });
    return settings as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeTrip(doc: Record<string, unknown>, reviewSettings: Record<string, unknown>): TripDetailData {
  const budget = doc.budget && typeof doc.budget === "object" ? doc.budget as Record<string, unknown> : {};
  const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  const destinations = Array.isArray(doc.destinations) ? doc.destinations.map(relationName).filter(Boolean) : [];
  const itinerary = doc.itinerary && typeof doc.itinerary === "object" ? doc.itinerary as Record<string, unknown> : {};
  const rawItineraryDays = Array.isArray(doc.itineraryDays)
    ? doc.itineraryDays
    : Array.isArray(itinerary.days)
      ? itinerary.days
      : [];
  const itineraryDays = rawItineraryDays.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      accommodation: typeof record.accommodation === "string" ? record.accommodation : undefined,
      activities: typeof record.activities === "string" ? record.activities : undefined,
      day: typeof record.day === "number" ? record.day : index + 1,
      description: typeof record.description === "string" ? record.description : undefined,
      experienceNotes: typeof record.experienceNotes === "string" ? record.experienceNotes : undefined,
      image: mediaUrl(record.image),
      location: typeof record.location === "string" ? record.location : undefined,
      meals: typeof record.meals === "string" ? record.meals : undefined,
      title: typeof record.title === "string" ? record.title : undefined,
    };
  });
  const budgetText = formatTripPrice({
    currency: typeof budget.currency === "string" ? budget.currency : "USD",
    displayText: typeof budget.displayText === "string" ? budget.displayText : undefined,
    max: typeof budget.max === "number" ? budget.max : undefined,
    min: typeof budget.min === "number" ? budget.min : undefined,
    priceText: typeof doc.priceText === "string" ? doc.priceText : undefined,
    pricingBasis: typeof budget.pricingBasis === "string" ? budget.pricingBasis : undefined,
  });
  const destinationStops = Array.isArray(doc.destinationStops) && doc.destinationStops.length
    ? doc.destinationStops.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        alt: String(record.alt || record.title || doc.title || "Safari destination"),
        description: typeof record.description === "string" ? record.description : "",
        image: mediaUrl(record.image),
        slug: relationSlug(record.destination),
        title: String(record.title || relationName(record.destination) || "Safari destination"),
      };
    })
    : (Array.isArray(doc.destinations) ? doc.destinations.map((destination) => ({
      description: "",
      slug: relationSlug(destination),
      title: relationName(destination),
    })).filter((item) => item.title) : []);
  const heroImage = mediaImage(doc.heroImage, String(doc.title || "Nature Romp Safaris trip"));

  return {
    availability: String(doc.availability ?? "on-request"),
    budgetText,
    days: typeof doc.days === "number" ? doc.days : undefined,
    destinationStops,
    accommodationOptions: Array.isArray(doc.accommodationOptions)
      ? (doc.accommodationOptions as Array<Record<string, unknown>>).map((item) => ({
          name: typeof item.name === "string" ? item.name : undefined,
          note: typeof item.note === "string" ? item.note : undefined,
        })).filter((item) => item.name)
      : [],
    accommodationSummary: typeof doc.accommodationSummary === "string" ? doc.accommodationSummary : undefined,
    bestFor: arrayItems(doc.bestFor),
    bestTimeToVisit: typeof doc.bestTimeToVisit === "string" ? doc.bestTimeToVisit : undefined,
    departurePoint: typeof doc.departurePoint === "string" ? doc.departurePoint : undefined,
    directAnswers: Array.isArray(doc.directAnswers) ? doc.directAnswers as TripDetailData["directAnswers"] : [],
    endLocation: typeof doc.endLocation === "string" ? doc.endLocation : undefined,
    faqs: Array.isArray(doc.faqs)
      ? (doc.faqs as Array<Record<string, unknown>>)
        .map((item) => ({
          answer: typeof item.answer === "string" ? item.answer : undefined,
          question: typeof item.question === "string" ? item.question : undefined,
        }))
        .filter((item) => item.question && item.answer)
      : [],
    excluded: arrayItems(doc.excluded),
    gallery: gallery.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const src = mediaUrl(record.image);
      return {
        alt: String(record.alt || doc.title || "Nature Romp Safaris trip"),
        caption: typeof record.caption === "string" ? record.caption : "",
        src: src || "/assets/img/banner1.webp",
      };
    }),
    heroEyebrow: typeof doc.heroEyebrow === "string" ? doc.heroEyebrow : undefined,
    heroImage,
    heroSubtitle: typeof doc.heroSubtitle === "string" ? doc.heroSubtitle : undefined,
    highlights: Array.isArray(doc.highlights) ? doc.highlights.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        alt: String(record.alt || record.title || doc.title || "Safari highlight"),
        description: typeof record.description === "string" ? record.description : "",
        image: mediaUrl(record.image),
        title: String(record.title || ""),
      };
    }).filter((item) => item.title) : [],
    id: String(doc.id ?? ""),
    included: arrayItems(doc.included),
    itineraryDays,
    location: String(doc.location || destinations.join(", ") || "Kenya and Tanzania"),
    mapEmbedUrl: typeof doc.mapEmbedUrl === "string" ? doc.mapEmbedUrl : undefined,
    nights: typeof doc.nights === "number" ? doc.nights : undefined,
    optionalExperiences: Array.isArray(doc.optionalExperiences)
      ? (doc.optionalExperiences as Array<Record<string, unknown>>).map((item) => ({
          description: typeof item.description === "string" ? item.description : undefined,
          priceNote: typeof item.priceNote === "string" ? item.priceNote : undefined,
          title: typeof item.title === "string" ? item.title : undefined,
        })).filter((item) => item.title)
      : [],
    overview: typeof doc.overview === "string" ? doc.overview : undefined,
    packageTier: typeof doc.packageTier === "string" ? doc.packageTier : undefined,
    positiveImpact: typeof doc.positiveImpact === "string" ? doc.positiveImpact : undefined,
    priceSeasons: Array.isArray(doc.priceSeasons)
      ? (doc.priceSeasons as Array<Record<string, unknown>>).map((item) => ({
          budgetText: typeof item.budgetText === "string" ? item.budgetText : undefined,
          ctaLabel: typeof item.ctaLabel === "string" ? item.ctaLabel : undefined,
          currency: typeof item.currency === "string" ? item.currency : undefined,
          dateRange: typeof item.dateRange === "string" ? item.dateRange : undefined,
          displayText: typeof item.displayText === "string" ? item.displayText : undefined,
          max: typeof item.max === "number" ? item.max : undefined,
          min: typeof item.min === "number" ? item.min : undefined,
          notes: typeof item.notes === "string" ? item.notes : undefined,
          packageLabel: typeof item.packageLabel === "string" ? item.packageLabel : undefined,
          partySizeLabel: typeof item.partySizeLabel === "string" ? item.partySizeLabel : undefined,
          seasonLabel: typeof item.seasonLabel === "string" ? item.seasonLabel : undefined,
          tier: typeof item.tier === "string" ? item.tier : undefined,
          title: typeof item.title === "string" ? item.title : undefined,
        }))
      : [],
    quoteIntro: typeof doc.quoteIntro === "string" ? doc.quoteIntro : undefined,
    relatedTrips: Array.isArray(doc.relatedTrips) ? doc.relatedTrips.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const relatedBudget = record.budget && typeof record.budget === "object" ? record.budget as Record<string, unknown> : {};
      const relatedGallery = Array.isArray(record.gallery) ? record.gallery : [];
      const firstImage = relatedGallery[0] && typeof relatedGallery[0] === "object"
        ? mediaUrl((relatedGallery[0] as Record<string, unknown>).image)
        : "";
      return {
        budgetText: formatTripPrice({
          currency: typeof relatedBudget.currency === "string" ? relatedBudget.currency : "USD",
          displayText: typeof relatedBudget.displayText === "string" ? relatedBudget.displayText : undefined,
          max: typeof relatedBudget.max === "number" ? relatedBudget.max : undefined,
          min: typeof relatedBudget.min === "number" ? relatedBudget.min : undefined,
          priceText: typeof record.priceText === "string" ? record.priceText : undefined,
          pricingBasis: typeof relatedBudget.pricingBasis === "string" ? relatedBudget.pricingBasis : undefined,
        }),
        image: firstImage,
        slug: String(record.slug || ""),
        title: String(record.title || ""),
      };
    }).filter((item) => item.slug && item.title) : [],
    reviewSettings: {
      bookingSecurityHeading: typeof reviewSettings.bookingSecurityHeading === "string" ? reviewSettings.bookingSecurityHeading : undefined,
      bookingSecurityItems: arrayItems(reviewSettings.bookingSecurityItems),
      bookingSecurityText: typeof reviewSettings.bookingSecurityText === "string" ? reviewSettings.bookingSecurityText : undefined,
      heading: String(reviewSettings.reviewHeading || "We Are Highly Recommended"),
      partnerLogos: Array.isArray(reviewSettings.partnerLogos) ? reviewSettings.partnerLogos.map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        const image = mediaImage(record.image, String(record.alt || "Booking partner"));
        return image ? { ...image, alt: String(record.alt || image.alt) } : null;
      }).filter(Boolean) as NonNullable<TripDetailData["reviewSettings"]>["partnerLogos"] : [],
      trustindexEmbed: typeof reviewSettings.trustindexEmbed === "string" ? reviewSettings.trustindexEmbed : "",
    },
    routeLabel: typeof doc.routeLabel === "string" ? doc.routeLabel : undefined,
    routeWaypoints: Array.isArray(doc.routeWaypoints) ? doc.routeWaypoints as TripDetailData["routeWaypoints"] : [],
    slug: String(doc.slug ?? ""),
    startLocation: typeof doc.startLocation === "string" ? doc.startLocation : undefined,
    title: String(doc.title ?? "Safari Trip"),
    trustindexEmbedOverride: typeof doc.trustindexEmbedOverride === "string" ? doc.trustindexEmbedOverride : undefined,
    whyBook: arrayItems(doc.whyBook),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const trip = await getTrip(slug);
    if (!trip) return {};
    const seo = trip.seo && typeof trip.seo === "object" ? trip.seo as Record<string, unknown> : {};
    return buildMetadata({
      title: String(seo.title || trip.title || "Safari Trip"),
      description: String(seo.description || trip.overview || "Plan this Kenya Tanzania safari adventure with Nature Romp Safaris."),
      keywords: String(seo.keywords || "Kenya Tanzania safari adventure, safari trip, Nature Romp Safaris"),
      path: `/trips/${trip.slug}`,
      image: mediaUrl(seo.openGraphImage) || "/assets/img/banner1.webp",
    });
  } catch {
    return {};
  }
}

export default async function TripPage({ params }: Props) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) notFound();
  const reviewSettings = await getReviewSettings();
  const normalizedTrip = normalizeTrip(trip, reviewSettings);

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: normalizedTrip.title,
    description: normalizedTrip.overview,
    provider: { "@type": "TravelAgency", name: site.company, url: site.canonicalUrl },
    touristType: ["Private safari guests", "Family travelers", "Wildlife travelers"],
    itinerary: normalizedTrip.location,
  };

  return (
    <main>
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Trips", url: "/safari-packages" },
        { name: normalizedTrip.title, url: `/trips/${normalizedTrip.slug}` },
      ])} />
      <TripDetailExperience trip={normalizedTrip} />
    </main>
  );
}
