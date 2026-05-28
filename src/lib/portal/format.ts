export function getValue(doc: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[part];
  }, doc);
}

export function formatValue(value: unknown) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
  }
  if (typeof value === "string") return value || "-";
  if (typeof value === "number") return value.toString();
  if (value && typeof value === "object" && "title" in value) {
    return String((value as { title?: unknown }).title ?? "-");
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "-");
  }
  return "-";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
