import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

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
  budget?: {
    displayText?: string;
    currency?: string;
    min?: number;
    max?: number;
  };
  priceText?: string;
  galleryImages?: unknown[];
  overview?: string;
  featured?: boolean;
};

export function TripCard({ item }: { item: Trip }) {
  const firstImageValue = Array.isArray(item.galleryImages) && item.galleryImages[0] ? item.galleryImages[0] : null;
  const imageSrc = firstImageValue ? getImageUrl(firstImageValue) : "/assets/img/banner1.webp";
  const imageAlt = firstImageValue ? getMediaAlt(firstImageValue, item.title || "Safari Trip") : item.title || "Safari Trip";

  const budgetText = item.budget?.displayText || item.priceText || (item.budget?.min ? `${item.budget?.currency || "USD"} ${item.budget.min}` : "");

  return (
    <article className="tour-card group h-full flex flex-col justify-between overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-[1.6/1]">
        <Link href={`/trips/${item.slug}`} className="block h-full w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={420}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        </Link>
        <span className="absolute top-4 left-4 z-10 rounded-full bg-black/70 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
          {item.days ? `${item.days} Days` : "Custom"} {item.nights ? `/ ${item.nights} Nights` : ""}
        </span>
        {item.availability && (
          <span className="absolute top-4 right-4 z-10 rounded-full bg-green-600/90 px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm">
            {item.availability === "on-request" ? "On Request" : item.availability}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-grow p-6">
        <span className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">
          {item.location || "East Africa"}
        </span>
        <h3 className="mb-3 text-2xl font-black text-gray-900 transition-colors duration-300 hover:text-primary line-clamp-2">
          <Link href={`/trips/${item.slug}`}>{item.title}</Link>
        </h3>
        <p className="mb-6 text-base text-gray-600 line-clamp-3 leading-relaxed flex-grow">
          {item.overview ? item.overview.replace(/<[^>]*>/g, "") : "Experience the raw majesty of East African wild reserves, luxury camps, and scenic landscapes."}
        </p>
        <div className="pt-5 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div>
            {budgetText ? (
              <div>
                <span className="block text-xs text-gray-400 font-bold uppercase">From</span>
                <span className="text-xl font-black text-primary">{budgetText}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-gray-500">Inquire Price</span>
            )}
          </div>
          <Link
            href={`/trips/${item.slug}`}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-primary-dark shadow-sm hover:shadow"
          >
            Explore Itinerary
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
