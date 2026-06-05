"use client";

import { geoMercator, geoPath } from "d3-geo";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Feature, FeatureCollection, Geometry, Point } from "geojson";

import eastAfricaGeoJson from "@/data/east-africa-focus.json";

const DESTINATIONS = {
  Kenya: {
    color: "#234d20",
    copy: "Masai Mara, Amboseli, Tsavo, Nairobi departures and classic savanna safari routes.",
    href: "/destinations?country=kenya",
  },
  Tanzania: {
    color: "#c78a2b",
    copy: "Serengeti, Ngorongoro, Tarangire, Kilimanjaro and northern circuit extensions.",
    href: "/destinations?country=tanzania",
  },
  Zanzibar: {
    color: "#2f746f",
    copy: "Beach extensions from Stone Town and the island coast after safari days.",
    href: "/destinations?country=zanzibar",
  },
} as const;

type DestinationName = keyof typeof DESTINATIONS;
type DestinationFeature = Feature<Geometry, { iso3: string; name: DestinationName; source?: string }>;

const collection = eastAfricaGeoJson as FeatureCollection<Geometry, DestinationFeature["properties"]>;

function destinationName(feature: DestinationFeature): DestinationName {
  return feature.properties.name;
}

export function AfricaMap() {
  const [active, setActive] = useState<DestinationName>("Kenya");

  const map = useMemo(() => {
    const countryFeatures = collection.features.filter((feature) => feature.geometry.type !== "Point") as DestinationFeature[];
    const zanzibar = collection.features.find((feature) => feature.properties.name === "Zanzibar" && feature.geometry.type === "Point") as Feature<Point, DestinationFeature["properties"]> | undefined;
    const projection = geoMercator().fitSize([520, 520], {
      type: "FeatureCollection",
      features: countryFeatures,
    });
    const path = geoPath(projection);
    const zanzibarPoint = zanzibar ? projection(zanzibar.geometry.coordinates as [number, number]) : null;

    return { countryFeatures, path, zanzibarPoint };
  }, []);

  return (
    <section className="africa-map-section" data-animate="section">
      <div className="africa-map-section__inner">
        <div className="africa-map-section__heading">
          <p className="africa-map-section__eyebrow">Destinations</p>
          <h2 className="africa-map-section__title">East Africa Safari Routes</h2>
          <p className="africa-map-section__sub">
            Focused Kenya, Tanzania and Zanzibar planning, with the map highlighting the countries and island extension guests ask about most.
          </p>
        </div>

        <div className="africa-map-section__tabs" role="tablist" aria-label="Destination focus">
          {(Object.keys(DESTINATIONS) as DestinationName[]).map((name) => (
            <button
              aria-selected={active === name}
              className={active === name ? "is-active" : ""}
              key={name}
              onClick={() => setActive(name)}
              role="tab"
              type="button"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="africa-map-section__body">
          <div className="africa-map-section__map" aria-label="GeoJSON map highlighting Kenya, Tanzania, and Zanzibar">
            <svg viewBox="0 0 520 520" role="img">
              <title>Kenya, Tanzania and Zanzibar GeoJSON destination map</title>
              <g>
                {map.countryFeatures.map((feature) => {
                  const name = destinationName(feature);
                  const highlighted = active === name;
                  return (
                    <path
                      d={map.path(feature) ?? undefined}
                      fill={highlighted ? DESTINATIONS[name].color : "#e5ecdf"}
                      key={feature.properties.iso3}
                      onMouseEnter={() => setActive(name)}
                      stroke="#708268"
                      strokeWidth={highlighted ? 1.4 : 0.8}
                    />
                  );
                })}
              </g>
              {map.zanzibarPoint ? (
                <g
                  className={active === "Zanzibar" ? "is-active" : ""}
                  onMouseEnter={() => setActive("Zanzibar")}
                  transform={`translate(${map.zanzibarPoint[0]} ${map.zanzibarPoint[1]})`}
                >
                  <circle r="9" fill={DESTINATIONS.Zanzibar.color} />
                  <circle r="15" fill="none" stroke={DESTINATIONS.Zanzibar.color} strokeWidth="1.5" />
                </g>
              ) : null}
              <text x="192" y="120">Kenya</text>
              <text x="195" y="308">Tanzania</text>
              <text x="386" y="292">Zanzibar</text>
              <line x1="375" y1="286" x2="337" y2="278" />
            </svg>
          </div>

          <div className="africa-map-section__panel">
            <span style={{ background: DESTINATIONS[active].color }} />
            <h3>{active}</h3>
            <p>{DESTINATIONS[active].copy}</p>
            <Link href={DESTINATIONS[active].href}>Explore {active}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
