export function defaultUploadAlt(file: File) {
  const base = file.name.replace(/\.[^.]+$/, "");
  const humanized = base.replace(/[-_]+/g, " ").trim();
  return humanized || file.name;
}

export function resolveUploadAlt(formAlt: string, file: File, fileCount: number) {
  const trimmed = formAlt.trim();
  if (fileCount === 1) return trimmed || defaultUploadAlt(file);
  return defaultUploadAlt(file);
}

export function normalizeMediaUrl(url: string) {
  if (!url) return url;

  let path = url;
  if (!url.startsWith("/")) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/api/media/file/") || parsed.pathname.startsWith("/media/")) {
        path = `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      path = url;
    }
  }

  // Convert any '/api/media/file/' prefix to '/media/'
  if (path.startsWith("/api/media/file/")) {
    path = path.replace("/api/media/file/", "/media/");
  }

  return path;
}

export function mediaUrl(value: unknown, fallback = "/assets/img/banner1.webp") {
  if (!value) return fallback;
  if (typeof value === "string") return normalizeMediaUrl(value) || fallback;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sizes = record.sizes && typeof record.sizes === "object" ? record.sizes as Record<string, unknown> : {};
    const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};
    if (typeof card.url === "string" && card.url) return normalizeMediaUrl(card.url);
    if (typeof record.url === "string" && record.url) return normalizeMediaUrl(record.url);
  }
  return fallback;
}

export function galleryItemImages(doc: Record<string, unknown>) {
  const fromGallery = Array.isArray(doc.images)
    ? doc.images.map((item) => mediaUrl(item, "")).filter(Boolean)
    : [];
  if (fromGallery.length) return fromGallery;

  const legacy = mediaUrl(doc.image, "");
  return legacy ? [legacy] : [];
}

export function mediaAlt(value: unknown, fallback: string) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.alt === "string" && record.alt) return record.alt;
    if (typeof record.filename === "string" && record.filename) return record.filename;
  }
  return fallback;
}

export function plainText(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, "").trim();
}
