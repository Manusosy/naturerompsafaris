export type TripPricingBasis = "per-person" | "per-person-sharing";

export function tripPricingBasisLabel(basis?: TripPricingBasis | string | null) {
  return basis === "per-person-sharing" ? "Per Person Sharing" : "Per Person";
}

function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function normalizeLegacyTripPrice(text: string) {
  const rangeMatch = text.match(
    /(?:estimated\s+)?([A-Z]{3})\s*\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)(?:\s*per\s+person(?:\s+sharing)?)?/i,
  );
  if (rangeMatch) {
    const basis = /sharing/i.test(text) ? "Per Person Sharing" : "Per Person";
    return `From ${rangeMatch[1].toUpperCase()} ${rangeMatch[2]}–${rangeMatch[3]} / ${basis}`;
  }

  const singleMatch = text.match(
    /(?:estimated\s+)?(?:from\s+)?([A-Z]{3})\s*\$?([\d,]+)(?:\s*per\s+person(?:\s+sharing)?)?/i,
  );
  if (singleMatch) {
    const basis = /sharing/i.test(text) ? "Per Person Sharing" : "Per Person";
    return `From ${singleMatch[1].toUpperCase()} ${singleMatch[2]} / ${basis}`;
  }

  return text;
}

export type TripPriceParts =
  | { kind: "quote"; label: string }
  | { kind: "priced"; amount: string; basis: string };

function parseLegacyTripPriceParts(text: string): TripPriceParts | null {
  const rangeMatch = text.match(
    /(?:estimated\s+)?([A-Z]{3})\s*\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)(?:\s*\/\s*|\s+)(per person(?: sharing)?)/i,
  );
  if (rangeMatch) {
    return {
      kind: "priced",
      amount: `${rangeMatch[1].toUpperCase()} ${rangeMatch[2]}–${rangeMatch[3]}`,
      basis: /sharing/i.test(rangeMatch[4]) ? "Per Person Sharing" : "Per Person",
    };
  }

  const singleMatch = text.match(
    /(?:estimated\s+)?(?:from\s+)?([A-Z]{3})\s*\$?([\d,]+)(?:\s*\/\s*|\s+)(per person(?: sharing)?)/i,
  );
  if (singleMatch) {
    return {
      kind: "priced",
      amount: `${singleMatch[1].toUpperCase()} ${singleMatch[2]}`,
      basis: /sharing/i.test(singleMatch[3]) ? "Per Person Sharing" : "Per Person",
    };
  }

  return null;
}

export function getTripPriceParts(input: {
  currency?: string | null;
  min?: number | null;
  max?: number | null;
  pricingBasis?: TripPricingBasis | string | null;
  displayText?: string | null;
  priceText?: string | null;
}): TripPriceParts {
  const currency = (input.currency || "USD").trim().toUpperCase();
  const basis = tripPricingBasisLabel(input.pricingBasis);
  const min = typeof input.min === "number" && !Number.isNaN(input.min) ? input.min : undefined;
  const max = typeof input.max === "number" && !Number.isNaN(input.max) ? input.max : undefined;

  if (min != null) {
    const amount =
      max != null && max !== min
        ? `${currency} ${formatMoney(min)}–${formatMoney(max)}`
        : `${currency} ${formatMoney(min)}`;
    return { kind: "priced", amount, basis };
  }

  const legacy = (input.displayText || input.priceText || "").trim();
  if (legacy) {
    const parsed = parseLegacyTripPriceParts(legacy);
    if (parsed) return parsed;
    return { kind: "quote", label: normalizeLegacyTripPrice(legacy) };
  }

  return { kind: "quote", label: "Price on request" };
}

export function formatTripPrice(input: {
  currency?: string | null;
  min?: number | null;
  max?: number | null;
  pricingBasis?: TripPricingBasis | string | null;
  displayText?: string | null;
  priceText?: string | null;
}) {
  const parts = getTripPriceParts(input);
  if (parts.kind === "quote") return parts.label;
  return `From ${parts.amount} / ${parts.basis}`;
}

export function buildTripBudgetPayload(input: {
  currency?: string;
  min?: number;
  max?: number;
  pricingBasis?: TripPricingBasis;
}) {
  const currency = input.currency?.trim() || "USD";
  const pricingBasis = input.pricingBasis || "per-person";
  const displayText = formatTripPrice({
    currency,
    max: input.max,
    min: input.min,
    pricingBasis,
  });

  return {
    currency,
    displayText: displayText === "Price on request" ? "" : displayText,
    max: input.max,
    min: input.min,
    pricingBasis,
  };
}
