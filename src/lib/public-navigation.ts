import configPromise from "@payload-config";
import { getPayload } from "payload";

export type MegaColumn = {
  heading: string;
  items: PublicNavItem[];
};

export type PublicNavItem = {
  href: string;
  isPrimaryAction?: boolean;
  items?: PublicNavItem[];
  label: string;
  megaColumns?: MegaColumn[];
};

export const fallbackNavigation: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Destinations",
    href: "/destinations",
    items: [
      { label: "Kenya", href: "/destinations?country=Kenya" },
      { label: "Tanzania", href: "/destinations?country=Tanzania" },
      { label: "Zanzibar", href: "/destinations/zanzibar" },
      { label: "East Africa / Combined Safaris", href: "/destinations?region=East%20Africa" },
    ],
  },
  {
    label: "Safari Tours",
    href: "/trips",
    items: [
      { label: "Kenya Safaris", href: "/safari-packages?category=Kenya%20Safaris" },
      { label: "Tanzania Safaris", href: "/safari-packages?category=Tanzania%20Safaris" },
      { label: "Kenya & Tanzania Safaris", href: "/safari-packages?category=Kenya%20Tanzania%20Combined%20Safaris" },
      { label: "Mount Kenya Climbing", href: "/safari-packages?group=mount-kenya-climbing" },
      { label: "Mount Kilimanjaro Climbing", href: "/safari-packages?group=kilimanjaro-climbing" },
      { label: "Safari & Beach Holidays", href: "/safari-packages?group=beach-extension" },
    ],
  },
  {
    label: "Packages",
    href: "/safari-packages",
    items: [
      { label: "Budget", href: "/safari-packages?tier=budget" },
      { label: "Mid Range", href: "/safari-packages?tier=mid-range" },
      { label: "Luxury", href: "/safari-packages?tier=luxury" },
      { label: "High End", href: "/safari-packages?tier=high-end" },
    ],
  },
  {
    label: "Experiences",
    href: "/safari-packages",
    items: [
      { label: "Family Safaris", href: "/safari-packages?experience=family" },
      { label: "Honeymoon Safaris", href: "/safari-packages?experience=honeymoon" },
      { label: "Group Joining Safaris", href: "/safari-packages?group=group-joining" },
      { label: "Private Safaris", href: "/safari-packages?experience=private" },
      { label: "Fly-In Safaris", href: "/safari-packages?group=kenya-fly-in" },
      { label: "Beach Extensions", href: "/safari-packages?group=beach-extension" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Request Quote", href: "/contact", isPrimaryAction: true },
];

const defaultNavigationDocs = [
  { label: "Home", customUrl: "/", sortOrder: 10 },
  { label: "About Us", customUrl: "/about", sortOrder: 20 },
  { label: "Destinations", customUrl: "/destinations", sortOrder: 30 },
  { label: "Kenya", customUrl: "/destinations?country=Kenya", parentLabel: "Destinations", sortOrder: 31 },
  { label: "Tanzania", customUrl: "/destinations?country=Tanzania", parentLabel: "Destinations", sortOrder: 32 },
  { label: "Zanzibar", customUrl: "/destinations/zanzibar", parentLabel: "Destinations", sortOrder: 33 },
  { label: "East Africa / Combined Safaris", customUrl: "/destinations?region=East%20Africa", parentLabel: "Destinations", sortOrder: 34 },
  { label: "Safari Tours", customUrl: "/trips", sortOrder: 40 },
  { label: "Kenya Safaris", customUrl: "/safari-packages?category=Kenya%20Safaris", parentLabel: "Safari Tours", sortOrder: 41 },
  { label: "Tanzania Safaris", customUrl: "/safari-packages?category=Tanzania%20Safaris", parentLabel: "Safari Tours", sortOrder: 42 },
  { label: "Kenya & Tanzania Safaris", customUrl: "/safari-packages?category=Kenya%20Tanzania%20Combined%20Safaris", parentLabel: "Safari Tours", sortOrder: 43 },
  { label: "Mount Kenya Climbing", customUrl: "/safari-packages?group=mount-kenya-climbing", parentLabel: "Safari Tours", sortOrder: 44 },
  { label: "Mount Kilimanjaro Climbing", customUrl: "/safari-packages?group=kilimanjaro-climbing", parentLabel: "Safari Tours", sortOrder: 45 },
  { label: "Safari & Beach Holidays", customUrl: "/safari-packages?group=beach-extension", parentLabel: "Safari Tours", sortOrder: 46 },
  { label: "Packages", customUrl: "/safari-packages", sortOrder: 50 },
  { label: "Budget", customUrl: "/safari-packages?tier=budget", parentLabel: "Packages", sortOrder: 51 },
  { label: "Mid Range", customUrl: "/safari-packages?tier=mid-range", parentLabel: "Packages", sortOrder: 52 },
  { label: "Luxury", customUrl: "/safari-packages?tier=luxury", parentLabel: "Packages", sortOrder: 53 },
  { label: "High End", customUrl: "/safari-packages?tier=high-end", parentLabel: "Packages", sortOrder: 54 },
  { label: "Experiences", customUrl: "/safari-packages", sortOrder: 60 },
  { label: "Family Safaris", customUrl: "/safari-packages?experience=family", parentLabel: "Experiences", sortOrder: 61 },
  { label: "Honeymoon Safaris", customUrl: "/safari-packages?experience=honeymoon", parentLabel: "Experiences", sortOrder: 62 },
  { label: "Group Joining Safaris", customUrl: "/safari-packages?group=group-joining", parentLabel: "Experiences", sortOrder: 63 },
  { label: "Private Safaris", customUrl: "/safari-packages?experience=private", parentLabel: "Experiences", sortOrder: 64 },
  { label: "Fly-In Safaris", customUrl: "/safari-packages?group=kenya-fly-in", parentLabel: "Experiences", sortOrder: 65 },
  { label: "Beach Extensions", customUrl: "/safari-packages?group=beach-extension", parentLabel: "Experiences", sortOrder: 66 },
  { label: "Blog", customUrl: "/blog", sortOrder: 75 },
  { label: "Contact", customUrl: "/contact", sortOrder: 80 },
  { label: "Request Quote", customUrl: "/contact", sortOrder: 90, isPrimaryAction: true },
];

const legacyDefaultNavigationKeys = new Set([
  "::Kenya Safaris",
  "Kenya Safaris::Mount Kenya Climbing",
  "Kenya Safaris::Nairobi Excursion",
  "Kenya Safaris::Day Trips",
  "Kenya Safaris::Economy Private Safaris",
  "Kenya Safaris::Group Joining Safaris",
  "Kenya Safaris::Kenya Lodge Safaris",
  "Kenya Safaris::Kenya Fly In Safaris",
  "Kenya Safaris::Beach Extension",
  "Kenya Safaris::4x4 Safaris",
  "Kenya Safaris::Short Safaris",
  "::Tanzania Safaris",
  "Tanzania Safaris::Mount Kilimanjaro Climbing",
  "Tanzania Safaris::Tanzania Lodge Safaris",
  "Tanzania Safaris::Tanzania Budget Camping Safaris",
  "::Kenya & Tanzania Safaris",
  "Kenya & Tanzania Safaris::Kenya & Tanzania Lodge Safaris",
  "Kenya & Tanzania Safaris::Private Economy Safaris",
  "Kenya & Tanzania Safaris::Group Joining Safaris",
  "Kenya & Tanzania Safaris::Combined Lodge Safari",
  "Kenya & Tanzania Safaris::Combined Budget Safari",
  "::Book Now",
]);

function defaultNavigationKey(item: { label: string; parentLabel?: string }) {
  return `${String(item.parentLabel ?? "")}::${item.label}`;
}

export async function ensureDefaultNavigation(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: "navigation-items" as never,
    limit: 100,
    overrideAccess: true,
  });
  const existingDocs = existing.docs as Array<Record<string, unknown>>;
  const existingByKey = new Map<string, Record<string, unknown>>();
  const duplicatesToDelete: string[] = [];

  for (const item of existingDocs) {
    const key = `${String(item.parentLabel ?? "")}::${String(item.label ?? "")}`;
    if (existingByKey.has(key)) {
      duplicatesToDelete.push(String(item.id));
    } else {
      existingByKey.set(key, item);
    }
  }

  // Delete duplicates if found
  if (duplicatesToDelete.length > 0) {
    await Promise.all(
      duplicatesToDelete.map((id) =>
        payload.delete({
          collection: "navigation-items" as never,
          id,
          overrideAccess: true,
        })
      )
    );
  }

  await Promise.all(
    defaultNavigationDocs
      .filter((item) => !existingByKey.has(defaultNavigationKey(item)))
      .map((item) =>
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

  await Promise.all(
    defaultNavigationDocs
      .filter((item) => existingByKey.has(defaultNavigationKey(item)))
      .map((item) => {
        const existingItem = existingByKey.get(defaultNavigationKey(item));
        const isPrimaryAction = item.isPrimaryAction === true;
        if (
          existingItem?.isPrimaryAction === isPrimaryAction &&
          existingItem?.sortOrder === item.sortOrder &&
          existingItem?.customUrl === item.customUrl
        ) {
          return Promise.resolve();
        }
        return payload.update({
          collection: "navigation-items" as never,
          data: {
            customUrl: item.customUrl,
            isPrimaryAction,
            linkType: "custom-url",
            sortOrder: item.sortOrder,
          } as never,
          id: String(existingItem?.id ?? ""),
          overrideAccess: true,
        });
      }),
  );

  await Promise.all(
    existingDocs
      .filter((item) => legacyDefaultNavigationKeys.has(defaultNavigationKey({
        label: String(item.label ?? ""),
        parentLabel: String(item.parentLabel ?? ""),
      })))
      .filter((item) => item.visible !== false)
      .map((item) =>
        payload.update({
          collection: "navigation-items" as never,
          data: { visible: false, isPrimaryAction: false } as never,
          id: String(item.id ?? ""),
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
    const result = await payload.find({
      collection: "navigation-items" as never,
      depth: 1,
      limit: 100,
      overrideAccess: true,
      sort: "sortOrder",
      where: { visible: { equals: true } } as never,
    });
    const rawDocs = result.docs as Array<Record<string, unknown>>;
    if (!rawDocs.length) return fallbackNavigation;

    // Extra layer of protection: deduplicate on the fly before sending to frontend
    const uniqueDocsMap = new Map<string, Record<string, unknown>>();
    for (const doc of rawDocs) {
      const key = `${String(doc.parentLabel ?? "").trim()}::${String(doc.label ?? "").trim()}`;
      if (!uniqueDocsMap.has(key)) {
        uniqueDocsMap.set(key, doc);
      }
    }
    const docs = Array.from(uniqueDocsMap.values());

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
