import { NextResponse } from "next/server";

import { getPayloadClient, getPortalUser } from "@/lib/portal/data";
import { assertImageProcessable } from "@/lib/portal/media-image-probe";
import {
  createPortalMediaRecord,
  fetchBlobUploadBuffer,
  formatPortalUploadError,
  getPortalMediaUploadConfig,
  inferImageMimeType,
  sanitizeUploadFilename,
} from "@/lib/portal/media-upload";
import { canManagePortalCollection, isTrustedPortalOrigin } from "@/lib/portal/security";

export const maxDuration = 60;

type BlobUploadBody = {
  alt?: string;
  blobUrl?: string;
  caption?: string;
  filename?: string;
  mimeType?: string;
  pathname?: string;
  size?: number;
};

async function deleteOrphanBlob(blobUrl: string) {
  try {
    const { del } = await import("@vercel/blob");
    await del(blobUrl);
  } catch (error) {
    // Non-fatal: the media record was created successfully, this just leaves an
    // unreferenced source file in Blob storage.
    console.error("[portal/media] Failed to remove orphaned source blob:", error);
  }
}

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ message: "This action is not permitted." }, { status: 403 });
}

async function authorizePortalUpload(request: Request) {
  const user = await getPortalUser(request);
  if (!user) return "unauthorized" as const;
  if (!canManagePortalCollection(user, "media") || !isTrustedPortalOrigin(request)) {
    return "forbidden" as const;
  }
  return "ok" as const;
}

export async function GET(request: Request) {
  const auth = await authorizePortalUpload(request);
  if (auth === "unauthorized") return unauthorized();
  if (auth === "forbidden") return forbidden();

  return NextResponse.json(getPortalMediaUploadConfig(request.url));
}

export async function POST(request: Request) {
  const auth = await authorizePortalUpload(request);
  if (auth === "unauthorized") return unauthorized();
  if (auth === "forbidden") return forbidden();

  const contentType = request.headers.get("content-type") ?? "";
  const payload = await getPayloadClient();
  const uploadConfig = getPortalMediaUploadConfig(request.url);
  const results = [];
  const errors: string[] = [];

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as BlobUploadBody | null;
    if (!body?.blobUrl || !body.filename) {
      return NextResponse.json({ message: "Blob upload metadata is incomplete." }, { status: 400 });
    }

    const originalFilename = String(body.filename || "").trim() || "upload";
    const alt = String(body.alt || originalFilename).trim();
    const caption = String(body.caption || "").trim();
    // Prefer the exact key the browser uploaded to so the media record's
    // filename matches the existing blob and resolves to a valid URL.
    const filename = sanitizeUploadFilename(String(body.pathname || "").trim() || originalFilename);
    const mimeType = inferImageMimeType(filename, String(body.mimeType || ""));
    const declaredSize = Number(body.size || 0);

    if (declaredSize > uploadConfig.maxBytes) {
      return NextResponse.json(
        {
          message: `${originalFilename}: File is too large (max ${Math.round(uploadConfig.maxBytes / (1024 * 1024))}MB).`,
        },
        { status: 400 },
      );
    }

    try {
      const { buffer, mimeType: fetchedMimeType } = await fetchBlobUploadBuffer(body.blobUrl);
      if (buffer.length > uploadConfig.maxBytes) {
        errors.push(
          `${originalFilename}: File is too large (max ${Math.round(uploadConfig.maxBytes / (1024 * 1024))}MB).`,
        );
      } else {
        await assertImageProcessable(buffer);
        const resolvedMimeType = inferImageMimeType(filename, fetchedMimeType || mimeType);
        // WebP is already the target format: the browser uploaded the original to
        // Blob under a `.webp` key that matches Payload's output filename, so we
        // tell the storage adapter to skip re-uploading it. This keeps the WebP
        // file byte-for-byte unchanged. JPEG/PNG, however, are converted to WebP
        // by Payload and re-uploaded under the new `.webp` key, which leaves the
        // browser's original (non-webp) blob orphaned — we delete it afterwards.
        const isWebp = resolvedMimeType === "image/webp";
        const result = await createPortalMediaRecord({
          alreadyUploaded: isWebp,
          alt,
          buffer,
          caption,
          filename,
          mimeType: resolvedMimeType,
          payload,
          size: declaredSize || buffer.length,
        });
        results.push(result);
        if (!isWebp) {
          await deleteOrphanBlob(body.blobUrl);
        }
      }
    } catch (error: unknown) {
      console.error("[portal/media] Blob-backed upload failed:", error);
      errors.push(formatPortalUploadError(error, originalFilename));
    }
  } else {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ message: "No data received." }, { status: 400 });
    }

    const files = formData.getAll("file");
    if (files.length === 0) {
      return NextResponse.json({ message: "At least one image file is required." }, { status: 400 });
    }

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const alt = String(formData.get("alt") || file.name).trim();
      const caption = String(formData.get("caption") || "").trim();
      const filename = sanitizeUploadFilename(file.name);
      const mimeType = inferImageMimeType(filename, file.type);

      if (file.size > uploadConfig.maxBytes) {
        errors.push(`${file.name}: File is too large (max ${Math.round(uploadConfig.maxBytes / (1024 * 1024))}MB).`);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await assertImageProcessable(buffer);
        const result = await createPortalMediaRecord({
          alt,
          buffer,
          caption,
          filename,
          mimeType,
          payload,
          size: buffer.length,
        });
        results.push(result);
      } catch (error: unknown) {
        console.error("[portal/media] Direct upload failed:", error);
        errors.push(formatPortalUploadError(error, file.name));
      }
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return NextResponse.json({ message: `Upload failed: ${errors.join(", ")}` }, { status: 400 });
  }

  return NextResponse.json({
    results,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0 ? `Uploaded ${results.length} files with some errors.` : undefined,
  });
}
