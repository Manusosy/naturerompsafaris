"use client";

import React from "react";

type Waypoint = {
  place: string;
  label?: string;
  notes?: string;
};

type TripRouteMapProps = {
  waypoints?: Waypoint[];
  startLocation?: string;
  endLocation?: string;
};

export function TripRouteMap({ waypoints = [], startLocation, endLocation }: TripRouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const stops = waypoints.map((w) => w.place.trim()).filter(Boolean);
  const origin = startLocation?.trim() || stops[0];
  const destination = endLocation?.trim() || stops[stops.length - 1];

  if (!origin && !destination) {
    return null;
  }

  if (apiKey) {
    if (origin && destination) {
      const middleStops = stops.filter((stop) => stop !== origin && stop !== destination);
      const waypointsParam =
        middleStops.length > 0 ? `&waypoints=${middleStops.map(encodeURIComponent).join("%7C")}` : "";

      const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(
        origin,
      )}&destination=${encodeURIComponent(destination)}${waypointsParam}&mode=driving`;

      return (
        <div className="trip-route-map">
          <iframe
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title="Trip route map"
          />
        </div>
      );
    }

    const place = origin || destination;
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(place)}&zoom=9`;

    return (
      <div className="trip-route-map">
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title="Trip location map"
        />
      </div>
    );
  }

  const routeStops =
    stops.length > 0
      ? stops
      : [origin, destination].filter(Boolean).filter((stop, index, list) => list.indexOf(stop) === index);

  return (
    <div className="route-waypoints-fallback">
      <h3>Route Overview</h3>
      <p>Configure your Google Maps API key in the environment to enable the interactive map.</p>

      <ul className="route-waypoints-list">
        {routeStops.map((place, index) => {
          const waypoint = waypoints[index];
          return (
            <li key={`${place}-${index}`}>
              <div className="waypoint-number">{index + 1}</div>
              <div className="waypoint-details">
                <span className="waypoint-place">{place}</span>
                {waypoint?.label ? <span className="waypoint-label">{waypoint.label}</span> : null}
                {waypoint?.notes ? <span className="waypoint-notes">{waypoint.notes}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
