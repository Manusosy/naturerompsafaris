import { NextResponse } from "next/server";

import { getPortalUser } from "@/lib/portal/data";
import { googleMapsApiKey, resolvePlaceDetails, resolvePlaces } from "@/lib/portal/geocode";

export async function GET(request: Request) {
  const user = await getPortalUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId")?.trim() ?? "";
  const query = url.searchParams.get("q")?.trim() ?? "";
  const country = url.searchParams.get("country")?.trim() || undefined;
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit") ?? "8") || 8));
  const apiKey = googleMapsApiKey();

  if (placeId) {
    if (!apiKey) {
      return NextResponse.json({ message: "Google Maps API key is not configured." }, { status: 503 });
    }

    try {
      const result = await resolvePlaceDetails(placeId, apiKey);
      return NextResponse.json({ result });
    } catch (error) {
      console.error("Portal place details failed", error);
      return NextResponse.json({ message: "Place lookup failed." }, { status: 500 });
    }
  }

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await resolvePlaces(query, {
      country,
      googleApiKey: apiKey || undefined,
      limit,
    });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Portal geocode failed", error);
    return NextResponse.json({ message: "Location search failed." }, { status: 500 });
  }
}
