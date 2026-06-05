import { getPayload } from "payload";
import configPromise from "../src/payload.config";
import { packages } from "../src/content/site";
import { rawTrips } from "./trips-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function loadLocalEnv() {
    const envPath = path.resolve(dirname, "../.env.local");
    if (!fs.existsSync(envPath)) return;
    const env = fs.readFileSync(envPath, "utf8");
    for (const line of env.split(/\r?\n/)) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (!match) continue;
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value; // Force overwrite so it connects to Neon
    }
}

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

async function run() {
    console.log("Loading local environment variables...");
    loadLocalEnv();

    if (!process.env.DATABASE_URL) {
        console.error("Error: DATABASE_URL is not defined in .env.local");
        process.exit(1);
    }

    console.log("Initializing Payload...");
    const payload = await getPayload({ config: configPromise });

    console.log("Seeding Packages as DRAFT...");
    for (const pkg of packages) {
        try {
            console.log(`Checking package: ${pkg.title}`);
            const existing = await payload.find({
                collection: "packages",
                where: { slug: { equals: pkg.slug } },
                overrideAccess: true,
                limit: 1,
            });

            const packageData = {
                title: pkg.title,
                slug: pkg.slug,
                status: "draft" as const, // Force status as draft
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
                console.log(`Updated package as draft: ${pkg.title}`);
            } else {
                await payload.create({
                    collection: "packages",
                    data: packageData,
                    overrideAccess: true,
                });
                console.log(`Created package as draft: ${pkg.title}`);
            }
        } catch (e) {
            console.error(`Failed to seed package: ${pkg.title}`, e);
        }
    }

    console.log("Seeding Trips as DRAFT...");
    for (const trip of rawTrips) {
        try {
            console.log(`Checking trip: ${trip.title}`);
            const existing = await payload.find({
                collection: "trips",
                where: { slug: { equals: trip.slug } },
                overrideAccess: true,
                limit: 1,
            });

            const tripData = {
                title: trip.title,
                slug: trip.slug,
                status: "draft" as const, // Force status as draft
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
                console.log(`Updated trip as draft: ${trip.title}`);
            } else {
                await payload.create({
                    collection: "trips",
                    data: tripData,
                    overrideAccess: true,
                });
                console.log(`Created trip as draft: ${trip.title}`);
            }
        } catch (e) {
            console.error(`Failed to seed trip: ${trip.title}`, e);
        }
    }

    console.log("All packages and trips seeded/updated as DRAFT successfully!");
    process.exit(0);
}

run();
