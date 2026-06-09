import { getPayload } from "payload";
import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { packages as staticPackages } from "@/content/site";
import { rawTrips } from "../../../../scripts/trips-data";

const packageCategories = [
    "Kenya Safaris",
    "Tanzania Safaris",
    "Kenya Tanzania Combined Safaris",
    "Kenya Adventure Safaris",
    "Tanzania Adventure Safaris",
] as const;

const packageGroupsByTitle = new Map([
    ["6 Days Kenya Economy / Budget Safari", "economy-private"],
    ["Wild Wonders: 5-Day Private Safari Adventure", "4x4-safaris"],
    ["4 Days Amboseli, Tsavo West, Tsavo East & Mombasa", "beach-extension"],
    ["Ultimate 3-Day Maasai Mara Affordable Family Safari", "group-joining"],
    ["3 Days Amboseli Kilimanjaro Views & Safari", "short-safaris"],
    ["3 Days Amboseli to Tsavo West Safari Exploration", "short-safaris"],
]);

function normalizePackageCategory(category: string) {
    return packageCategories.find((item) => item === category) ?? "Kenya Safaris";
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== "DevelopmentDraftSeed2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const payload = await getPayload({ config: configPromise });
        const logs: string[] = [];

        logs.push("Seeding Packages as DRAFT...");

        try {
            await payload.updateGlobal({
                slug: "site-settings" as never,
                data: {
                    primaryEmail: "info@naturerompsafaris.com",
                    phone: "+254 722 714812 / +254 739 206698",
                    whatsapp: "+254 722 714812",
                },
                overrideAccess: true,
            });
            logs.push("Successfully updated site-settings.");
        } catch (e) {
            logs.push(`Failed to update site-settings: ${e}`);
        }

        for (const pkg of staticPackages) {
            const existing = await payload.find({
                collection: "packages",
                where: { slug: { equals: pkg.slug } },
                overrideAccess: true,
                limit: 1,
            });

            const packageData = {
                title: pkg.title,
                slug: pkg.slug,
                status: "draft" as const,
                category: normalizePackageCategory(pkg.category),
                duration: pkg.duration,
                excerpt: pkg.excerpt,
                destinationsText: pkg.destinations,
                packageGroup: packageGroupsByTitle.get(pkg.title) ?? "economy-private",
            };

            if (existing.docs.length > 0) {
                await payload.update({
                    collection: "packages",
                    id: existing.docs[0].id,
                    data: packageData,
                    overrideAccess: true,
                });
                logs.push(`Updated package: ${pkg.title}`);
            } else {
                await payload.create({
                    collection: "packages",
                    data: packageData,
                    overrideAccess: true,
                });
                logs.push(`Created package: ${pkg.title}`);
            }
        }

        logs.push("Seeding Trips as DRAFT...");
        for (const trip of rawTrips) {
            const existing = await payload.find({
                collection: "trips",
                where: { slug: { equals: trip.slug } },
                overrideAccess: true,
                limit: 1,
            });

            const tripData = {
                title: trip.title,
                slug: trip.slug,
                status: "draft" as const,
                availability: "available" as const,
                days: trip.days,
                nights: trip.nights,
                location: trip.location,
                startLocation: trip.startLocation,
                endLocation: trip.endLocation,
                overview: trip.overview,
                itineraryDays: trip.itineraryDays,
                included: trip.included.map(i => ({ item: i })),
                excluded: trip.excluded.map(i => ({ item: i })),
                priceSeasons: trip.priceSeasons,
            };

            if (existing.docs.length > 0) {
                await payload.update({
                    collection: "trips",
                    id: existing.docs[0].id,
                    data: tripData,
                    overrideAccess: true,
                });
                logs.push(`Updated trip: ${trip.title}`);
            } else {
                await payload.create({
                    collection: "trips",
                    data: tripData,
                    overrideAccess: true,
                });
                logs.push(`Created trip: ${trip.title}`);
            }
        }

        return NextResponse.json({ success: true, logs });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
