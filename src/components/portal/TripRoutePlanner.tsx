"use client";

import { MapPin } from "lucide-react";

import { PlaceSearchInput } from "@/components/portal/PlaceSearchInput";
import { TripRouteMap } from "@/components/TripRouteMap";

type TripRoutePlannerProps = {
  endLocation: string;
  onEndChange: (value: string) => void;
  onStartChange: (value: string) => void;
  startLocation: string;
};

export function TripRoutePlanner({
  endLocation,
  onEndChange,
  onStartChange,
  startLocation,
}: TripRoutePlannerProps) {
  const hasStart = Boolean(startLocation.trim());
  const hasEnd = Boolean(endLocation.trim());
  const hasMap = hasStart || hasEnd;

  return (
    <div className="trip-route-planner">
      <div className="trip-route-planner__panel">
        <div className="trip-route-planner__fields">
          <div className="trip-route-planner__field-row">
            <span aria-hidden="true" className="trip-route-planner__marker trip-route-planner__marker--start" />
            <PlaceSearchInput
              hideIcon
              id="trip-route-from"
              label="From"
              onChange={onStartChange}
              placeholder="Search any place in Kenya or Tanzania"
              showHint={false}
              value={startLocation}
            />
          </div>
          <div className="trip-route-planner__connector" aria-hidden="true" />
          <div className="trip-route-planner__field-row">
            <span aria-hidden="true" className="trip-route-planner__marker trip-route-planner__marker--end" />
            <PlaceSearchInput
              hideIcon
              id="trip-route-to"
              label="To"
              onChange={onEndChange}
              placeholder="Search any place in Kenya or Tanzania"
              showHint={false}
              value={endLocation}
            />
          </div>
        </div>
        <p className="trip-route-planner__help">
          Pick a Google Maps result for each field. The map locates your start point immediately, then draws the full route once both places are selected.
        </p>
      </div>

      <div className="trip-route-planner__map">
        {hasMap ? (
          <TripRouteMap endLocation={endLocation} startLocation={startLocation} waypoints={[]} />
        ) : (
          <div className="trip-route-planner__placeholder">
            <MapPin size={28} strokeWidth={1.5} />
            <p>Search and select a start point or destination to preview it on the map.</p>
          </div>
        )}
      </div>
    </div>
  );
}
