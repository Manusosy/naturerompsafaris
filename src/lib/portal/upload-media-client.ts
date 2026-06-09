"use client";

import { normalizeMediaUrl } from "@/lib/cms-media";
import { inferImageMimeType, sanitizeUploadFilename } from "@/lib/portal/media-upload";

export type PortalMediaUploadConfig = {
  clientUploadUrl: string;
  maxBytes: number;
  useClientBlobUpload: boolean;
};

export type PortalUploadedMedia = Record<string, unknown>;

async function readUploadConfig(): Promise<PortalMediaUploadConfig> {
  const response = await fetch("/api/portal/media", {
    credentials: "include",
    method: "GET",
  });
  const config = (await response.json().catch(() => null)) as PortalMediaUploadConfig | null;
  if (!response.ok || !config) {
    throw new Error("Could not load upload settings.");
  }
  return config;
}

async function uploadViaClientBlob({
  alt,
  caption,
  clientUploadUrl,
  file,
}: {
  alt: string;
  caption?: string;
  clientUploadUrl: string;
  file: File;
}) {
  const { upload } = await import("@vercel/blob/client");
  const storageFilename = sanitizeUploadFilename(file.name);
  const mimeType = inferImageMimeType(storageFilename, file.type);

  const blob = await upload(storageFilename, file, {
    access: "public",
    clientPayload: "media",
    contentType: mimeType,
    handleUploadUrl: clientUploadUrl,
  });

  const response = await fetch("/api/portal/media", {
    body: JSON.stringify({
      alt,
      blobUrl: blob.url,
      caption,
      filename: file.name,
      mimeType,
      pathname: blob.pathname,
      size: file.size,
    }),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return { file, response };
}

async function uploadViaFormData({
  alt,
  caption,
  file,
}: {
  alt: string;
  caption?: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("alt", alt);
  if (caption) formData.append("caption", caption);

  const response = await fetch("/api/portal/media", {
    body: formData,
    credentials: "include",
    method: "POST",
  });

  return { file, response };
}

export async function uploadPortalMediaFile({
  alt,
  caption,
  file,
  uploadConfig,
}: {
  alt: string;
  caption?: string;
  file: File;
  uploadConfig?: PortalMediaUploadConfig;
}) {
  const config = uploadConfig ?? (await readUploadConfig());

  if (file.size > config.maxBytes) {
    throw new Error(`${file.name}: File is too large (max ${Math.round(config.maxBytes / (1024 * 1024))}MB).`);
  }

  if (config.useClientBlobUpload) {
    return uploadViaClientBlob({
      alt,
      caption,
      clientUploadUrl: config.clientUploadUrl,
      file,
    });
  }

  return uploadViaFormData({ alt, caption, file });
}

export async function fetchPortalMediaUploadConfig() {
  return readUploadConfig();
}

export function parsePortalMediaUploadResponse(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const record = result as Record<string, unknown>;
  const results = Array.isArray(record.results) ? record.results : [];
  const first = results[0];
  return first && typeof first === "object" ? (first as PortalUploadedMedia) : null;
}

export function portalUploadedMediaToDoc(result: PortalUploadedMedia) {
  const sizes = result.sizes && typeof result.sizes === "object" ? (result.sizes as Record<string, unknown>) : {};
  const thumb = sizes.thumb && typeof sizes.thumb === "object" ? (sizes.thumb as Record<string, unknown>) : {};
  const card = sizes.card && typeof sizes.card === "object" ? (sizes.card as Record<string, unknown>) : {};

  const fallbackUrl = String(result.url ?? "");
  const thumbUrl = normalizeMediaUrl(String(thumb.url ?? card.url ?? fallbackUrl));
  const url = normalizeMediaUrl(String(card.url ?? fallbackUrl ?? thumb.url ?? ""));

  return {
    alt: String(result.alt ?? ""),
    caption: result.caption ? String(result.caption) : "",
    filename: String(result.filename ?? ""),
    id: String(result.id),
    thumbUrl,
    url,
    sizes: result.sizes,
  };
}
