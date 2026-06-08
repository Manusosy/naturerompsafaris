import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { TripCard, type Trip } from "@/components/Cards";

export function PackageLinkedTrips({
  packageTitle,
  trips,
}: {
  packageTitle: string;
  trips: Trip[];
}) {
  if (!trips.length) return null;

  const heading =
    trips.length === 1 ? "Book this safari tour" : "Available safari tours";

  return (
    <section aria-labelledby="pkg-linked-tours-heading" className="pkg-panel pkg-linked-tours">
      <div className="pkg-linked-tours__head">
        <h2 id="pkg-linked-tours-heading">{heading}</h2>
        <p>
          {trips.length === 1
            ? `Full itinerary, seasonal pricing, route map and inclusions for ${packageTitle} are on the tour page below.`
            : `${trips.length} published tours are linked to this package. Each has its own itinerary, pricing tables and booking details.`}
        </p>
      </div>

      <div className="pkg-linked-tours__grid">
        {trips.map((trip) => (
          <TripCard item={trip} key={trip.slug} />
        ))}
      </div>

      {trips.length === 1 && trips[0]?.slug ? (
        <div className="pkg-linked-tours__cta">
          <Link className="btn btn--primary" href={`/trips/${trips[0].slug}`}>
            View full itinerary &amp; prices
            <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
