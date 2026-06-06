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

export function getTripDesignationLabel(input: {
  experienceTypes?: string[];
  packageTier?: string;
}) {
  if (input.packageTier && TRIP_TIER_LABELS[input.packageTier]) {
    return TRIP_TIER_LABELS[input.packageTier];
  }

  const firstExperience = Array.isArray(input.experienceTypes)
    ? input.experienceTypes.find((value) => TRIP_EXPERIENCE_LABELS[value])
    : undefined;

  if (firstExperience) {
    return TRIP_EXPERIENCE_LABELS[firstExperience];
  }

  return undefined;
}
