import type { Payload } from "payload";

import type { Trip } from "@/components/Cards";
import { mergeExperienceTypes } from "@/lib/trip-labels";
import { formatTripPrice, type TripPricingBasis } from "@/lib/trip-pricing";
import {
  budgetRangeFromPackages,
  priceSeasonsToPackages,
  type PriceSeasonRow,
} from "@/lib/trip-pricing-table";

export type LinkedTripSummary = Trip & {
  routeLabel?: string;
  startLocation?: string;
  endLocation?: string;
  included?: string[];
  faqs?: Array<{ question: string; answer: string }>;
};

export type PackageCatalogFields = {
  duration?: string | null;
  priceText?: string | null;
  bestTime?: string | null;
};

function relationId(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function arrayItems(value: unknown, key = "item") {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object" && key in entry) {
        return String((entry as Record<string, unknown>)[key] ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function parsePriceSeasons(doc: Record<string, unknown>): PriceSeasonRow[] {
  if (!Array.isArray(doc.priceSeasons)) return [];
  return (doc.priceSeasons as Array<Record<string, unknown>>).map((item) => ({
    budgetText: typeof item.budgetText === "string" ? item.budgetText : undefined,
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
  }));
}

function tripBudgetFromDoc(doc: Record<string, unknown>): Trip["budget"] | undefined {
  const budget =
    doc.budget && typeof doc.budget === "object"
      ? (doc.budget as Record<string, unknown>)
      : null;

  if (budget && typeof budget.min === "number" && !Number.isNaN(budget.min)) {
    return {
      currency: typeof budget.currency === "string" ? budget.currency : "USD",
      displayText: typeof budget.displayText === "string" ? budget.displayText : undefined,
      max: typeof budget.max === "number" ? budget.max : undefined,
      min: budget.min,
      pricingBasis: typeof budget.pricingBasis === "string" ? budget.pricingBasis : "per-person",
    };
  }

  const seasons = parsePriceSeasons(doc);
  if (!seasons.length) return undefined;

  const pricingPackages = priceSeasonsToPackages(seasons);
  const range = budgetRangeFromPackages(pricingPackages);
  if (range.min == null) return undefined;

  const pricingBasis =
    (typeof budget?.pricingBasis === "string" ? budget.pricingBasis : "per-person") as TripPricingBasis;

  return {
    currency: "USD",
    max: range.max,
    min: range.min,
    pricingBasis,
    displayText: formatTripPrice({
      currency: "USD",
      max: range.max,
      min: range.min,
      pricingBasis,
    }),
  };
}

function tripDurationLabel(days?: number, nights?: number) {
  if (days && nights) return `${days} Days / ${nights} Nights`;
  if (days) return `${days} Days`;
  if (nights) return `${nights} Nights`;
  return "";
}

export function normalizeLinkedTripSummary(doc: Record<string, unknown>): LinkedTripSummary {
  const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  const budget = tripBudgetFromDoc(doc);

  return {
    availability: typeof doc.availability === "string" ? doc.availability : undefined,
    budget,
    cardSummary: typeof doc.cardSummary === "string" ? doc.cardSummary : undefined,
    days: typeof doc.days === "number" ? doc.days : undefined,
    endLocation: typeof doc.endLocation === "string" ? doc.endLocation : undefined,
    experienceTypes: mergeExperienceTypes(doc.experienceTypes, doc.customExperienceTypes),
    faqs: Array.isArray(doc.faqs)
      ? (doc.faqs as Array<Record<string, unknown>>)
          .map((item) => ({
            answer: typeof item.answer === "string" ? item.answer : "",
            question: typeof item.question === "string" ? item.question : "",
          }))
          .filter((item) => item.question && item.answer)
      : [],
    galleryImages: gallery.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>).image : item,
    ),
    heroImage: doc.heroImage,
    included: arrayItems(doc.included),
    location: typeof doc.location === "string" ? doc.location : undefined,
    nights: typeof doc.nights === "number" ? doc.nights : undefined,
    overview: typeof doc.overview === "string" ? doc.overview : undefined,
    packageTier: typeof doc.packageTier === "string" ? doc.packageTier : undefined,
    priceText: typeof doc.priceText === "string" ? doc.priceText : undefined,
    routeLabel: typeof doc.routeLabel === "string" ? doc.routeLabel : undefined,
    slug: typeof doc.slug === "string" ? doc.slug : undefined,
    startLocation: typeof doc.startLocation === "string" ? doc.startLocation : undefined,
    title: typeof doc.title === "string" ? doc.title : undefined,
  };
}

export async function fetchLinkedTripsForPackage(
  payload: Payload,
  packageId: string | number,
): Promise<LinkedTripSummary[]> {
  const result = await payload.find({
    collection: "trips" as never,
    depth: 1,
    limit: 24,
    overrideAccess: true,
    sort: "days",
    where: {
      and: [
        { status: { equals: "published" } },
        { package: { equals: packageId } },
      ],
    } as never,
  });

  return (result.docs as Array<Record<string, unknown>>).map(normalizeLinkedTripSummary);
}

export async function fetchLinkedTripsByPackageIds(
  payload: Payload,
  packageIds: Array<string | number>,
): Promise<Map<string, LinkedTripSummary[]>> {
  const uniqueIds = [...new Set(packageIds.map(String))].filter(Boolean);
  const grouped = new Map<string, LinkedTripSummary[]>();
  if (!uniqueIds.length) return grouped;

  const result = await payload.find({
    collection: "trips" as never,
    depth: 1,
    limit: Math.max(uniqueIds.length * 8, 48),
    overrideAccess: true,
    sort: "days",
    where: {
      and: [
        { status: { equals: "published" } },
        { package: { in: uniqueIds } },
      ],
    } as never,
  });

  for (const doc of result.docs as Array<Record<string, unknown>>) {
    const pkg = doc.package;
    const packageId = relationId(pkg);
    if (!packageId) continue;
    const bucket = grouped.get(packageId) ?? [];
    bucket.push(normalizeLinkedTripSummary(doc));
    grouped.set(packageId, bucket);
  }

  return grouped;
}

function lowestTripBudgetMin(trips: LinkedTripSummary[]) {
  let lowest: LinkedTripSummary | undefined;
  let lowestMin = Number.POSITIVE_INFINITY;

  for (const trip of trips) {
    const min = trip.budget?.min;
    if (typeof min !== "number" || Number.isNaN(min)) continue;
    if (min < lowestMin) {
      lowestMin = min;
      lowest = trip;
    }
  }

  return lowest;
}

export function primaryLinkedTrip(trips: LinkedTripSummary[]) {
  if (!trips.length) return undefined;
  return lowestTripBudgetMin(trips) ?? trips[0];
}

export function resolvePackageDuration(
  pkg: PackageCatalogFields,
  trips: LinkedTripSummary[],
) {
  const manual = pkg.duration?.trim();
  if (manual) return manual;
  if (!trips.length) return "";

  const dayValues = trips.map((trip) => trip.days).filter((value): value is number => typeof value === "number");
  if (!dayValues.length) return "";

  const minDays = Math.min(...dayValues);
  const maxDays = Math.max(...dayValues);
  if (minDays === maxDays) {
    const anchor = trips.find((trip) => trip.days === minDays) ?? trips[0];
    return tripDurationLabel(anchor.days, anchor.nights) || `${minDays} Days`;
  }

  return `${minDays}–${maxDays} Days`;
}

export function resolvePackagePriceText(
  pkg: PackageCatalogFields,
  trips: LinkedTripSummary[],
) {
  const manual = pkg.priceText?.trim();
  const anchor = primaryLinkedTrip(trips);

  if (anchor) {
    return formatTripPrice({
      currency: anchor.budget?.currency,
      displayText: anchor.budget?.displayText,
      max: anchor.budget?.max,
      min: anchor.budget?.min,
      priceText: anchor.priceText,
      pricingBasis: anchor.budget?.pricingBasis,
    });
  }

  return manual || "";
}

export function enrichPackageForCatalog<T extends PackageCatalogFields & { id?: string | number }>(
  pkg: T,
  tripsByPackageId: Map<string, LinkedTripSummary[]>,
) {
  const packageId = pkg.id != null ? String(pkg.id) : "";
  const linkedTrips = packageId ? tripsByPackageId.get(packageId) ?? [] : [];

  return {
    ...pkg,
    duration: resolvePackageDuration(pkg, linkedTrips) || pkg.duration,
    linkedTrips,
    priceText: resolvePackagePriceText(pkg, linkedTrips) || pkg.priceText,
  };
}

export function packageRouteFromTrips(trips: LinkedTripSummary[]) {
  const anchor = primaryLinkedTrip(trips);
  if (!anchor) return null;

  const start = anchor.startLocation?.split(",")[0]?.trim();
  const end = anchor.endLocation?.split(",")[0]?.trim();
  if (start && end) return { start, end };

  if (anchor.routeLabel) {
    const parts = anchor.routeLabel.split(/\s+to\s+/i).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { start: parts[0], end: parts[parts.length - 1] };
    }
  }

  return null;
}
