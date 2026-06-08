import type { Payload, Where } from "payload";

type DocWithSlug = {
  slug?: string;
  updatedAt?: string;
  publishedAt?: string;
};

function docLastModified(doc: DocWithSlug): Date | undefined {
  const raw = doc.updatedAt || doc.publishedAt;
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function fetchPublishedRoutes(
  payload: Payload,
  collection: string,
  pathPrefix: string,
  where?: Where,
): Promise<Array<{ route: string; lastModified?: Date }>> {
  const entries: Array<{ route: string; lastModified?: Date }> = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: collection as never,
      where: where as never,
      limit: 250,
      page,
      overrideAccess: true,
      depth: 0,
    });

    for (const doc of result.docs as DocWithSlug[]) {
      if (!doc.slug) continue;
      entries.push({
        route: `${pathPrefix}/${doc.slug}`,
        lastModified: docLastModified(doc),
      });
    }

    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return entries;
}

export function mergeSitemapRoutes(
  entries: Array<{ route: string; lastModified?: Date }>,
): Map<string, Date | undefined> {
  const routes = new Map<string, Date | undefined>();

  for (const entry of entries) {
    const existing = routes.get(entry.route);
    if (!existing && entry.lastModified) {
      routes.set(entry.route, entry.lastModified);
    } else if (entry.lastModified && existing && entry.lastModified > existing) {
      routes.set(entry.route, entry.lastModified);
    } else if (!routes.has(entry.route)) {
      routes.set(entry.route, entry.lastModified);
    }
  }

  return routes;
}
