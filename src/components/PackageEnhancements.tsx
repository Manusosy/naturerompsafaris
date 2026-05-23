"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { PackageEnhancements } from "@/lib/portal-content";

const availabilityLabels: Record<string, string> = {
  available: "Available",
  limited: "Limited",
  "on-request": "On Request",
  unavailable: "Unavailable",
};

export function PackageEnhancementsLoader({ slug }: { slug: string }) {
  const [data, setData] = useState<PackageEnhancements | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/package-enhancements/${slug}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: PackageEnhancements | null) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setData(null);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!data) return null;

  return <PackageEnhancementsView {...data} />;
}

function PackageEnhancementsView({
  accommodations,
  flightAffiliate,
}: PackageEnhancements) {
  if (!accommodations.length && !flightAffiliate) return null;

  return (
    <section className="package-enhancements">
      {accommodations.length > 0 && (
        <div>
          <h2>Accommodation Options</h2>
          <div className="accommodation-grid">
            {accommodations.map((item) => (
              <article className="accommodation-card" key={`${item.name}-${item.location}`}>
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    width={520}
                    height={340}
                  />
                )}
                <div>
                  <span className={`availability-badge availability-badge--${item.availability}`}>
                    {availabilityLabels[item.availability] ?? "On Request"}
                  </span>
                  <h3>{item.name}</h3>
                  <p>{item.location}</p>
                  {item.priceText && <p>{item.priceText}</p>}
                  {item.description && <p>{item.description}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
      {flightAffiliate && (
        <div className="flight-cta">
          <h2>Flights For This Safari</h2>
          <p>
            Compare flight options through the configured {flightAffiliate.provider}
            affiliate partner.
          </p>
          <a href={flightAffiliate.href} className="btn btn--primary" rel="nofollow sponsored" target="_blank">
            {flightAffiliate.ctaLabel}
          </a>
        </div>
      )}
    </section>
  );
}
