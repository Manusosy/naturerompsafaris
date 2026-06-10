import fs from "fs/promises";
import path from "path";
import type { Payload } from "payload";
import sanitize from "sanitize-filename";
import { sanitizeFilename } from "payload/shared";

import {
  buildPortalMediaAssets,
  PORTAL_MEDIA_SIZES,
  type PortalMediaSizeName,
} from "@/lib/portal/media-image-probe";

import { toWebpStorageFilename } from "@/lib/portal/media-upload-utils";

const WEBP_MIME = "image/webp";

export type PortalBlobUploadPayload = {
  alt: string;
  blobUrl: string;
  caption?: string;
  filename: string;
  mimeType: string;
  pathname?: string;
  size: number;
};

export async function fetchBlobUploadBuffer(blobUrl: string) {
  const response = await fetch(blobUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not read uploaded file from storage (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("Uploaded file was empty.");
  }

  return {
    buffer,
    mimeType: response.headers.get("content-type") ?? "",
  };
}

function incrementFilename(name: string) {
  const extension = name.split(".").pop() ?? "webp";
  const baseFilename = sanitize(name.substring(0, name.lastIndexOf(".")) || name);
  const match = baseFilename.match(/(.*)-(\d+)$/);
  if (!match) {
    return `${baseFilename}-1.${extension}`;
  }
  return `${match[1]}-${Number(match[2]) + 1}.${extension}`;
}

async function filenameExists(payload: Payload, filename: string) {
  const existing = await payload.find({
    collection: "media",
    limit: 1,
    overrideAccess: true,
    where: {
      filename: {
        equals: filename,
      },
    },
  });

  return existing.totalDocs > 0;
}

async function resolveUniqueFilename(payload: Payload, desiredFilename: string) {
  let candidate = sanitizeFilename(desiredFilename);
  while (await filenameExists(payload, candidate)) {
    candidate = sanitizeFilename(incrementFilename(candidate));
  }
  return candidate;
}

async function storePortalMediaBuffer(filename: string, buffer: Buffer): Promise<StoredPortalMediaFile> {
  const safeFilename = sanitizeFilename(filename);
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const { put } = await import("@vercel/blob");
    const result = await put(safeFilename, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: WEBP_MIME,
      token,
    });

    return {
      filename: safeFilename,
      filesize: buffer.length,
      mimeType: WEBP_MIME,
      url: result.url,
    };
  }

  const staticDir = path.resolve(process.cwd(), "public/media");
  await fs.mkdir(staticDir, { recursive: true });
  await fs.writeFile(path.join(staticDir, safeFilename), buffer);

  return {
    filename: safeFilename,
    filesize: buffer.length,
    mimeType: WEBP_MIME,
    url: `/api/media/file/${safeFilename}`,
  };
}

type PortalSizeRecord = {
  filename: string | null;
  filesize: number | null;
  height: number | null;
  mimeType: string | null;
  url: string | null;
  width: number | null;
};

function emptyPortalSizeRecord(): PortalSizeRecord {
  return {
    filename: null,
    filesize: null,
    height: null,
    mimeType: null,
    url: null,
    width: null,
  };
}

export async function createPortalMediaRecord({
  alt,
  buffer,
  caption,
  filename,
  payload,
}: {
  alt: string;
  buffer: Buffer;
  caption?: string;
  filename: string;
  payload: Payload;
}) {
  const desiredFilename = toWebpStorageFilename(filename);
  const mainFilename = await resolveUniqueFilename(payload, desiredFilename);
  const outputBaseName = mainFilename.replace(/\.webp$/i, "");
  const assets = await buildPortalMediaAssets(buffer, outputBaseName);
  const main = await storePortalMediaBuffer(mainFilename, assets.mainBuffer);

  const sizes: Record<PortalMediaSizeName, PortalSizeRecord> = {
    thumb: emptyPortalSizeRecord(),
    card: emptyPortalSizeRecord(),
    hero: emptyPortalSizeRecord(),
  };

  for (const size of PORTAL_MEDIA_SIZES) {
    const variant = assets.sizes[size.name];
    if (!variant) continue;

    const stored = await storePortalMediaBuffer(variant.filename, variant.buffer);
    sizes[size.name] = {
      filename: stored.filename,
      filesize: stored.filesize,
      height: variant.height,
      mimeType: stored.mimeType,
      url: stored.url,
      width: variant.width,
    };
  }

  return payload.create({
    collection: "media",
    data: {
      alt: alt.trim() || filename,
      ...(caption ? { caption } : {}),
      filename: main.filename,
      filesize: main.filesize,
      focalX: 50,
      focalY: 50,
      height: assets.height,
      mimeType: main.mimeType,
      sizes,
      url: main.url,
      width: assets.width,
    },
    overrideAccess: true,
  });
}
