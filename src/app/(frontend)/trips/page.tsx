import configPromise from "@payload-config";
import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";

import { TripCard, type Trip } from "@/components/Cards";
import { buildMetadata } from "@/lib/seo";
import {
  mergeExperienceTypes,
  resolveTripPackageTier,
  TRIP_EXPERIENCE_FILTER_OPTIONS,
  TRIP_TIER_FILTER_OPTIONS,
} from "@/lib/trip-labels";

export const dynamic = "force-dynamic";

type TripSearchParams = {
  country?: string;
  experience?: string;
  maxDays?: string;
  minDays?: string;
  tier?: string;
};

const tripsMetadata = {
  title: "Safari Tours",
  description:
    "Browse quote-first Kenya, Tanzania, Zanzibar, and combined East Africa safari tours by Nature Romp Safaris.",
  keywords:
    "Kenya safari tours, Tanzania safari tours, Zanzibar safari holiday, Kenya Tanzania safari adventure",
  path: "/trips",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<TripSearchParams>;
}): Promise<Metadata> {
  const params = (await searchParams) || {};
  const country = (params.country ?? "__all").toLowerCase();
  const tier = params.tier ?? "__all";
  const experience = params.experience ?? "__all";
  const isFiltered =
    country !== "__all" ||
    tier !== "__all" ||
    experience !== "__all" ||
    Boolean(params.minDays) ||
    Boolean(params.maxDays);

  return buildMetadata({
    ...tripsMetadata,
    noIndex: isFiltered,
  });
}

function normalizeTrip(doc: Record<string, unknown>): Trip {
  const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  return {
    availability: typeof doc.availability === "string" ? doc.availability : undefined,
    budget:
      doc.budget && typeof doc.budget === "object"
        ? (doc.budget as Trip["budget"])
        : undefined,
    days: typeof doc.days === "number" ? doc.days : undefined,
    galleryImages: gallery.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>).image : item,
    ),
    experienceTypes: mergeExperienceTypes(doc.experienceTypes, doc.customExperienceTypes),
    heroImage: doc.heroImage,
    location: typeof doc.location === "string" ? doc.location : undefined,
    nights: typeof doc.nights === "number" ? doc.nights : undefined,
    cardSummary: typeof doc.cardSummary === "string" ? doc.cardSummary : undefined,
    overview: typeof doc.overview === "string" ? doc.overview : undefined,
    packageTier: resolveTripPackageTier(doc),
    priceText: typeof doc.priceText === "string" ? doc.priceText : undefined,
    slug: typeof doc.slug === "string" ? doc.slug : undefined,
    title: typeof doc.title === "string" ? doc.title : undefined,
  };
}

function matchesCountry(trip: Trip, country: string) {
  if (country === "__all") return true;
  const location = (trip.location || "").toLowerCase();
  return location.includes(country);
}

function matchesDuration(trip: Trip, minDays?: number, maxDays?: number) {
  if (!minDays && !maxDays) return true;
  if (!trip.days) return false;
  if (minDays && trip.days < minDays) return false;
  if (maxDays && trip.days > maxDays) return false;
  return true;
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams?: Promise<TripSearchParams>;
}) {
  const params = (await searchParams) || {};
  const country = (params.country ?? "__all").toLowerCase();
  const tier = params.tier ?? "__all";
  const experience = params.experience ?? "__all";
  const minDays = params.minDays ? Number(params.minDays) : undefined;
  const maxDays = params.maxDays ? Number(params.maxDays) : undefined;
  const activeCountryLabel = country === "kenya" ? "Kenya" : country === "tanzania" ? "Tanzania" : "";

  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "trips" as never,
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: "-updatedAt",
    where: {
      and: [
        { status: { equals: "published" } },
        ...(tier !== "__all" ? [{ packageTier: { equals: tier } }] : []),
        ...(experience !== "__all" ? [{ experienceTypes: { contains: experience } }] : []),
      ],
    } as never,
  });

  const trips = (result.docs as Array<Record<string, unknown>>)
    .map(normalizeTrip)
    .filter((trip) => matchesCountry(trip, country) && matchesDuration(trip, minDays, maxDays));

  const isFiltered =
    country !== "__all" ||
    tier !== "__all" ||
    experience !== "__all" ||
    Boolean(params.minDays) ||
    Boolean(params.maxDays);

  return (
    <main className="acc-page">
      <section className="acc-page__hero">
        <div className="acc-page__hero-inner">
          <span className="acc-page__eyebrow">Safari Tours</span>
          <h1 className="acc-page__title">
            {activeCountryLabel ? `${activeCountryLabel} Safari Tours` : "Explore Safari Tours"}
          </h1>
          <p className="acc-page__subtitle">
            Browse quote-first Kenya, Tanzania, and combined East Africa itineraries. Filter by
            country, experience style, package tier, and trip length to find the right safari route.
          </p>
        </div>
      </section>

      <div className="acc-page__layout">
        <aside className="acc-sidebar" aria-label="Safari tour filters">
          <form action="/trips" className="acc-filter-form" method="get">
            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Country</h3>
              {[
                { label: "All Countries", value: "__all" },
                { label: "Kenya", value: "kenya" },
                { label: "Tanzania", value: "tanzania" },
              ].map(({ label, value }) => (
                <label className="acc-filter-radio" key={value}>
                  <input
                    defaultChecked={country === value}
                    name="country"
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Experience</h3>
              {TRIP_EXPERIENCE_FILTER_OPTIONS.map(({ label, value }) => (
                <label className="acc-filter-radio" key={value}>
                  <input
                    defaultChecked={experience === value}
                    name="experience"
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Package Tier</h3>
              {TRIP_TIER_FILTER_OPTIONS.map(({ label, value }) => (
                <label className="acc-filter-radio" key={value}>
                  <input defaultChecked={tier === value} name="tier" type="radio" value={value} />
                  {label}
                </label>
              ))}
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Trip Length (Days)</h3>
              <div className="acc-price-range">
                <div className="acc-price-input">
                  <label htmlFor="trip-min-days">Min</label>
                  <input
                    defaultValue={params.minDays ?? ""}
                    id="trip-min-days"
                    min="1"
                    name="minDays"
                    placeholder="1"
                    type="number"
                  />
                </div>
                <span className="acc-price-dash">–</span>
                <div className="acc-price-input">
                  <label htmlFor="trip-max-days">Max</label>
                  <input
                    defaultValue={params.maxDays ?? ""}
                    id="trip-max-days"
                    min="1"
                    name="maxDays"
                    placeholder="Any"
                    type="number"
                  />
                </div>
              </div>
            </div>

            <button className="acc-filter-btn" type="submit">
              Apply Filters
            </button>

            {isFiltered ? (
              <Link className="acc-filter-clear" href="/trips">
                Clear all filters
              </Link>
            ) : null}
          </form>
        </aside>

        <section className="acc-results" aria-label="Safari tour results">
          <div className="acc-results__header">
            <p className="acc-results__count">
              {trips.length} {trips.length === 1 ? "tour" : "tours"} found
            </p>
            {isFiltered ? (
              <span>
                {activeCountryLabel ? `Country: ${activeCountryLabel}` : null}
                {activeCountryLabel && tier !== "__all" ? " / " : null}
                {tier !== "__all"
                  ? `Tier: ${TRIP_TIER_FILTER_OPTIONS.find((option) => option.value === tier)?.label || tier}`
                  : null}
                {(activeCountryLabel || tier !== "__all") && experience !== "__all" ? " / " : null}
                {experience !== "__all"
                  ? `Experience: ${TRIP_EXPERIENCE_FILTER_OPTIONS.find((option) => option.value === experience)?.label || experience}`
                  : null}
              </span>
            ) : null}
          </div>

          {trips.length === 0 ? (
            <div className="acc-empty">
              <p>No safari tours match your filters.</p>
              <Link className="acc-empty-link" href="/trips">
                View all tours →
              </Link>
            </div>
          ) : (
            <div className="acc-grid acc-grid--trips">
              {trips.map((item) => (
                <TripCard item={item} key={item.slug} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
