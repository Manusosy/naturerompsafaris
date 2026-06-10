export type GeocodeResult = {
  label: string;
  lat: string;
  lng: string;
  placeId?: string;
  shortLabel?: string;
  source?: "google" | "nominatim";
};

const COUNTRY_CODES: Record<string, string> = {
  kenya: "ke",
  tanzania: "tz",
};

const COUNTRY_NAMES: Record<string, string> = {
  kenya: "Kenya",
  tanzania: "Tanzania",
};

const KENYA_TANZANIA_COMPONENTS = "country:ke|country:tz";

type NominatimRow = {
  class?: string;
  display_name?: string;
  importance?: number;
  lat?: string;
  lon?: string;
  type?: string;
};

type ScoredGeocodeResult = GeocodeResult & { score?: number };

type GoogleAutocompletePrediction = {
  description?: string;
  place_id?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

function componentsForCountry(country?: string) {
  if (country === "kenya") return "country:ke";
  if (country === "tanzania") return "country:tz";
  return KENYA_TANZANIA_COMPONENTS;
}

function shortAddressLabel(label: string) {
  return label.split(",").slice(0, 3).join(", ").trim();
}

function normalizePlaceQuery(query: string) {
  return query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreNominatimRow(row: NominatimRow, query: string) {
  const name = String(row.display_name ?? "").toLowerCase();
  const normalizedQuery = normalizePlaceQuery(query);
  // Scale importance up so it has meaningful weight (usually 0.0 - 1.0)
  let score = Number(row.importance ?? 0) * 100;

  // Boost national parks and reserves heavily
  if (row.class === "boundary" && (row.type === "national_park" || row.type === "protected_area")) {
    score += 150;
  }
  
  // Boost physical features, mountains, and water bodies heavily
  if (
    row.class === "natural" || 
    row.class === "waterway" || 
    row.type === "peak" || 
    row.type === "volcano" || 
    row.type === "lake" || 
    row.type === "water" ||
    row.type === "mountain_range"
  ) {
    score += 150;
  }

  // Text-based boosting
  if (
    name.includes("national park") ||
    name.includes("national reserve") ||
    name.includes("game reserve") ||
    name.includes("conservation area") ||
    name.includes("mount ") ||
    name.includes("mountain") ||
    name.includes("lake ") ||
    name.includes("river ") ||
    name.includes("peak")
  ) {
    score += 60;
  }

  // Exact or strong query match
  if (normalizePlaceQuery(name).includes(normalizedQuery)) {
    score += 30;
  }
  if (normalizePlaceQuery(name) === normalizedQuery) {
    score += 50;
  }

  // Penalize businesses, establishments, and irrelevant features
  if (
    name.includes("university") ||
    name.includes("sewerage") ||
    name.includes("school") ||
    name.includes("hockey") ||
    name.includes("botanical garden") ||
    name.includes("lodge") ||
    name.includes("camp") ||
    name.includes("resort") ||
    name.includes("hotel") ||
    name.includes("safari club") ||
    name.includes("diocese") ||
    name.includes("church") ||
    name.includes("a.c.k") ||
    name.includes("ack")
  ) {
    score -= 300;
  }

  return score;
}

function buildSearchQueries(query: string, country?: string) {
  const trimmed = query.trim();
  const countryName = country ? COUNTRY_NAMES[country] : "";
  const queries = new Set<string>([trimmed]);

  if (countryName && !trimmed.toLowerCase().includes(countryName.toLowerCase())) {
    queries.add(`${trimmed}, ${countryName}`);
  }

  return [...queries];
}

function dedupeResults(results: ScoredGeocodeResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.placeId || `${result.lat}:${result.lng}` || result.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchGooglePlacesAutocomplete(
  query: string,
  apiKey: string,
  options?: { country?: string; limit?: number },
): Promise<ScoredGeocodeResult[]> {
  const params = new URLSearchParams({
    components: componentsForCountry(options?.country),
    input: query,
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
  );
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    predictions?: GoogleAutocompletePrediction[];
    status?: string;
  };

  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    return [];
  }

  const limit = options?.limit ?? 8;
  return (payload.predictions ?? []).slice(0, limit).map((prediction, index) => {
    const main = prediction.structured_formatting?.main_text ?? "";
    const secondary = prediction.structured_formatting?.secondary_text ?? "";
    const label = prediction.description ?? [main, secondary].filter(Boolean).join(", ");

    return {
      label,
      shortLabel: label,
      lat: "",
      lng: "",
      placeId: prediction.place_id,
      score: 100 - index,
      source: "google" as const,
    };
  });
}

async function searchGoogleGeocode(
  query: string,
  apiKey: string,
  country?: string,
  limit = 8,
): Promise<ScoredGeocodeResult[]> {
  const queries = buildSearchQueries(query, country);
  const rows: ScoredGeocodeResult[] = [];

  for (const candidate of queries) {
    const params = new URLSearchParams({
      address: candidate,
      key: apiKey,
    });
    const region = country ? COUNTRY_CODES[country] : "";
    if (region) params.set("region", region);

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    if (!response.ok) continue;

    const payload = (await response.json()) as {
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
        place_id?: string;
      }>;
      status?: string;
    };

    if (payload.status !== "OK" || !payload.results?.length) continue;

    payload.results.slice(0, limit).forEach((row, index) => {
      const lat = row.geometry?.location?.lat;
      const lng = row.geometry?.location?.lng;
      if (lat === undefined || lng === undefined) return;

      rows.push({
        label: String(row.formatted_address ?? candidate),
        shortLabel: shortAddressLabel(String(row.formatted_address ?? candidate)),
        lat: String(lat),
        lng: String(lng),
        placeId: row.place_id,
        score: 80 - index,
        source: "google",
      });
    });

    if (rows.length) break;
  }

  return rows;
}

async function searchNominatim(query: string, country?: string, limit = 8) {
  const params = new URLSearchParams({
    addressdetails: "0",
    format: "json",
    limit: String(limit),
    q: query,
  });

  const countryCode = country ? COUNTRY_CODES[country] : "ke,tz";
  params.set("countrycodes", countryCode);

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NatureRompSafaris/1.0 (admin portal geocoding)",
    },
  });

  if (!response.ok) return [];

  const rows = (await response.json()) as NominatimRow[];
  return rows
    .filter((row) => row.lat && row.lon && row.display_name)
    .map((row) => ({
      label: String(row.display_name),
      lat: String(row.lat),
      lng: String(row.lon),
      score: scoreNominatimRow(row, query),
      shortLabel: shortAddressLabel(String(row.display_name)),
      source: "nominatim" as const,
    }));
}

export async function resolvePlaceDetails(placeId: string, apiKey: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    fields: "formatted_address,geometry,name",
    key: apiKey,
    place_id: placeId,
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    result?: {
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
      name?: string;
    };
    status?: string;
  };

  if (payload.status !== "OK" || !payload.result?.geometry?.location) return null;

  const { lat, lng } = payload.result.geometry.location;
  const label = payload.result.formatted_address ?? payload.result.name ?? "";
  if (lat === undefined || lng === undefined || !label) return null;

  return {
    label,
    shortLabel: shortAddressLabel(label),
    lat: String(lat),
    lng: String(lng),
    placeId,
    source: "google",
  };
}

export function pickBestPlace(results: GeocodeResult[]) {
  return results[0] ?? null;
}

export async function resolvePlaces(
  query: string,
  options?: { country?: string; limit?: number; googleApiKey?: string },
) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = options?.limit ?? 8;

  if (options?.googleApiKey) {
    const autocompleteResults = await searchGooglePlacesAutocomplete(trimmed, options.googleApiKey, {
      country: options.country,
      limit,
    });
    if (autocompleteResults.length) {
      return dedupeResults(autocompleteResults).slice(0, limit);
    }

    const geocodeResults = await searchGoogleGeocode(trimmed, options.googleApiKey, options.country, limit);
    if (geocodeResults.length) {
      return dedupeResults(geocodeResults).slice(0, limit);
    }
  }

  const remoteResults: ScoredGeocodeResult[] = [];
  for (const candidate of buildSearchQueries(trimmed, options?.country)) {
    const nominatimResults = await searchNominatim(candidate, options?.country, limit);
    remoteResults.push(...nominatimResults);
    if (nominatimResults.some((item) => (item.score ?? 0) >= 60)) break;
  }

  return dedupeResults(remoteResults)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit)
    .map(({ label, lat, lng, shortLabel, source, placeId }) => ({
      label,
      lat,
      lng,
      shortLabel,
      source,
      placeId,
    }));
}

/** Client-side helper — calls the portal geocode API. */
export async function searchPlaces(
  query: string,
  options?: { country?: string; limit?: number },
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q: query.trim() });
  if (options?.country) params.set("country", options.country);
  if (options?.limit) params.set("limit", String(options.limit));

  const response = await fetch(`/api/portal/geocode?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { results?: GeocodeResult[] };
  return Array.isArray(payload.results) ? payload.results : [];
}

/** Resolve a Google place_id to coordinates and a formatted address. */
export async function fetchPlaceDetails(placeId: string): Promise<GeocodeResult | null> {
  const response = await fetch(`/api/portal/geocode?placeId=${encodeURIComponent(placeId)}`, {
    credentials: "include",
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { result?: GeocodeResult | null };
  return payload.result ?? null;
}

export function buildMapEmbedUrl(lat: string, lng: string, label?: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const query = label?.trim() || `${lat},${lng}`;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}&zoom=9`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=9&output=embed`;
}

export function googleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
}
