import sanitize from "sanitize-filename";

const EXTENSION_MIME: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export type PortalMediaUploadConfig = {
  clientUploadUrl: string;
  maxBytes: number;
  useClientBlobUpload: boolean;
};

export function sanitizeUploadFilename(name: string) {
  const trimmed = name.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  const ext = dotIndex > 0 ? trimmed.slice(dotIndex).toLowerCase() : "";
  const base = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  const safeBase = base
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safeBase || "upload"}${ext}`;
}

export function toWebpStorageFilename(name: string) {
  const sanitized = sanitizeUploadFilename(name);
  const dotIndex = sanitized.lastIndexOf(".");
  const base = dotIndex > 0 ? sanitized.slice(0, dotIndex) : sanitized;
  return `${sanitize(base) || "upload"}.webp`;
}

export function inferImageMimeType(filename: string, fallbackType = "") {
  const normalizedFallback = fallbackType.trim().toLowerCase();
  if (normalizedFallback.startsWith("image/")) {
    return normalizedFallback;
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[ext] ?? "image/jpeg";
}

export function getPortalMediaUploadConfig(requestUrl: string): PortalMediaUploadConfig {
  const useClientBlobUpload = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const origin = new URL(requestUrl).origin;

  return {
    clientUploadUrl: `${origin}/api/vercel-blob-client-upload-route`,
    maxBytes: 10 * 1024 * 1024,
    useClientBlobUpload,
  };
}

function nestedErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const record = error as Record<string, unknown>;
  if (record.cause instanceof Error && record.cause.message) {
    return record.cause.message;
  }
  if (typeof record.cause === "string" && record.cause.trim()) {
    return record.cause;
  }

  if (Array.isArray(record.errors)) {
    const messages = record.errors
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const item = entry as Record<string, unknown>;
        return typeof item.message === "string" ? item.message : "";
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(", ");
  }

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .map((entry) => {
          if (!entry || typeof entry !== "object") return "";
          const item = entry as Record<string, unknown>;
          return typeof item.message === "string" ? item.message : "";
        })
        .filter(Boolean);
      if (messages.length > 0) return messages.join(", ");
    }
  }

  return undefined;
}

export function formatPortalUploadError(error: unknown, filename: string) {
  const fallback = error instanceof Error ? error.message : "Unknown error";
  const nested = nestedErrorMessage(error);
  const message = nested && nested !== fallback ? `${fallback}: ${nested}` : fallback;

  if (/problem while uploading the file/i.test(message)) {
    return `${filename}: Image processing failed. Try a JPG or PNG under 10MB, or re-export the photo without unusual metadata.`;
  }

  return `${filename}: ${message}`;
}
