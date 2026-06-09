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

function encodePathSegment(segment: string) {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

export function encodeMediaPath(path: string) {
  const queryIndex = path.indexOf("?");
  const query = queryIndex >= 0 ? path.slice(queryIndex) : "";
  const pathname = queryIndex >= 0 ? path.slice(0, queryIndex) : path;
  const encoded = pathname
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodePathSegment(segment)))
    .join("/");
  return `${encoded}${query}`;
}

function isPayloadMediaPath(pathname: string) {
  return pathname.startsWith("/api/media/file/") || pathname.startsWith("/media/");
}

function toPublicMediaPath(pathname: string) {
  if (pathname.startsWith("/api/media/file/")) {
    return pathname.replace("/api/media/file/", "/media/");
  }
  return pathname;
}

export function normalizeMediaUrl(url: string) {
  if (!url) return url;

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (isPayloadMediaPath(parsed.pathname)) {
        // Payload prefixes media URLs with PAYLOAD_SERVER_URL. When developing
        // locally, those absolute URLs point at production while files live in
        // public/media on the dev server. Always serve them from the current
        // origin via /media/.
        return encodeMediaPath(toPublicMediaPath(parsed.pathname));
      }
    } catch {
      return url;
    }
    return url;
  }

  return encodeMediaPath(toPublicMediaPath(url));
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
