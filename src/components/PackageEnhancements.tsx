import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import type { PackageEnhancements } from "@/lib/portal-content";

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

export function PackageEnhancementsView({
  accommodations,
  flightAffiliate,
}: PackageEnhancements) {
  if (!accommodations.length && !flightAffiliate) return null;

  return (
    <section className="package-enhancements" style={{ marginTop: "4rem" }}>
      {accommodations.length > 0 && (
        <div style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.85rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
            Accommodation Options
          </h2>
          <div className="acc-grid">
            {accommodations.map((item) => {
              const avail = AVAILABILITY_LABELS[item.availability] ?? AVAILABILITY_LABELS["on-request"];
              return (
                <article className="acc-card" key={item.id} style={{ position: "relative" }}>
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
                      <svg fill="none" height="12" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
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
                        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                        </svg>
                        Enquire
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
      {flightAffiliate && (
        <div className="flight-cta">
          <h2>Need Flights?</h2>
          <p>
            Book flights with our travel partner. Nature Romp Safaris may earn a commission.
          </p>
          <a href={flightAffiliate.href} className="btn btn--primary" rel="nofollow sponsored" target="_blank">
            {flightAffiliate.ctaLabel} <ExternalLink size={16} />
          </a>
        </div>
      )}
    </section>
  );
}
