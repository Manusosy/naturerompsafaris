"use client";

import React from "react";
import { MapPin } from "lucide-react";

type Waypoint = {
  place: string;
  label?: string;
  notes?: string;
};

type TripRouteMapProps = {
  waypoints: Waypoint[];
  startLocation?: string;
  endLocation?: string;
};

export function TripRouteMap({ waypoints, startLocation, endLocation }: TripRouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!waypoints || waypoints.length === 0) {
    return null;
  }

  // If we have an API key, render the interactive iframe
  if (apiKey) {
    // Collect all stops
    const stops = waypoints.map((w) => w.place);
    const origin = startLocation || stops[0];
    const destination = endLocation || stops[stops.length - 1];

    // Build the waypoints string for the middle stops (excluding origin and destination)
    // The Google Maps Embed API takes waypoints separated by the pipe character (|)
    // We must URL-encode the pipe as %7C.
    const middleStops = stops.filter((stop) => stop !== origin && stop !== destination);
    const waypointsParam = middleStops.length > 0 ? `&waypoints=${middleStops.map(encodeURIComponent).join("%7C")}` : "";

    const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}${waypointsParam}&mode=driving`;

    return (
      <div className="trip-route-map">
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title="Trip Route Map"
        ></iframe>
      </div>
    );
  }

  // Fallback: No API key set, render a styled list of waypoints
  return (
    <div className="route-waypoints-fallback">
      <h3>Route Overview</h3>
      <p>Configure your Google Maps API key in the environment to enable the interactive map.</p>
      
      <ul className="route-waypoints-list">
        {waypoints.map((waypoint, index) => (
          <li key={`${waypoint.place}-${index}`}>
            <div className="waypoint-number">{index + 1}</div>
            <div className="waypoint-details">
              <span className="waypoint-place">{waypoint.place}</span>
              {waypoint.label && <span className="waypoint-label">{waypoint.label}</span>}
              {waypoint.notes && <span className="waypoint-notes">{waypoint.notes}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
