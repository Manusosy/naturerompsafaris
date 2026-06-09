export const TRIP_TIER_LABELS: Record<string, string> = {
  budget: "Budget Safari",
  "mid-range": "Mid Range Safari",
  luxury: "Luxury Safari",
  "high-end": "High End Safari",
};

export const TRIP_EXPERIENCE_LABELS: Record<string, string> = {
  family: "Family Safari",
  honeymoon: "Honeymoon Safari",
  "group-joining": "Group Joining Safari",
  private: "Private Safari",
  "fly-in": "Fly-In Safari",
  "safari-beach": "Safari & Beach",
  "beach-extension": "Beach Extension",
  "mount-climbing": "Mount Climbing",
};

export const TRIP_TIER_FILTER_OPTIONS = [
  { label: "All Tiers", value: "__all" },
  { label: "Budget", value: "budget" },
  { label: "Mid Range", value: "mid-range" },
  { label: "Luxury", value: "luxury" },
  { label: "High End", value: "high-end" },
] as const;

export const TRIP_EXPERIENCE_FILTER_OPTIONS = [
  { label: "All Experiences", value: "__all" },
  { label: "Family Safaris", value: "family" },
  { label: "Honeymoon Safaris", value: "honeymoon" },
  { label: "Group Joining Safaris", value: "group-joining" },
  { label: "Private Safaris", value: "private" },
  { label: "Fly-In Safaris", value: "fly-in" },
  { label: "Safari & Beach Holidays", value: "safari-beach" },
  { label: "Beach Extensions", value: "beach-extension" },
  { label: "Mount Climbing", value: "mount-climbing" },
] as const;

export function formatExperienceLabel(value: string) {
  if (TRIP_EXPERIENCE_LABELS[value]) return TRIP_EXPERIENCE_LABELS[value];
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const TRIP_EXPERIENCE_PRESET_VALUES = TRIP_EXPERIENCE_FILTER_OPTIONS.filter(
  (option) => option.value !== "__all",
).map((option) => option.value);

export function parseCustomExperienceTypes(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  } catch {
    return [];
  }
}

export function mergeExperienceTypes(preset: unknown, customJson: unknown) {
  const presets = Array.isArray(preset) ? preset.map(String).filter(Boolean) : [];
  const custom = parseCustomExperienceTypes(customJson);
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of [...presets, ...custom]) {
    if (seen.has(value)) continue;
    seen.add(value);
    merged.push(value);
  }

  return merged;
}

export function splitExperienceTypes(all: string[]) {
  const presetSet = new Set<string>(TRIP_EXPERIENCE_PRESET_VALUES);
  return {
    custom: all.filter((value) => !presetSet.has(value)),
    preset: all.filter((value) => presetSet.has(value)),
  };
}

export function suggestTripHeroEyebrow(input: {
  experienceTypes?: string[];
  packageTier?: string;
}) {
  const parts: string[] = [];

  if (input.packageTier && TRIP_TIER_LABELS[input.packageTier]) {
    parts.push(TRIP_TIER_LABELS[input.packageTier].replace(/ Safari$/, ""));
  }

  const primaryExperience = Array.isArray(input.experienceTypes)
    ? input.experienceTypes.find((value) => value.trim())
    : undefined;

  if (primaryExperience) {
    const experienceLabel = formatExperienceLabel(primaryExperience)
      .replace(/ Holidays$/, "")
      .replace(/ Safari$/, "");
    if (!parts.some((part) => experienceLabel.toLowerCase().includes(part.toLowerCase()))) {
      parts.push(experienceLabel);
    }
  }

  if (!parts.length) return "";
  return parts.join(" ");
}

export const TIER_MATRIX_CLASS: Record<string, string> = {
  budget: "flash-trip__matrix--budget",
  "mid-range": "flash-trip__matrix--mid",
  luxury: "flash-trip__matrix--luxury",
  "high-end": "flash-trip__matrix--high-end",
};

export function normalizePackageTier(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const trimmed = value.trim();
  const slug = trimmed.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (TRIP_TIER_LABELS[slug]) return slug;

  const byLabel = TRIP_TIER_FILTER_OPTIONS.find(
    (option) =>
      option.value !== "__all" &&
      option.label.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0,
  );
  if (byLabel) return byLabel.value;

  return undefined;
}

export function resolveTripPackageTier(doc: Record<string, unknown>) {
  const direct = normalizePackageTier(doc.packageTier);
  if (direct) return direct;

  const linkedPackage = doc.package;
  if (linkedPackage && typeof linkedPackage === "object") {
    return normalizePackageTier((linkedPackage as Record<string, unknown>).packageTier);
  }

  return undefined;
}

export function getTripTierBadgeLabel(tier: string | undefined) {
  const normalized = normalizePackageTier(tier);
  if (!normalized) return undefined;
  return TRIP_TIER_LABELS[normalized];
}

/** Card/listing badge: package tier only (Budget, Mid Range, Luxury, High End). */
export function getTripDesignationLabel(input: {
  packageTier?: string;
}) {
  return getTripTierBadgeLabel(input.packageTier);
}
