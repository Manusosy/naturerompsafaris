"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { searchPlaces, type GeocodeResult } from "@/lib/portal/geocode";

type PortalWindow = Window & {
  google?: {
    maps: {
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
        addListener: (event: string, fn: (e: { latLng: { lat: () => number; lng: () => number } | null }) => void) => void;
        panTo: (pos: { lat: number; lng: number }) => void;
        setZoom: (zoom: number) => void;
      };
      Marker: new (opts: Record<string, unknown>) => {
        addListener: (event: string, fn: () => void) => void;
        setPosition: (pos: { lat: number; lng: number }) => void;
        getPosition: () => { lat: () => number; lng: () => number } | null;
      };
    };
  };
  L?: {
    map: (el: HTMLElement) => {
      on: (e: string, fn: (ev: { latlng: { lat: number; lng: number } }) => void) => void;
      panTo: (pos: { lat: number; lng: number }) => void;
      setView: (c: [number, number], z: number) => {
        on: (e: string, fn: (ev: { latlng: { lat: number; lng: number } }) => void) => void;
        panTo: (pos: { lat: number; lng: number }) => void;
      };
    };
    tileLayer: (url: string, opts: Record<string, string>) => { addTo: (map: unknown) => unknown };
    marker: (
      c: [number, number],
      opts: { draggable: boolean },
    ) => {
      addTo: (map: unknown) => MapMarker;
      on: (e: string, fn: () => void) => void;
      setLatLng: (pos: { lat: number; lng: number }) => void;
      getLatLng: () => { lat: number; lng: number };
    };
  };
};

type MapMarker = {
  getLatLng?: () => { lat: number; lng: number };
  getPosition?: () => { lat: () => number; lng: () => number } | null;
  on?: (event: string, fn: () => void) => void;
  setLatLng?: (pos: { lat: number; lng: number }) => void;
  setPosition?: (pos: { lat: number; lng: number }) => void;
};

function parseCoord(value: string, fallback: number) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function LocationSearchPicker({
  country,
  hint,
  latitude,
  locationQuery,
  longitude,
  onLatitudeChange,
  onLocationQueryChange,
  onLongitudeChange,
}: {
  country?: string;
  hint?: string;
  latitude: string;
  locationQuery: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLocationQueryChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const lastSyncedCoordsRef = useRef("");
  const onLatitudeChangeRef = useRef(onLatitudeChange);
  const onLongitudeChangeRef = useRef(onLongitudeChange);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    onLatitudeChangeRef.current = onLatitudeChange;
    onLongitudeChangeRef.current = onLongitudeChange;
  }, [onLatitudeChange, onLongitudeChange]);

  const updateMapViewOnly = useCallback((lat: string, lng: string, zoom = 9) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;

    const marker = markerRef.current;
    const win = window as PortalWindow;

    if (win.google?.maps && marker?.setPosition) {
      const position = { lat: latNum, lng: lngNum };
      marker.setPosition(position);
      const map = mapInstanceRef.current as { panTo: (p: { lat: number; lng: number }) => void; setZoom: (z: number) => void } | null;
      map?.panTo(position);
      map?.setZoom(zoom);
      return;
    }

    if (marker?.setLatLng) {
      marker.setLatLng({ lat: latNum, lng: lngNum });
      const map = mapInstanceRef.current as { panTo: (p: { lat: number; lng: number }) => void; setView: (c: [number, number], z: number) => void } | null;
      map?.panTo({ lat: latNum, lng: lngNum });
      map?.setView([latNum, lngNum], zoom);
    }
  }, []);

  const commitCoords = useCallback((lat: string, lng: string, zoom = 9) => {
    lastSyncedCoordsRef.current = `${lat},${lng}`;
    onLatitudeChangeRef.current(lat);
    onLongitudeChangeRef.current(lng);
    updateMapViewOnly(lat, lng, zoom);
  }, [updateMapViewOnly]);

  const applyResult = useCallback(
    (result: GeocodeResult) => {
      const shortLabel = result.shortLabel || result.label.split(",").slice(0, 2).join(",").trim();
      onLocationQueryChange(shortLabel || result.label);
      commitCoords(result.lat, result.lng, 10);
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError("");
    },
    [commitCoords, onLocationQueryChange],
  );

  async function runSearch(query = locationQuery) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchError("Type at least 2 characters to search.");
      return;
    }

    setSearching(true);
    setSearchError("");
    try {
      const results = await searchPlaces(trimmed, { country, limit: 6 });
      if (!results.length) {
        setSuggestions([]);
        setSearchError("No matching place found. Try Masai Mara, Kenya or Amboseli National Park.");
        return;
      }
      setSuggestions(results);
      setShowSuggestions(true);

      const best = results[0];
      if (results.length === 1) {
        applyResult(best);
      } else {
        setSearchError("Multiple matches found — pick the correct park or place from the list.");
      }
    } catch {
      setSearchError("Location search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const win = window as PortalWindow;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const lat = parseCoord(latitude, -1.2921);
    const lng = parseCoord(longitude, 36.8219);
    const hasCoords = Boolean(latitude && longitude);
    if (hasCoords) {
      lastSyncedCoordsRef.current = `${latitude},${longitude}`;
    }

    function syncCoordsFromMarker(marker: MapMarker) {
      if (marker.getPosition) {
        const pos = marker.getPosition();
        if (pos) {
          const latValue = pos.lat().toFixed(6);
          const lngValue = pos.lng().toFixed(6);
          lastSyncedCoordsRef.current = `${latValue},${lngValue}`;
          onLatitudeChangeRef.current(latValue);
          onLongitudeChangeRef.current(lngValue);
        }
        return;
      }
      if (marker.getLatLng) {
        const pos = marker.getLatLng();
        const latValue = pos.lat.toFixed(6);
        const lngValue = pos.lng.toFixed(6);
        lastSyncedCoordsRef.current = `${latValue},${lngValue}`;
        onLatitudeChangeRef.current(latValue);
        onLongitudeChangeRef.current(lngValue);
      }
    }

    function bindMarker(marker: MapMarker) {
      markerRef.current = marker;
      marker.on?.("dragend", () => syncCoordsFromMarker(marker));
    }

    if (apiKey) {
      const initGoogleMap = () => {
        const google = win.google;
        if (!google || !mapRef.current) return;
        const center = { lat, lng };
        const map = new google.maps.Map(mapRef.current, {
          center,
          mapTypeControl: true,
          streetViewControl: false,
          zoom: hasCoords ? 9 : 6,
        });
        mapInstanceRef.current = map;
        const marker = new google.maps.Marker({
          draggable: true,
          map,
          position: center,
        });
        bindMarker(marker);
        map.addListener("click", (e) => {
          if (e.latLng) {
            const latValue = e.latLng.lat().toFixed(6);
            const lngValue = e.latLng.lng().toFixed(6);
            marker.setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            lastSyncedCoordsRef.current = `${latValue},${lngValue}`;
            onLatitudeChangeRef.current(latValue);
            onLongitudeChangeRef.current(lngValue);
          }
        });
      };

      if (win.google?.maps) {
        initGoogleMap();
      } else if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.onload = initGoogleMap;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        document.head.appendChild(script);
      }
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    const initLeaflet = () => {
      const L = win.L;
      if (!L || !mapRef.current) return;
      const center: [number, number] = [lat, lng];
      const map = L.map(mapRef.current).setView(center, hasCoords ? 9 : 6);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      const leafletMarker = L.marker(center, { draggable: true }).addTo(map);
      bindMarker(leafletMarker);
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const latValue = e.latlng.lat.toFixed(6);
        const lngValue = e.latlng.lng.toFixed(6);
        leafletMarker.setLatLng?.(e.latlng);
        lastSyncedCoordsRef.current = `${latValue},${lngValue}`;
        onLatitudeChangeRef.current(latValue);
        onLongitudeChangeRef.current(lngValue);
      });
    };

    if (win.L) {
      initLeaflet();
    } else if (!document.getElementById("leaflet-script")) {
      const script = document.createElement("script");
      script.id = "leaflet-script";
      script.onload = initLeaflet;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(script);
    }
    // Map initializes once; coordinate updates are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!latitude || !longitude || !markerRef.current) return;
    const key = `${latitude},${longitude}`;
    if (lastSyncedCoordsRef.current === key) return;
    lastSyncedCoordsRef.current = key;
    updateMapViewOnly(latitude, longitude, 9);
  }, [latitude, longitude, updateMapViewOnly]);

  useEffect(() => {
    if (!showSuggestions || locationQuery.trim().length < 2) return;

    const timer = window.setTimeout(async () => {
      const results = await searchPlaces(locationQuery, { country, limit: 6 });
      setSuggestions(results);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [country, locationQuery, showSuggestions]);

  return (
    <div className="acc-field location-search-picker">
      <label className="acc-label" htmlFor="location-search-input">
        Search location
      </label>
      <div className="location-search-picker__row">
        <div className="location-search-picker__input-wrap">
          <MapPin size={16} />
          <input
            autoComplete="off"
            className="acc-input location-search-picker__input"
            id="location-search-input"
            onChange={(e) => {
              onLocationQueryChange(e.target.value);
              setShowSuggestions(true);
              setSearchError("");
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="e.g. Masai Mara National Reserve, Kenya"
            type="text"
            value={locationQuery}
          />
          {showSuggestions && suggestions.length > 0 ? (
            <ul className="location-search-picker__suggestions">
              {suggestions.map((item) => (
                <li key={`${item.lat}-${item.lng}-${item.label}`}>
                  <button onClick={() => applyResult(item)} type="button">
                    {item.shortLabel ?? item.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          className="acc-btn acc-btn--primary location-search-picker__search-btn"
          disabled={searching}
          onClick={() => void runSearch()}
          type="button"
        >
          {searching ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
          {searching ? "Searching…" : "Find on map"}
        </button>
      </div>
      <span className="acc-hint">
        {hint ?? "Type a park, city, or reserve name — no coordinates needed. Drag the pin to fine-tune."}
      </span>
      {searchError ? <p className="location-search-picker__error">{searchError}</p> : null}
      <div className="acc-map-picker" ref={mapRef} />
      {latitude && longitude ? (
        <p className="location-search-picker__coords">
          Located at {latitude}, {longitude}
        </p>
      ) : null}
    </div>
  );
}
