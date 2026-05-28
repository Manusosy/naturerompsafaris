import type { MetadataRoute } from "next";

import { getPayload } from "payload";

import configPromise from "@payload-config";
import { packages, posts, seoHubs, site } from "@/content/site";

async function getCmsRoutes() {
  try {
    const payload = await getPayload({ config: configPromise });
    const [cmsPackages, cmsPosts, destinations, trips] = await Promise.all([
      payload.find({
        collection: "packages" as never,
        limit: 100,
        overrideAccess: true,
        where: { status: { equals: "published" } } as never,
      }),
      payload.find({
        collection: "posts" as never,
        limit: 100,
        overrideAccess: true,
      }),
      payload.find({
        collection: "destinations" as never,
        limit: 100,
        overrideAccess: true,
      }),
      payload.find({
        collection: "trips" as never,
        limit: 100,
        overrideAccess: true,
        where: { status: { equals: "published" } } as never,
      }),
    ]);

    return [
      ...cmsPackages.docs.map((item) => `/safari-packages/${(item as { slug?: string }).slug}`),
      ...cmsPosts.docs.map((item) => `/blog/${(item as { slug?: string }).slug}`),
      ...destinations.docs.map((item) => `/destinations/${(item as { slug?: string }).slug}`),
      ...trips.docs.map((item) => `/trips/${(item as { slug?: string }).slug}`),
    ].filter((route) => !route.endsWith("/undefined"));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/about", "/safari-packages", "/blog", "/photo-gallery", "/contact"];
  const routes = [
    ...staticRoutes,
    ...seoHubs.map((item) => `/${item.slug}`),
    ...packages.map((item) => `/safari-packages/${item.slug}`),
    ...posts.map((item) => `/blog/${item.slug}`),
    ...(await getCmsRoutes()),
  ];

  return Array.from(new Set(routes)).map((route) => ({
    url: `${site.canonicalUrl}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.includes("safari") ? 0.9 : 0.7,
  }));
}
