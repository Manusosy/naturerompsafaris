import { matchSafariPlaces, normalizePlaceQuery, type SafariPlace } from "./safari-places";

export type GeocodeResult = {
  label: string;
  lat: string;
  lng: string;
  shortLabel?: string;
  source?: "curated" | "google" | "nominatim";
};

const COUNTRY_CODES: Record<string, string> = {
  kenya: "ke",
  tanzania: "tz",
};

const COUNTRY_NAMES: Record<string, string> = {
  kenya: "Kenya",
  tanzania: "Tanzania",
};

type NominatimRow = {
  class?: string;
  display_name?: string;
  importance?: number;
  lat?: string;
  lon?: string;
  type?: string;
};

function toGeocodeResult(place: SafariPlace): GeocodeResult {
  return {
    label: place.label,
    lat: place.lat,
    lng: place.lng,
    shortLabel: place.label,
    source: "curated",
  };
}

function buildSearchQueries(query: string, country?: string) {
  const trimmed = query.trim();
  const countryName = country ? COUNTRY_NAMES[country] : "";
  const queries = new Set<string>([trimmed]);

  if (countryName && !trimmed.toLowerCase().includes(countryName.toLowerCase())) {
    queries.add(`${trimmed}, ${countryName}`);
  }

  if (!/national (park|reserve)/i.test(trimmed) && /mara|serengeti|amboseli|nakuru|ngorongoro|tarangire|manyara/i.test(trimmed)) {
    queries.add(`${trimmed} National Park, ${countryName || "Kenya"}`);
    queries.add(`${trimmed} National Reserve, ${countryName || "Kenya"}`);
  }

  return [...queries];
}

function scoreNominatimRow(row: NominatimRow, query: string) {
  const name = String(row.display_name ?? "").toLowerCase();
  const normalizedQuery = normalizePlaceQuery(query);
  let score = Number(row.importance ?? 0);

  if (row.class === "boundary" && (row.type === "national_park" || row.type === "protected_area")) {
    score += 80;
  }
  if (row.class === "natural" || row.type === "peak") score += 25;
  if (
    name.includes("national park") ||
    name.includes("national reserve") ||
    name.includes("game reserve") ||
    name.includes("conservation area")
  ) {
    score += 60;
  }
  if (normalizePlaceQuery(name).includes(normalizedQuery)) score += 30;

  if (
    name.includes("university") ||
    name.includes("sewerage") ||
    name.includes("school") ||
    name.includes("hockey") ||
    name.includes("botanical garden")
  ) {
    score -= 120;
  }

  return score;
}

function shortNominatimLabel(displayName: string) {
  return displayName.split(",").slice(0, 3).join(", ").trim();
}

async function searchNominatim(query: string, country?: string, limit = 8) {
  const params = new URLSearchParams({
    addressdetails: "0",
    format: "json",
    limit: String(limit),
    q: query,
  });

  const countryCode = country ? COUNTRY_CODES[country] : "";
  if (countryCode) params.set("countrycodes", countryCode);

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
      shortLabel: shortNominatimLabel(String(row.display_name)),
      source: "nominatim" as const,
    }));
}

async function searchGoogle(query: string, apiKey: string) {
  const params = new URLSearchParams({
    address: query,
    key: apiKey,
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }>;
    status?: string;
  };

  if (payload.status !== "OK" || !payload.results?.length) return [];

  return payload.results
    .filter((row) => row.geometry?.location?.lat !== undefined && row.geometry?.location?.lng !== undefined)
    .map((row, index) => ({
      label: String(row.formatted_address ?? query),
      lat: String(row.geometry!.location!.lat),
      lng: String(row.geometry!.location!.lng),
      score: 100 - index,
      shortLabel: shortNominatimLabel(String(row.formatted_address ?? query)),
      source: "google" as const,
    }));
}

function dedupeResults(results: Array<GeocodeResult & { score?: number }>) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.lat}:${result.lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  const limit = options?.limit ?? 6;
  const curated = matchSafariPlaces(trimmed, options?.country).map(toGeocodeResult);
  const queries = buildSearchQueries(trimmed, options?.country);

  const remoteResults: Array<GeocodeResult & { score?: number }> = [];

  if (options?.googleApiKey) {
    for (const candidate of queries) {
      const googleResults = await searchGoogle(candidate, options.googleApiKey);
      remoteResults.push(...googleResults);
      if (googleResults.length) break;
    }
  }

  if (!remoteResults.length) {
    for (const candidate of queries) {
      const nominatimResults = await searchNominatim(candidate, options?.country, limit);
      remoteResults.push(...nominatimResults);
      if (nominatimResults.some((item) => (item.score ?? 0) >= 60)) break;
    }
  }

  const rankedRemote = dedupeResults(remoteResults).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const combined = dedupeResults([
    ...curated.map((item) => ({ ...item, score: 200 })),
    ...rankedRemote,
  ]).slice(0, limit);

  return combined.map(({ label, lat, lng, shortLabel, source }) => ({
    label,
    lat,
    lng,
    shortLabel,
    source,
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

export function buildMapEmbedUrl(lat: string, lng: string, label?: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const query = label?.trim() || `${lat},${lng}`;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}&zoom=9`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=9&output=embed`;
}
