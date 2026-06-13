import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ListingFilters } from "@/components/ListingFilters";
import { getAllAccommodations, getAccommodationLocations } from "@/lib/accommodation-content";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const accommodationsMetadata = {
  title: "Safari Accommodations & Lodges",
  description:
    "Browse our handpicked collection of safari lodges, tented camps, hotels and Airbnbs across East Africa. Enquire directly via WhatsApp.",
  path: "/accommodations",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const country = (params.country ?? "__all").toLowerCase();
  const type = params.type ?? "__all";
  const comfortLevel = params.comfortLevel ?? "__all";
  const location = params.location ?? "";
  const isFiltered =
    country !== "__all" ||
    type !== "__all" ||
    comfortLevel !== "__all" ||
    location.length > 0 ||
    Boolean(params.min) ||
    Boolean(params.max);

  return buildMetadata({
    ...accommodationsMetadata,
    noIndex: isFiltered,
  });
}

const TYPE_LABELS: Record<string, string> = {
  lodge: "Safari Lodge",
  camp: "Tented Camp",
  airbnb: "Airbnb / Apartment",
  hotel: "Hotel",
  boutique: "Boutique",
};

const AVAILABILITY_LABELS: Record<string, { label: string; cls: string }> = {
  available: { label: "Available", cls: "avail--available" },
  limited: { label: "Limited", cls: "avail--limited" },
  "on-request": { label: "On Request", cls: "avail--request" },
  unavailable: { label: "Unavailable", cls: "avail--unavailable" },
};

const COUNTRY_LABELS: Record<string, string> = {
  kenya: "Kenya",
  tanzania: "Tanzania",
};

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254722714812";

function buildWhatsApp(name: string) {
  const msg = encodeURIComponent(
    `Hi Yvonne! 👋 I came across Nature Romp Safaris and I'd love to enquire about accommodation at ${name}. Could you please share availability and rates? Thank you!`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function formatAccommodationLocation(location: string, country: string) {
  const countryLabel = COUNTRY_LABELS[country] ?? "";
  if (!countryLabel) return location;
  if (location.toLowerCase().includes(countryLabel.toLowerCase())) return location;
  return [location, countryLabel].filter(Boolean).join(", ");
}

export default async function AccommodationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const country = (params.country ?? "__all").toLowerCase();
  const type = params.type ?? "__all";
  const comfortLevel = params.comfortLevel ?? "__all";
  const location = params.location ?? "";
  const minPrice = params.min ? Number(params.min) : undefined;
  const maxPrice = params.max ? Number(params.max) : undefined;

  const [items, locations] = await Promise.all([
    getAllAccommodations({ comfortLevel, country, type, location, minPrice, maxPrice }),
    getAccommodationLocations(country),
  ]);
  const activeCountryLabel = COUNTRY_LABELS[country] ?? "";

  return (
    <main className="acc-page">
      {/* Page Hero */}
      <section className="acc-page__hero">
        <div className="acc-page__hero-inner">
          <span className="acc-page__eyebrow">Where You Will Stay</span>
          <h1 className="acc-page__title">
            {activeCountryLabel ? `${activeCountryLabel} Accommodations` : "Accommodations"}
          </h1>
          <p className="acc-page__subtitle">
            From luxury safari lodges deep in the bush to cosy Nairobi apartments — browse our
            handpicked properties and enquire directly via WhatsApp.
          </p>
        </div>
      </section>

      <div className="acc-page__layout">
        {/* Sidebar */}
        <aside className="acc-sidebar" aria-label="Accommodation filters">
          <ListingFilters
            activeCount={
              (country !== "__all" ? 1 : 0) +
              (type !== "__all" ? 1 : 0) +
              (comfortLevel !== "__all" ? 1 : 0) +
              (location ? 1 : 0) +
              (params.min ? 1 : 0) +
              (params.max ? 1 : 0)
            }
          >
          <form action="/accommodations" className="acc-filter-form" method="get">
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
              <h3 className="acc-filter-heading">Property Type</h3>
              {[{ label: "All Types", value: "__all" }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ label: l, value: v }))].map(
                ({ label, value }) => (
                  <label className="acc-filter-radio" key={value}>
                    <input
                      defaultChecked={type === value}
                      name="type"
                      type="radio"
                      value={value}
                    />
                    {label}
                  </label>
                ),
              )}
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Comfort Level</h3>
              {[
                { label: "All Levels", value: "__all" },
                { label: "Economy", value: "economy" },
                { label: "Mid Range", value: "mid-range" },
                { label: "Luxury", value: "luxury" },
                { label: "Ultra Luxury", value: "ultra-luxury" },
              ].map(({ label, value }) => (
                <label className="acc-filter-radio" key={value}>
                  <input
                    defaultChecked={comfortLevel === value}
                    name="comfortLevel"
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Location</h3>
              <select className="acc-filter-select" defaultValue={location} name="location">
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Price Per Night (USD)</h3>
              <div className="acc-price-range">
                <div className="acc-price-input">
                  <label htmlFor="price-min">Min</label>
                  <input
                    defaultValue={params.min ?? ""}
                    id="price-min"
                    min="0"
                    name="min"
                    placeholder="0"
                    type="number"
                  />
                </div>
                <span className="acc-price-dash">–</span>
                <div className="acc-price-input">
                  <label htmlFor="price-max">Max</label>
                  <input
                    defaultValue={params.max ?? ""}
                    id="price-max"
                    min="0"
                    name="max"
                    placeholder="Any"
                    type="number"
                  />
                </div>
              </div>
            </div>

            <button className="acc-filter-btn" type="submit">Apply Filters</button>

            {(country !== "__all" || type !== "__all" || comfortLevel !== "__all" || location || params.min || params.max) && (
              <Link className="acc-filter-clear" href="/accommodations">
                Clear all filters
              </Link>
            )}
          </form>
          </ListingFilters>
        </aside>

        {/* Results */}
        <section className="acc-results">
          <div className="acc-results__header">
            <p className="acc-results__count">
              {items.length} {items.length === 1 ? "property" : "properties"} found
            </p>
          </div>

          {items.length === 0 ? (
            <div className="acc-empty">
              <p>No accommodations match your filters.</p>
              <Link className="acc-empty-link" href="/accommodations">View all properties →</Link>
            </div>
          ) : (
            <div className="acc-grid">
              {items.map((item) => {
                const avail = AVAILABILITY_LABELS[item.availability] ?? AVAILABILITY_LABELS["on-request"];
                return (
                  <article className="acc-card" key={item.id}>
                    <Link className="acc-card__img-wrap" href={`/accommodations/${item.slug}`}>
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
                      <span className={`acc-card__avail ${avail.cls}`}>{avail.label}</span>
                      <span className="acc-card__type">{TYPE_LABELS[item.type] ?? item.type}</span>
                    </Link>

                    <div className="acc-card__body">
                      <div className="acc-card__location">
                        <svg fill="none" height="12" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {formatAccommodationLocation(item.location, item.country)}
                      </div>
                      <h2 className="acc-card__name">
                        <Link href={`/accommodations/${item.slug}`}>{item.name}</Link>
                      </h2>
                      {item.description && (
                        <p className="acc-card__desc">
                          {item.description.length > 120
                            ? `${item.description.slice(0, 120)}…`
                            : item.description}
                        </p>
                      )}
                      <div className="acc-card__footer">
                        <div className="acc-card__price">
                          {item.priceText || (item.price ? `From $${item.price} / night` : "Price on request")}
                        </div>
                        <a
                          className="acc-card__wa"
                          href={buildWhatsApp(item.name)}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                          Enquire
                        </a>
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
