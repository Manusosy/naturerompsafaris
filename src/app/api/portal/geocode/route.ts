import { NextResponse } from "next/server";

import { getPortalUser } from "@/lib/portal/data";
import { resolvePlaces } from "@/lib/portal/geocode";

export async function GET(request: Request) {
  const user = await getPortalUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const country = url.searchParams.get("country")?.trim() || undefined;
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit") ?? "6") || 6));

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await resolvePlaces(query, {
      country,
      googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      limit,
    });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Portal geocode failed", error);
    return NextResponse.json({ message: "Location search failed." }, { status: 500 });
  }
}
