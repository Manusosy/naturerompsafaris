import type { MetadataRoute } from "next";

import { packages, posts, seoHubs, site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/about", "/safari-packages", "/blog", "/photo-gallery", "/contact"];
  const routes = [
    ...staticRoutes,
    ...seoHubs.map((item) => `/${item.slug}`),
    ...packages.map((item) => `/safari-packages/${item.slug}`),
    ...posts.map((item) => `/blog/${item.slug}`),
  ];

  return routes.map((route) => ({
    url: `${site.canonicalUrl}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.includes("safari") ? 0.9 : 0.7,
  }));
}
