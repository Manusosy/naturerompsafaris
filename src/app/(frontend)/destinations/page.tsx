import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getAllDestinations, getDestinationRegions } from "@/lib/destination-content";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Safari Destinations",
  description:
    "Explore Kenya and Tanzania safari destinations. Filter by country and region to find parks, reserves, and regions for your East Africa adventure.",
  path: "/destinations",
  keywords: "Kenya destinations, Tanzania destinations, safari destinations, East Africa parks",
});

const COUNTRY_LABELS: Record<string, string> = {
  kenya: "Kenya",
  tanzania: "Tanzania",
};

const COUNTRY_BADGE: Record<string, { label: string; cls: string }> = {
  kenya: { label: "Kenya", cls: "avail--available" },
  tanzania: { label: "Tanzania", cls: "avail--request" },
};

function formatDestinationLocation(region: string, country: string) {
  const countryLabel = COUNTRY_LABELS[country] ?? "";
  return [region, countryLabel].filter(Boolean).join(", ");
}

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const country = (params.country ?? "__all").toLowerCase();
  const region = params.region ?? "";

  const [items, regions] = await Promise.all([
    getAllDestinations({ country, region }),
    getDestinationRegions(country),
  ]);
  const activeCountryLabel = COUNTRY_LABELS[country] ?? "";

  return (
    <main className="acc-page">
      <section className="acc-page__hero">
        <div className="acc-page__hero-inner">
          <span className="acc-page__eyebrow">Where You Will Go</span>
          <h1 className="acc-page__title">
            {activeCountryLabel ? `${activeCountryLabel} Destinations` : "Safari Destinations"}
          </h1>
          <p className="acc-page__subtitle">
            Explore Kenya and Tanzania parks, reserves, and safari regions. Filter by country and
            region, then open each destination guide to plan your route.
          </p>
        </div>
      </section>

      <div className="acc-page__layout">
        <aside className="acc-sidebar">
          <form action="/destinations" className="acc-filter-form" method="get">
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
              <h3 className="acc-filter-heading">Region</h3>
              <select className="acc-filter-select" defaultValue={region} name="region">
                <option value="">All Regions</option>
                {regions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button className="acc-filter-btn" type="submit">
              Apply Filters
            </button>

            {(country !== "__all" || region) && (
              <Link className="acc-filter-clear" href="/destinations">
                Clear all filters
              </Link>
            )}
          </form>
        </aside>

        <section className="acc-results">
          <div className="acc-results__header">
            <p className="acc-results__count">
              {items.length} {items.length === 1 ? "destination" : "destinations"} found
            </p>
          </div>

          {items.length === 0 ? (
            <div className="acc-empty">
              <p>No destinations match your filters.</p>
              <Link className="acc-empty-link" href="/destinations">
                View all destinations →
              </Link>
            </div>
          ) : (
            <div className="acc-grid">
              {items.map((item) => {
                const countryBadge =
                  COUNTRY_BADGE[item.country] ?? { label: "East Africa", cls: "avail--request" };
                return (
                  <article className="acc-card" key={item.id}>
                    <Link className="acc-card__img-wrap" href={`/destinations/${item.slug}`}>
                      {item.imageUrl ? (
                        <Image
                          alt={item.imageAlt || item.name}
                          fill
                          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 400px"
                          src={item.imageUrl}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="acc-card__img-placeholder">
                          <span>No photo</span>
                        </div>
                      )}
                      <span className={`acc-card__avail ${countryBadge.cls}`}>
                        {countryBadge.label}
                      </span>
                      {item.region ? (
                        <span className="acc-card__type">{item.region}</span>
                      ) : null}
                    </Link>

                    <div className="acc-card__body">
                      <div className="acc-card__location">
                        <svg
                          fill="none"
                          height="12"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          width="12"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {formatDestinationLocation(item.region, item.country) || "East Africa"}
                      </div>
                      <h2 className="acc-card__name">
                        <Link href={`/destinations/${item.slug}`}>{item.name}</Link>
                      </h2>
                      {item.summary ? (
                        <p className="acc-card__desc">
                          {item.summary.length > 120
                            ? `${item.summary.slice(0, 120)}…`
                            : item.summary}
                        </p>
                      ) : null}
                      <div className="acc-card__footer">
                        <div className="acc-card__price">
                          {item.region || countryBadge.label}
                        </div>
                        <Link className="acc-card__explore" href={`/destinations/${item.slug}`}>
                          Explore
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
