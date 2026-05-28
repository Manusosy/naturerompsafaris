import { getPayload } from "payload";
import configPromise from "../src/payload.config";
import { navGroups, packages } from "../src/content/site";
import { rawTrips } from "./trips-data";
import fs from "fs";
import path from "path";

const packageCategories = [
  "Kenya Safaris",
  "Tanzania Safaris",
  "Kenya Tanzania Combined Safaris",
  "Kenya Adventure Safaris",
  "Tanzania Adventure Safaris",
] as const;

const topNavigationItems = [
  { label: "Home", customUrl: "/", sortOrder: 10 },
  { label: "About Us", customUrl: "/about", sortOrder: 20 },
  { label: "Kenya Safaris", customUrl: "/kenya-safaris", sortOrder: 30 },
  { label: "Tanzania Safaris", customUrl: "/tanzania-safaris", sortOrder: 40 },
  { label: "Kenya & Tanzania Safaris", customUrl: "/kenya-tanzania-combined-safaris", sortOrder: 50 },
  { label: "Contact", customUrl: "/contact", sortOrder: 60 },
  { label: "Book Now", customUrl: "/contact", sortOrder: 70, isPrimaryAction: true },
];

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
  console.log("Initializing Payload...");
  const payload = await getPayload({ config: configPromise });

  console.log("Seeding Navigation...");
  for (const item of topNavigationItems) {
    const existing = await payload.find({
      collection: "navigation-items",
      limit: 1,
      overrideAccess: true,
      where: { label: { equals: item.label }, parentLabel: { exists: false } },
    });
    if (!existing.docs.length) {
      await payload.create({
        collection: "navigation-items",
        data: {
          ...item,
          linkType: "custom-url",
          visible: true,
        },
      });
    }
  }

  for (const group of navGroups) {
    for (const [index, [label, href]] of group.items.entries()) {
      const existing = await payload.find({
        collection: "navigation-items",
        limit: 1,
        overrideAccess: true,
        where: {
          label: { equals: label },
          parentLabel: { equals: group.label },
        },
      });
      if (!existing.docs.length) {
        await payload.create({
          collection: "navigation-items",
          data: {
            customUrl: href,
            label,
            linkType: "custom-url",
            parentLabel: group.label,
            sortOrder: (index + 1) * 10,
            visible: true,
          },
        });
      }
    }
  }

  console.log("Seeding Packages...");
  for (const pkg of packages) {
    try {
      console.log(`Creating package: ${pkg.title}`);
      await payload.create({
        collection: "packages",
        data: {
          title: pkg.title,
          slug: pkg.slug,
          status: "published",
          category: normalizePackageCategory(pkg.category),
          duration: pkg.duration,
          excerpt: pkg.excerpt,
          destinationsText: pkg.destinations,
          packageGroup: packageGroupsByTitle.get(pkg.title) ?? "economy-private",
        },
      });
      console.log(`Success: ${pkg.title}`);
    } catch (e) {
      console.error(`Failed to create package: ${pkg.title}`, e);
    }
  }

  console.log("Uploading media from public/assets/img/trips...");
  const tripsImgDir = path.resolve(__dirname, "../public/assets/img/trips");
  let imagesList: string[] = [];
  if (fs.existsSync(tripsImgDir)) {
    imagesList = fs
      .readdirSync(tripsImgDir)
      .filter((file) => file.endsWith(".jpeg") || file.endsWith(".jpg") || file.endsWith(".png"));
  }
  
  const uploadedMediaIds: string[] = [];
  for (const file of imagesList) {
    const filePath = path.join(tripsImgDir, file);
    try {
      const existingMedia = await payload.find({
        collection: 'media',
        where: {
          filename: { equals: file }
        },
        overrideAccess: true,
        limit: 1
      });
      if (existingMedia.docs.length > 0) {
        uploadedMediaIds.push(existingMedia.docs[0].id as string);
        continue;
      }
      const fileData = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: file.replace(/\.[^/.]+$/, "")
        },
        file: {
          data: fileData,
          mimetype: 'image/jpeg',
          name: file,
          size: stats.size
        },
        overrideAccess: true
      });
      uploadedMediaIds.push(mediaDoc.id as string);
      console.log(`Uploaded media: ${file}`);
    } catch (e) {
      console.error(`Failed to upload media ${file}:`, e);
    }
  }

  console.log("Seeding Destinations...");
  const initialDestinations = [
    { name: "Masai Mara National Reserve", slug: "masai-mara", country: "kenya", summary: "Kenya's most famous wildlife reserve, renowned for the Great Migration and dense big cat populations." },
    { name: "Serengeti National Park", slug: "serengeti", country: "tanzania", summary: "Tanzania's vast plains, home to the Great Wildebeest Migration and spectacular predator sightings." },
    { name: "Ngorongoro Crater", slug: "ngorongoro-crater", country: "tanzania", summary: "A breathtaking volcanic caldera boasting the highest density of wildlife in Africa." },
    { name: "Amboseli National Park", slug: "amboseli", country: "kenya", summary: "Famous for its large elephant herds and iconic backdrop of Mount Kilimanjaro." },
    { name: "Tsavo National Park", slug: "tsavo", country: "kenya", summary: "Kenya's largest park, known for its rugged landscapes, red elephants, and untamed wilderness." },
    { name: "Lake Nakuru National Park", slug: "lake-nakuru", country: "kenya", summary: "A premier destination for bird watching and rhino conservation." },
    { name: "Mount Kilimanjaro", slug: "mount-kilimanjaro", country: "tanzania", summary: "Africa's highest peak, offering unparalleled climbing adventures." },
    { name: "Mount Kenya", slug: "mount-kenya", country: "kenya", summary: "Kenya's dramatic stratovolcano featuring rugged peaks, alpine valleys, and diverse wildlife." },
  ];

  for (const dest of initialDestinations) {
    try {
      const existing = await payload.find({
        collection: "destinations",
        where: { slug: { equals: dest.slug } },
        overrideAccess: true,
        limit: 1
      });
      if (existing.docs.length > 0) {
        await payload.update({
          collection: "destinations",
          id: existing.docs[0].id,
          data: { ...dest, status: "published" },
          overrideAccess: true
        });
        console.log(`Updated destination: ${dest.name}`);
      } else {
        await payload.create({
          collection: "destinations",
          data: { ...dest, status: "published" },
          overrideAccess: true
        });
        console.log(`Created destination: ${dest.name}`);
      }
    } catch (e) {
      console.error(`Failed to seed destination: ${dest.name}`, e);
    }
  }

  console.log("Seeding Trips...");
  for (const trip of rawTrips) {
    try {
      const existing = await payload.find({
        collection: "trips",
        where: { slug: { equals: trip.slug } },
        overrideAccess: true,
        limit: 1
      });

      // Use a couple of random images for the gallery
      const gallery = uploadedMediaIds.length > 0 
        ? [
            { image: uploadedMediaIds[Math.floor(Math.random() * uploadedMediaIds.length)], alt: trip.title },
            { image: uploadedMediaIds[Math.floor(Math.random() * uploadedMediaIds.length)], alt: trip.title + " view" }
          ]
        : [];

      const tripData = {
        title: trip.title,
        slug: trip.slug,
        status: "published" as const,
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
        gallery: gallery,
      };

      if (existing.docs.length > 0) {
        await payload.update({
          collection: "trips",
          id: existing.docs[0].id,
          data: tripData,
          overrideAccess: true
        });
        console.log(`Updated trip: ${trip.title}`);
      } else {
        await payload.create({
          collection: "trips",
          data: tripData,
          overrideAccess: true
        });
        console.log(`Created trip: ${trip.title}`);
      }
    } catch (e) {
      console.error(`Failed to seed trip: ${trip.title}`, e);
    }
  }

  console.log("Trip Seeding complete!");
  process.exit(0);
}

run();
