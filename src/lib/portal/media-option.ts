import { normalizeMediaUrl } from "@/lib/cms-media";

export type PortalMediaOption = {
  alt: string;
  caption?: string;
  filename: string;
  id: string;
  thumbUrl?: string;
  url: string;
};

export function toPortalMediaOption(doc: Record<string, unknown>): PortalMediaOption {
  const sizes = doc.sizes && typeof doc.sizes === "object" ? (doc.sizes as Record<string, unknown>) : {};
  const thumb = sizes.thumb && typeof sizes.thumb === "object" ? (sizes.thumb as Record<string, unknown>) : {};
  const card = sizes.card && typeof sizes.card === "object" ? (sizes.card as Record<string, unknown>) : {};
  const thumbUrl = normalizeMediaUrl(String(thumb.url ?? card.url ?? doc.thumbUrl ?? doc.url ?? ""));
  const url = normalizeMediaUrl(String(card.url ?? doc.url ?? thumb.url ?? ""));

  return {
    alt: String(doc.alt ?? ""),
    caption: doc.caption ? String(doc.caption) : undefined,
    filename: String(doc.filename ?? ""),
    id: String(doc.id),
    thumbUrl: thumbUrl || url,
    url: url || thumbUrl,
  };
}

export function dedupeMediaOptions(items: PortalMediaOption[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function optionImageUrl(option: PortalMediaOption) {
  return option.thumbUrl || option.url || "";
}
