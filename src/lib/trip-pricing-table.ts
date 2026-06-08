import { TRIP_TIER_LABELS } from "@/lib/trip-labels";

export const DEFAULT_PARTY_COLUMNS = ["2–3 pax", "4–5 pax", "6+ pax"] as const;

export type PriceSeasonRow = {
  budgetText?: string;
  ctaLabel?: string;
  currency?: string;
  dateRange?: string;
  displayText?: string;
  max?: number;
  min?: number;
  notes?: string;
  packageLabel?: string;
  partySizeLabel?: string;
  seasonLabel?: string;
  tier?: string;
  title?: string;
};

export type PricingPackageRow = {
  dateRange: string;
  notes: string;
  prices: Record<string, string>;
  seasonLabel: string;
};

export type PricingPackage = {
  currency: string;
  id: string;
  packageLabel: string;
  rows: PricingPackageRow[];
  tier: string;
};

export type TierPriceMatrix = {
  columns: string[];
  currency: string;
  packageLabel: string;
  rows: Array<{
    ctaLabel: string;
    dateRange: string;
    notes: string;
    prices: Record<string, string>;
    seasonLabel: string;
  }>;
  tier: string;
};

function sortPartyColumns(columns: string[]) {
  const order = new Map(DEFAULT_PARTY_COLUMNS.map((label, index) => [label.toLowerCase(), index]));
  return [...columns].sort((left, right) => {
    const leftIndex = order.get(left.toLowerCase()) ?? 99;
    const rightIndex = order.get(right.toLowerCase()) ?? 99;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.localeCompare(right);
  });
}

export function formatMatrixPrice(currency: string, amount?: number) {
  if (!amount || Number.isNaN(amount)) return "—";
  return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function defaultPackageLabel(tier: string) {
  const tierLabel = TRIP_TIER_LABELS[tier] || tier;
  return `${tierLabel.replace(/ Safari$/, "")} Accommodations`;
}

export function priceSeasonsToPackages(seasons: PriceSeasonRow[]): PricingPackage[] {
  const grouped = new Map<string, PriceSeasonRow[]>();

  seasons.forEach((season) => {
    const tier = season.tier || "mid-range";
    const packageLabel = season.packageLabel?.trim() || defaultPackageLabel(tier);
    const key = `${tier}::${packageLabel}`;
    const bucket = grouped.get(key) || [];
    bucket.push(season);
    grouped.set(key, bucket);
  });

  return [...grouped.entries()].map(([key, items], index) => {
    const [tier, packageLabel] = key.split("::");
    const currency = items.find((item) => item.currency)?.currency || "USD";
    const rowMap = new Map<string, PricingPackageRow>();

    items.forEach((item) => {
      const seasonKey = `${item.seasonLabel || item.title || "Season"}::${item.dateRange || ""}`;
      const existing = rowMap.get(seasonKey) || {
        seasonLabel: item.seasonLabel || item.title || "",
        dateRange: item.dateRange || "",
        notes: item.notes || "",
        prices: {},
      };
      const party = item.partySizeLabel?.trim();
      if (party && typeof item.min === "number") {
        existing.prices[party] = String(item.min);
      }
      if (!existing.notes && item.notes) existing.notes = item.notes;
      rowMap.set(seasonKey, existing);
    });

    return {
      id: `package-${index}`,
      tier,
      packageLabel,
      currency,
      rows: [...rowMap.values()],
    };
  });
}

export function packagesToPriceSeasons(packages: PricingPackage[]): PriceSeasonRow[] {
  const output: PriceSeasonRow[] = [];

  packages.forEach((pkg) => {
    const tier = pkg.tier || "mid-range";
    const packageLabel = pkg.packageLabel.trim() || defaultPackageLabel(tier);
    const currency = pkg.currency.trim() || "USD";

    pkg.rows.forEach((row) => {
      const seasonLabel = row.seasonLabel.trim();
      if (!seasonLabel) return;

      const partyEntries = Object.entries(row.prices).filter(([, value]) => value.trim());
      if (!partyEntries.length) {
        output.push({
          tier,
          packageLabel,
          seasonLabel,
          title: seasonLabel,
          dateRange: row.dateRange.trim(),
          currency,
          notes: row.notes.trim(),
        });
        return;
      }

      partyEntries.forEach(([partySizeLabel, value]) => {
        const min = Number(value);
        output.push({
          tier,
          packageLabel,
          seasonLabel,
          title: seasonLabel,
          dateRange: row.dateRange.trim(),
          partySizeLabel,
          currency,
          min: Number.isFinite(min) ? min : undefined,
          max: Number.isFinite(min) ? min : undefined,
          displayText: Number.isFinite(min)
            ? `${currency} ${min.toLocaleString("en-US", { maximumFractionDigits: 0 })} (${partySizeLabel})`
            : undefined,
          notes: row.notes.trim(),
          ctaLabel: "Inquire",
        });
      });
    });
  });

  return output;
}

export function buildTierPriceMatrices(seasons: PriceSeasonRow[]): TierPriceMatrix[] {
  return priceSeasonsToPackages(seasons).map((pkg) => {
    const columns = sortPartyColumns(
      [...new Set(pkg.rows.flatMap((row) => Object.keys(row.prices).filter(Boolean)))],
    );
    const resolvedColumns = columns.length ? columns : [...DEFAULT_PARTY_COLUMNS];

    return {
      tier: pkg.tier,
      packageLabel: pkg.packageLabel,
      currency: pkg.currency,
      columns: resolvedColumns,
      rows: pkg.rows.map((row) => ({
        seasonLabel: row.seasonLabel,
        dateRange: row.dateRange,
        notes: row.notes,
        prices: resolvedColumns.reduce<Record<string, string>>((acc, column) => {
          acc[column] = row.prices[column] || "";
          return acc;
        }, {}),
        ctaLabel: "Inquire",
      })),
    };
  });
}

export function hasMatrixPricing(seasons?: PriceSeasonRow[]) {
  return Boolean(seasons?.some((item) => item.partySizeLabel?.trim()));
}

export function emptyPricingPackage(tier = "luxury"): PricingPackage {
  return {
    id: `package-${Date.now()}`,
    tier,
    packageLabel: defaultPackageLabel(tier),
    currency: "USD",
    rows: [
      {
        seasonLabel: "",
        dateRange: "",
        notes: "",
        prices: Object.fromEntries(DEFAULT_PARTY_COLUMNS.map((column) => [column, ""])),
      },
    ],
  };
}

export function emptyPricingPackageRow(): PricingPackageRow {
  return {
    seasonLabel: "",
    dateRange: "",
    notes: "",
    prices: Object.fromEntries(DEFAULT_PARTY_COLUMNS.map((column) => [column, ""])),
  };
}
