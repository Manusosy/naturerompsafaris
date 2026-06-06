import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { getTripDesignationLabel } from "@/lib/trip-labels";
import { getTripPriceParts } from "@/lib/trip-pricing";

import { formatPackageDestinations } from "@/lib/cms-relations";
import { mediaAlt, mediaUrl } from "@/lib/cms-media";

export function getImageUrl(value: unknown): string {
  return mediaUrl(value, "/assets/img/banner1.webp");
}

export function getMediaAlt(value: unknown, fallback: string): string {
  return mediaAlt(value, fallback);
}

export type Destination = {
  name?: string;
  slug?: string;
  country?: string;
  summary?: string;
  heroImage?: unknown;
};

export function DestinationCard({ item }: { item: Destination }) {
  const countryBadge = item.country === "kenya" ? "Kenya" : item.country === "tanzania" ? "Tanzania" : "East Africa";
  const imageSrc = getImageUrl(item.heroImage);
  const imageAlt = getMediaAlt(item.heroImage, item.name || "Safari Destination");

  return (
    <article className="destination-card group h-full flex flex-col justify-between overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-video">
        <Link href={`/destinations/${item.slug}`} className="block h-full w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={420}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        </Link>
        <span className="absolute top-4 right-4 z-10 rounded-full bg-primary/90 px-4 py-1.5 text-sm font-bold text-white tracking-wide shadow-sm backdrop-blur-sm">
          {countryBadge}
        </span>
      </div>
      <div className="flex flex-col flex-grow p-6">
        <h3 className="mb-3 text-2xl font-black text-gray-900 transition-colors duration-300 hover:text-primary">
          <Link href={`/destinations/${item.slug}`}>{item.name}</Link>
        </h3>
        <p className="mb-6 text-base text-gray-600 line-clamp-3 leading-relaxed flex-grow">
          {item.summary || "Explore the unparalleled wild nature, rich culture, and magnificent landscapes of East Africa."}
        </p>
        <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
          <Link
            href={`/destinations/${item.slug}`}
            className="inline-flex items-center text-base font-bold text-primary group-hover:text-primary-dark transition-colors"
          >
            Explore Destination <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">-&gt;</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export type Package = {
  title?: string;
  slug?: string;
  image?: unknown;
  duration?: string;
  excerpt?: string;
  category?: string;
  priceText?: string;
  destinations?: unknown;
  destinationsText?: string;
  discount?: {
    enabled?: boolean;
    label?: string;
    amountText?: string;
  };
};

function limitWords(value: string | undefined, maxWords: number) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function cleanFromPrice(value: string | undefined) {
  return (value || "").replace(/^from\s+/i, "").trim();
}

export function PackageCard({ item }: { item: Package }) {
  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title || "Safari Package");
  const route = formatPackageDestinations(item, "");
  const summary = limitWords(
    item.excerpt || "Join Nature Romp Safaris on an unforgettable classic game viewing and exploration journey.",
    28,
  );
  const price = cleanFromPrice(item.priceText);

  return (
    <article className="tour-card">
      <div className="tour-card__image">
        <Link href={`/safari-packages/${item.slug}`}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={420}
            unoptimized
          />
        </Link>
        <span className="tour-card__duration">
          {item.duration || "Custom duration"}
        </span>
        {item.discount?.enabled && (
          <span className="tour-card__deal">
            {item.discount.label || "Special Deal"}
          </span>
        )}
      </div>
      <div className="tour-card__body">
        <div className="tour-card__meta">
          <span><CalendarDays size={16} /> {item.duration || "Custom duration"}</span>
          <span><MapPin size={16} /> {item.category || "Classic Safari"}</span>
        </div>
        <h3>
          <Link href={`/safari-packages/${item.slug}`}>{item.title}</Link>
        </h3>
        {route ? (
          <p className="tour-card__route">
            <strong>Route:</strong> {route}
          </p>
        ) : null}
        <p>
          {summary}
        </p>
        <div className="tour-card__footer tour-card__footer--listing">
          {price ? (
            <div className="tour-card__price">
              <span>From</span>
              <strong>{price}</strong>
            </div>
          ) : (
            <div className="tour-card__price tour-card__price--request">
              <span>From</span>
              <strong>Custom quote</strong>
            </div>
          )}
          <Link
            href={`/safari-packages/${item.slug}`}
            className="tour-card__button"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export type Trip = {
  title?: string;
  slug?: string;
  location?: string;
  days?: number;
  nights?: number;
  availability?: string;
  packageTier?: string;
  experienceTypes?: string[];
  budget?: {
    displayText?: string;
    currency?: string;
    min?: number;
    max?: number;
    pricingBasis?: string;
  };
  priceText?: string;
  galleryImages?: unknown[];
  heroImage?: unknown;
  overview?: string;
  featured?: boolean;
};

const TRIP_AVAILABILITY_LABELS: Record<string, { label: string; cls: string }> = {
  available: { label: "Available", cls: "avail--available" },
  limited: { label: "Limited", cls: "avail--limited" },
  "on-request": { label: "On Request", cls: "avail--request" },
  unavailable: { label: "Unavailable", cls: "avail--unavailable" },
};

function tripDurationLabel(days?: number, nights?: number) {
  if (!days && !nights) return "Custom duration";
  if (days && nights) return `${days} days / ${nights} nights`;
  if (days) return `${days} days`;
  return `${nights} nights`;
}

function TripCardPrice({ item }: { item: Trip }) {
  const parts = getTripPriceParts({
    currency: item.budget?.currency,
    displayText: item.budget?.displayText,
    max: item.budget?.max,
    min: item.budget?.min,
    priceText: item.priceText,
    pricingBasis: item.budget?.pricingBasis,
  });

  if (parts.kind === "quote") {
    return <span className="acc-card__price-quote">{parts.label}</span>;
  }

  return (
    <>
      <span className="acc-card__price-kicker">From</span>
      <strong className="acc-card__price-amount">{parts.amount}</strong>
      <span className="acc-card__price-basis">{parts.basis}</span>
    </>
  );
}

export function TripCard({ item }: { item: Trip }) {
  const firstGalleryImage =
    Array.isArray(item.galleryImages) && item.galleryImages[0] ? item.galleryImages[0] : null;
  const imageValue = item.heroImage || firstGalleryImage;
  const imageSrc = imageValue ? getImageUrl(imageValue) : "/assets/img/banner1.webp";
  const imageAlt = imageValue
    ? getMediaAlt(imageValue, item.title || "Safari Trip")
    : item.title || "Safari Trip";
  const availability =
    TRIP_AVAILABILITY_LABELS[item.availability || "on-request"] ?? TRIP_AVAILABILITY_LABELS["on-request"];
  const designationLabel = getTripDesignationLabel({
    experienceTypes: item.experienceTypes,
    packageTier: item.packageTier,
  });
  const overview = item.overview ? item.overview.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";

  return (
    <article className="acc-card">
      <Link className="acc-card__img-wrap" href={`/trips/${item.slug}`}>
        <Image
          alt={imageAlt}
          fill
          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 400px"
          src={imageSrc}
          style={{ objectFit: "cover" }}
          unoptimized
        />
        <span className={`acc-card__avail ${availability.cls}`}>{availability.label}</span>
        {designationLabel ? <span className="acc-card__type">{designationLabel}</span> : null}
      </Link>

      <div className="acc-card__body">
        <div className="acc-card__location">
          <MapPin size={12} />
          {[item.location || "East Africa", tripDurationLabel(item.days, item.nights)]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <h2 className="acc-card__name">
          <Link href={`/trips/${item.slug}`}>{item.title}</Link>
        </h2>
        <p className="acc-card__desc">
          {overview
            ? overview.length > 120
              ? `${overview.slice(0, 120)}…`
              : overview
            : "Experience the raw majesty of East African wild reserves, luxury camps, and scenic landscapes."}
        </p>
        <div className="acc-card__footer">
          <div className="acc-card__price acc-card__price--trip">
            <TripCardPrice item={item} />
          </div>
          <Link className="acc-card__explore" href={`/trips/${item.slug}`}>
            <span>View Details</span>
            <ArrowRight aria-hidden className="acc-card__explore-icon" size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export type BlogSummary = {
  category?: { name?: string; title?: string } | string;
  excerpt: string;
  image: unknown;
  publishedAt?: string;
  slug: string;
  title: string;
};

export function BlogCard({ item }: { item: BlogSummary }) {
  const imageSrc = getImageUrl(item.image);
  const imageAlt = getMediaAlt(item.image, item.title || "Safari Guide");
  const category =
    typeof item.category === "string"
      ? item.category
      : (item.category as { name?: string; title?: string } | undefined)?.name
        || (item.category as { title?: string } | undefined)?.title
        || "Safari Guide";
  const date = item.publishedAt
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(item.publishedAt))
    : "";

  return (
    <article className="blog-card">
      <div className="blog-card__image">
        <Link href={`/blog/${item.slug}`}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={420}
            unoptimized
          />
        </Link>
      </div>
      <div className="blog-card__body">
        <span>{category}</span>
        <h3>
          <Link href={`/blog/${item.slug}`}>{item.title}</Link>
        </h3>
        <p>{item.excerpt}</p>
        <div className="blog-card__foot">
          {date ? <small>{date}</small> : <span />}
          <Link href={`/blog/${item.slug}`}>Read More</Link>
        </div>
      </div>
    </article>
  );
}
