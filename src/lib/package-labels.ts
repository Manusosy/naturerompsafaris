export const PACKAGE_CATEGORY_FILTER_OPTIONS = [
  { label: "All Markets", value: "__all" },
  { label: "Kenya Safaris", value: "Kenya Safaris" },
  { label: "Tanzania Safaris", value: "Tanzania Safaris" },
  { label: "Zanzibar Holidays", value: "Zanzibar Holidays" },
  { label: "Kenya & Tanzania Combined", value: "Kenya Tanzania Combined Safaris" },
  { label: "Kenya Adventure", value: "Kenya Adventure Safaris" },
  { label: "Tanzania Adventure", value: "Tanzania Adventure Safaris" },
] as const;

export const PACKAGE_GROUP_FILTER_OPTIONS = [
  { label: "All Package Types", value: "__all" },
  { label: "Economy Private Safaris", value: "economy-private" },
  { label: "Group Joining Safaris", value: "group-joining" },
  { label: "Kenya Lodge Safaris", value: "kenya-lodge" },
  { label: "Kenya Fly In Safaris", value: "kenya-fly-in" },
  { label: "Tanzania Lodge Safaris", value: "tanzania-lodge" },
  { label: "Tanzania Budget Camping Safaris", value: "tanzania-budget-camping" },
  { label: "Kenya & Tanzania Lodge Safaris", value: "combined-lodge" },
  { label: "Combined Private Economy Safaris", value: "combined-private-economy" },
  { label: "Combined Group Joining Safaris", value: "combined-group-joining" },
  { label: "Combined Lodge Safari", value: "combined-lodge-safari" },
  { label: "Combined Budget Safari", value: "combined-budget" },
  { label: "Mount Kenya Climbing", value: "mount-kenya-climbing" },
  { label: "Mount Kilimanjaro Climbing", value: "kilimanjaro-climbing" },
  { label: "Nairobi Excursion", value: "nairobi-excursion" },
  { label: "Day Trips", value: "day-trips" },
  { label: "Beach Extension", value: "beach-extension" },
  { label: "4x4 Safaris", value: "4x4-safaris" },
  { label: "Short Safaris", value: "short-safaris" },
] as const;

export const PACKAGE_TIER_FILTER_OPTIONS = [
  { label: "All Tiers", value: "__all" },
  { label: "Budget", value: "budget" },
  { label: "Mid Range", value: "mid-range" },
  { label: "Luxury", value: "luxury" },
  { label: "High End", value: "high-end" },
] as const;

const GROUPS_BY_CATEGORY: Record<string, string[]> = {
  "Kenya Safaris": [
    "economy-private",
    "group-joining",
    "kenya-lodge",
    "kenya-fly-in",
    "beach-extension",
    "4x4-safaris",
    "short-safaris",
    "mount-kenya-climbing",
    "nairobi-excursion",
    "day-trips",
  ],
  "Tanzania Safaris": [
    "tanzania-lodge",
    "tanzania-budget-camping",
    "kilimanjaro-climbing",
    "beach-extension",
    "short-safaris",
    "day-trips",
    "economy-private",
    "group-joining",
  ],
  "Zanzibar Holidays": ["beach-extension"],
  "Kenya Tanzania Combined Safaris": [
    "combined-lodge",
    "combined-private-economy",
    "combined-group-joining",
    "combined-lodge-safari",
    "combined-budget",
  ],
  "Kenya Adventure Safaris": [
    "mount-kenya-climbing",
    "nairobi-excursion",
    "day-trips",
    "4x4-safaris",
    "short-safaris",
  ],
  "Tanzania Adventure Safaris": ["kilimanjaro-climbing", "day-trips", "4x4-safaris"],
};

export function packageGroupsForCategory(category: string) {
  if (!category || category === "__all") {
    return PACKAGE_GROUP_FILTER_OPTIONS;
  }

  const allowed = new Set(GROUPS_BY_CATEGORY[category] ?? []);
  return PACKAGE_GROUP_FILTER_OPTIONS.filter(
    (option) => option.value === "__all" || allowed.has(option.value),
  );
}

export function packageGroupLabel(value: string) {
  return PACKAGE_GROUP_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function packageTierLabel(value: string) {
  return PACKAGE_TIER_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function packageHeroCategoryKey(category: string) {
  if (!category || category === "__all") return "default";
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
