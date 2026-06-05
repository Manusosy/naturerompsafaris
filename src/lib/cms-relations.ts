export function relationName(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.title ?? record.label ?? "").trim();
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

export function formatPackageDestinations(item: unknown, fallback = "East Africa") {
  const record =
    item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  const text =
    typeof record.destinationsText === "string" ? record.destinationsText.trim() : "";
  if (text) return text;

  if (Array.isArray(record.destinations)) {
    const names = record.destinations.map(relationName).filter(Boolean);
    if (names.length) return names.join(", ");
  }

  const single = relationName(record.destinations);
  if (single) return single;

  return fallback;
}
