import { TRIP_TIER_LABELS } from "@/lib/trip-labels";

export const DEFAULT_PARTY_COLUMNS = ["2–3 pax", "4–5 pax", "6+ pax"] as const;

export const PRICING_TIER_ORDER = ["budget", "mid-range", "luxury", "high-end"] as const;

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

function tierRank(tier: string) {
  const index = PRICING_TIER_ORDER.indexOf(tier as (typeof PRICING_TIER_ORDER)[number]);
  return index === -1 ? 99 : index;
}

function collectPackagePrices(pkg: PricingPackage, rowFilter?: (row: PricingPackageRow) => boolean) {
  const values: number[] = [];
  for (const row of pkg.rows) {
    if (rowFilter && !rowFilter(row)) continue;
    for (const column of DEFAULT_PARTY_COLUMNS) {
      const raw = String(row.prices[column] ?? "").replace(/,/g, "").trim();
      if (!raw) continue;
      const amount = Number(raw);
      if (Number.isFinite(amount) && amount > 0) values.push(amount);
    }
  }
  return values;
}

const MONTH_LOOKUP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function parseMonthToken(token: string) {
  const normalized = token.trim().toLowerCase().replace(/\./g, "");
  if (!normalized) return undefined;
  return MONTH_LOOKUP[normalized] ?? MONTH_LOOKUP[normalized.slice(0, 3)];
}

export function parseSeasonRange(row: Pick<PricingPackageRow, "dateRange" | "seasonLabel">) {
  const source = row.dateRange.trim() || row.seasonLabel.trim();
  if (!source) return null;

  const rangeMatch = source.match(/([A-Za-z]+)\s*(?:to|–|-|—)\s*([A-Za-z]+)/i);
  if (rangeMatch) {
    const start = parseMonthToken(rangeMatch[1]);
    const end = parseMonthToken(rangeMatch[2]);
    if (start && end) return { start, end, label: source };
  }

  const single = parseMonthToken(source);
  if (single) return { start: single, end: single, label: source };

  return null;
}

function monthInSeasonRange(month: number, start: number, end: number) {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

function seasonRowMatchesMonth(row: PricingPackageRow, month: number) {
  const range = parseSeasonRange(row);
  if (!range) return false;
  return monthInSeasonRange(month, range.start, range.end);
}

/** True when the row's date range covers the month in `date` (defaults to today). */
export function isCurrentSeasonRow(row: PricingPackageRow, date = new Date()) {
  return seasonRowMatchesMonth(row, date.getMonth() + 1);
}

function budgetRangeFromTierPrices(pricesByTier: Map<string, number[]>) {
  const tiersPresent = [...pricesByTier.keys()].sort((left, right) => tierRank(left) - tierRank(right));
  if (!tiersPresent.length) return { min: undefined, max: undefined };

  const lowestTierPrices = pricesByTier.get(tiersPresent[0]) ?? [];
  const highestTierPrices = pricesByTier.get(tiersPresent[tiersPresent.length - 1]) ?? [];

  return {
    min: lowestTierPrices.length ? Math.min(...lowestTierPrices) : undefined,
    max: highestTierPrices.length ? Math.max(...highestTierPrices) : undefined,
  };
}

function collectTierPrices(
  packages: PricingPackage[],
  rowFilter?: (row: PricingPackageRow) => boolean,
) {
  const pricesByTier = new Map<string, number[]>();

  for (const pkg of packages) {
    const prices = collectPackagePrices(pkg, rowFilter);
    if (!prices.length) continue;
    const tier = pkg.tier || "mid-range";
    const bucket = pricesByTier.get(tier) ?? [];
    bucket.push(...prices);
    pricesByTier.set(tier, bucket);
  }

  return pricesByTier;
}

function findSeasonLabel(packages: PricingPackage[], month: number) {
  for (const pkg of packages) {
    for (const row of pkg.rows) {
      if (!seasonRowMatchesMonth(row, month)) continue;
      const label = row.seasonLabel.trim() || row.dateRange.trim();
      if (label) return label;
    }
  }
  return undefined;
}

export type PricingBudgetRange = {
  max?: number;
  min?: number;
  seasonLabel?: string;
  usesSeason: boolean;
};

/** Lowest/highest tier prices, optionally limited to the season that contains `date`. */
export function budgetRangeFromPackages(
  packages: PricingPackage[],
  options?: { date?: Date },
): PricingBudgetRange {
  const date = options?.date ?? new Date();
  const month = date.getMonth() + 1;
  const seasonalTiers = collectTierPrices(packages, (row) => seasonRowMatchesMonth(row, month));
  const seasonalRange = budgetRangeFromTierPrices(seasonalTiers);

  if (seasonalRange.min !== undefined || seasonalRange.max !== undefined) {
    return {
      ...seasonalRange,
      seasonLabel: findSeasonLabel(packages, month),
      usesSeason: true,
    };
  }

  const allSeasonTiers = collectTierPrices(packages);
  const fallbackRange = budgetRangeFromTierPrices(allSeasonTiers);
  return {
    ...fallbackRange,
    usesSeason: false,
  };
}
