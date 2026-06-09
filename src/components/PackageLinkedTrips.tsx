import { TripCard, type Trip } from "@/components/Cards";

export function PackageLinkedTrips({
  packageTitle,
  trips,
}: {
  packageTitle: string;
  trips: Trip[];
}) {
  if (!trips.length) return null;

  return (
    <section aria-labelledby="pkg-linked-tours-heading" className="pkg-linked-tours">
      <div className="container">
        <div className="pkg-linked-tours__head">
          <h2 id="pkg-linked-tours-heading">Safaris Under this Package</h2>
          <p>
            {trips.length === 1
              ? `One published tour is linked to ${packageTitle}. Open it for the full itinerary, route map, seasonal pricing and inclusions.`
              : `${trips.length} published tours are linked to this package. Each tour has its own itinerary, pricing tables and booking details.`}
          </p>
        </div>

        <div className="acc-grid acc-grid--trips pkg-linked-tours__grid">
          {trips.map((trip) => (
            <TripCard item={trip} key={trip.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
