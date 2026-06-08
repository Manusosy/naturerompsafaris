import type { MetadataRoute } from "next";

import { getPayload } from "payload";

import configPromise from "@payload-config";
import { packages, posts, seoHubs, site } from "@/content/site";
import { fetchPublishedRoutes, mergeSitemapRoutes } from "@/lib/sitemap-data";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/safari-packages",
  "/trips",
  "/destinations",
  "/accommodations",
  "/blog",
  "/photo-gallery",
  "/contact",
];

const publishedWhere = { status: { equals: "published" } };

async function getCmsRoutes() {
  try {
    const payload = await getPayload({ config: configPromise });
    const [packageRoutes, postRoutes, destinationRoutes, tripRoutes, accommodationRoutes] =
      await Promise.all([
        fetchPublishedRoutes(payload, "packages", "/safari-packages", publishedWhere),
        fetchPublishedRoutes(payload, "posts", "/blog", publishedWhere),
        fetchPublishedRoutes(payload, "destinations", "/destinations", publishedWhere),
        fetchPublishedRoutes(payload, "trips", "/trips", publishedWhere),
        fetchPublishedRoutes(payload, "accommodations", "/accommodations", publishedWhere),
      ]);

    return mergeSitemapRoutes([
      ...packageRoutes,
      ...postRoutes,
      ...destinationRoutes,
      ...tripRoutes,
      ...accommodationRoutes,
    ]);
  } catch {
    return new Map<string, Date | undefined>();
  }
}

function routePriority(route: string): number {
  if (route === "/") return 1;
  if (route.includes("safari") || route.startsWith("/trips")) return 0.9;
  if (route.startsWith("/blog")) return 0.8;
  return 0.7;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cmsRoutes = await getCmsRoutes();
  const routeMap = mergeSitemapRoutes([
    ...STATIC_ROUTES.map((route) => ({ route })),
    ...seoHubs.map((item) => ({ route: `/${item.slug}` })),
    ...packages.map((item) => ({ route: `/safari-packages/${item.slug}` })),
    ...posts.map((item) => ({ route: `/blog/${item.slug}` })),
    ...Array.from(cmsRoutes.entries()).map(([route, lastModified]) => ({ route, lastModified })),
  ]);

  return Array.from(routeMap.entries())
    .filter(([route]) => !route.endsWith("/undefined"))
    .map(([route, lastModified]) => ({
      url: `${site.canonicalUrl}${route === "/" ? "" : route}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: routePriority(route),
    }));
}
