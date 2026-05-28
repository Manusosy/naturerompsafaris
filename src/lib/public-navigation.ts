import configPromise from "@payload-config";
import { getPayload } from "payload";

import { navGroups } from "@/content/site";

export type PublicNavItem = {
  href: string;
  isPrimaryAction?: boolean;
  items?: PublicNavItem[];
  label: string;
};

export const fallbackNavigation: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  ...navGroups.map((group) => ({
    label: group.label,
    href: group.href,
    items: group.items.map(([label, href]) => ({ label, href })),
  })),
  { label: "Contact", href: "/contact" },
  { label: "Book Now", href: "/contact", isPrimaryAction: true },
];

const defaultNavigationDocs = [
  { label: "Home", customUrl: "/", sortOrder: 10 },
  { label: "About Us", customUrl: "/about", sortOrder: 20 },
  { label: "Kenya Safaris", customUrl: "/kenya-safaris", sortOrder: 30 },
  { label: "Tanzania Safaris", customUrl: "/tanzania-safaris", sortOrder: 40 },
  { label: "Kenya & Tanzania Safaris", customUrl: "/kenya-tanzania-combined-safaris", sortOrder: 50 },
  { label: "Contact", customUrl: "/contact", sortOrder: 60 },
  { label: "Book Now", customUrl: "/contact", sortOrder: 70, isPrimaryAction: true },
  ...navGroups.flatMap((group) =>
    group.items.map(([label, customUrl], index) => ({
      customUrl,
      label,
      parentLabel: group.label,
      sortOrder: (index + 1) * 10,
    })),
  ),
];

export async function ensureDefaultNavigation(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.count({
    collection: "navigation-items" as never,
    overrideAccess: true,
  });
  if (existing.totalDocs > 0) return;

  await Promise.all(
    defaultNavigationDocs.map((item) =>
      payload.create({
        collection: "navigation-items" as never,
        data: {
          ...item,
          linkType: "custom-url",
          visible: true,
        } as never,
        overrideAccess: true,
      }),
    ),
  );
}

function relationSlug(value: unknown) {
  if (value && typeof value === "object" && "slug" in value) {
    return String((value as { slug?: unknown }).slug ?? "");
  }
  return "";
}

function resolveHref(item: Record<string, unknown>) {
  const linkType = item.linkType;
  if (linkType === "destination") {
    const slug = relationSlug(item.destination);
    return slug ? `/destinations/${slug}` : String(item.customUrl ?? "#");
  }
  if (linkType === "trip") {
    const slug = relationSlug(item.trip);
    return slug ? `/trips/${slug}` : String(item.customUrl ?? "#");
  }
  if (linkType === "package") {
    const slug = relationSlug(item.package);
    return slug ? `/safari-packages/${slug}` : String(item.customUrl ?? "#");
  }
  return String(item.customUrl || "#");
}

export async function getPublicNavigation(): Promise<PublicNavItem[]> {
  try {
    const payload = await getPayload({ config: configPromise });
    await ensureDefaultNavigation(payload);
    const result = await payload.find({
      collection: "navigation-items" as never,
      depth: 1,
      limit: 100,
      overrideAccess: true,
      sort: "sortOrder",
      where: { visible: { equals: true } } as never,
    });
    const docs = result.docs as Array<Record<string, unknown>>;
    if (!docs.length) return fallbackNavigation;

    const topLevel = docs.filter((item) => !String(item.parentLabel ?? "").trim());
    const childrenByParent = new Map<string, PublicNavItem[]>();

    docs
      .filter((item) => String(item.parentLabel ?? "").trim())
      .forEach((item) => {
        const parentLabel = String(item.parentLabel ?? "").trim();
        const children = childrenByParent.get(parentLabel) ?? [];
        children.push({
          href: resolveHref(item),
          label: String(item.label ?? ""),
        });
        childrenByParent.set(parentLabel, children);
      });

    return topLevel.map((item) => {
      const label = String(item.label ?? "");
      return {
        href: resolveHref(item),
        isPrimaryAction: item.isPrimaryAction === true,
        items: childrenByParent.get(label),
        label,
      };
    });
  } catch {
    return fallbackNavigation;
  }
}
