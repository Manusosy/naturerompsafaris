import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { NextResponse } from "next/server";
import { packages } from "@/content/site";

export async function GET() {
  const payload = await getPayload({ config: configPromise });
  
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

  let results = [];
  
  for (const dest of initialDestinations) {
    try {
      const existing = await payload.find({ collection: "destinations", where: { slug: { equals: dest.slug } } });
      if (existing.docs.length === 0) {
        await payload.create({ collection: "destinations", data: { ...dest, status: "published" } as any });
        results.push(`Created destination: ${dest.name}`);
      } else {
        results.push(`Destination exists: ${dest.name}`);
      }
    } catch (e: any) {
      results.push(`Error dest ${dest.name}: ${e.message}`);
    }
  }
  
  for (const pkg of packages) {
    try {
      const existing = await payload.find({ collection: "packages", where: { slug: { equals: pkg.slug } } });
      if (existing.docs.length === 0) {
        await payload.create({
          collection: "packages",
          data: {
            title: pkg.title,
            slug: pkg.slug,
            status: "published",
            category: "Kenya Safaris",
            duration: pkg.duration,
            excerpt: pkg.excerpt,
            destinationsText: pkg.destinations,
            packageGroup: "economy-private",
          } as any
        });
        results.push(`Created package: ${pkg.title}`);
      } else {
        results.push(`Package exists: ${pkg.title}`);
      }
    } catch (e: any) {
      results.push(`Error pkg ${pkg.title}: ${e.message}`);
    }
  }

  return NextResponse.json({ success: true, results });
}
