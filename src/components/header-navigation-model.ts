import type { PublicNavItem } from "@/lib/public-navigation";
import type { PublicDestinationNavItem } from "@/lib/public-destinations";

export type HeaderMenuVariant = "dynamic" | "mega" | "simple";

export type DestinationPreviewRow = {
  eyebrow: string;
  href: string;
  label: string;
};

const accommodationItems: PublicNavItem[] = [
  { label: "Kenya", href: "/accommodations?country=kenya" },
  { label: "Tanzania", href: "/accommodations?country=tanzania" },
];

function isZanzibarDestination(doc: PublicDestinationNavItem) {
  return (
    /zanzibar/i.test(doc.name) ||
    /zanzibar/i.test(doc.region) ||
    /zanzibar/i.test(doc.slug)
  );
}

export function buildDestinationPreviewByCountry(destinations: PublicDestinationNavItem[]) {
  const kenya = destinations.filter((doc) => doc.country === "kenya");
  const tanzania = destinations.filter((doc) => doc.country === "tanzania" && !isZanzibarDestination(doc));
  const zanzibar = destinations.filter(isZanzibarDestination);

  const toRows = (items: PublicDestinationNavItem[]): DestinationPreviewRow[] =>
    items.map((doc) => ({
      eyebrow: doc.region || (doc.country === "kenya" ? "Kenya" : "Tanzania"),
      href: `/destinations/${doc.slug}`,
      label: doc.name,
    }));

  const eastAfrica = destinations.filter(
    (doc) =>
      /east africa|combined/i.test(doc.region) ||
      /east africa|combined/i.test(doc.name),
  );

  return {
    EastAfrica: toRows(eastAfrica),
    Kenya: toRows(kenya),
    Tanzania: toRows(tanzania),
    Zanzibar: toRows(zanzibar),
  } satisfies Record<string, DestinationPreviewRow[]>;
}

const fallbackItems: Record<string, PublicNavItem> = {
  "About Us": { label: "About Us", href: "/about" },
  Blog: { label: "Blog", href: "/blog" },
  "Contact Us": { label: "Contact Us", href: "/contact" },
  Destinations: {
    label: "Destinations",
    href: "/destinations",
    items: [
      { label: "Kenya", href: "/destinations?country=Kenya" },
      { label: "Tanzania", href: "/destinations?country=Tanzania" },
      { label: "Zanzibar", href: "/destinations/zanzibar" },
    ],
  },
  Experiences: {
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
  "Safari Tours": {
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
};

function normalizeLabel(label: string) {
  const trimmed = label.trim();
  if (trimmed === "Contact") return "Contact Us";
  if (trimmed === "Blogs") return "Blog";
  return trimmed;
}

function cloneItem(item: PublicNavItem, label = item.label): PublicNavItem {
  return {
    ...item,
    label,
    items: item.items?.map((child) => ({ ...child })),
    megaColumns: item.megaColumns,
  };
}

function findItem(items: PublicNavItem[], label: string) {
  return items.find((item) => normalizeLabel(item.label).toLowerCase() === label.toLowerCase());
}

function itemOrFallback(items: PublicNavItem[], label: keyof typeof fallbackItems) {
  const item = findItem(items, label);
  return item ? cloneItem(item, label) : cloneItem(fallbackItems[label]);
}

export function getMenuVariant(label: string): HeaderMenuVariant {
  if (label === "Destinations") return "dynamic";
  return "simple";
}

export function buildHeaderNavigation(
  navItems: PublicNavItem[],
  destinations: PublicDestinationNavItem[] = [],
) {
  void destinations;

  return [
    itemOrFallback(navItems, "About Us"),
    itemOrFallback(navItems, "Destinations"),
    itemOrFallback(navItems, "Safari Tours"),
    itemOrFallback(navItems, "Experiences"),
    {
      label: "Accommodation",
      href: "/accommodations",
      items: accommodationItems.map((item) => ({ ...item })),
    },
    itemOrFallback(navItems, "Blog"),
    itemOrFallback(navItems, "Contact Us"),
  ];
}
