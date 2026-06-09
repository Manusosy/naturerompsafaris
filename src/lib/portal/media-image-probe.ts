import sharp from "sharp";

function describeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "unknown error";
}

/**
 * Decodes an uploaded image and re-encodes it to a clean, metadata-stripped
 * WebP buffer that is then handed to Payload for storage and size generation.
 *
 * Why this exists:
 * - Payload's upload pipeline (`generateFileData`) wraps ANY processing failure
 *   in a generic "There was a problem while uploading the file" error and only
 *   writes the real cause to `payload.logger`, which is effectively invisible on
 *   serverless platforms. Users just see "Image processing failed".
 * - Some images (notably WhatsApp/phone exports) carry unusual ICC profiles,
 *   EXIF, or encodings that decode fine on one platform/sharp build but trip a
 *   specific code path on another (e.g. Vercel's Linux runtime). Re-encoding to
 *   a normalized WebP up front sidesteps those edge cases so Payload processes a
 *   predictable input.
 * - If the image genuinely cannot be decoded, this throws with the REAL reason
 *   instead of the opaque generic message.
 *
 * `.rotate()` with no arguments bakes EXIF orientation into the pixels so the
 * normalized image still looks correct after its metadata is dropped. The
 * resulting WebP quality matches `formatOptions` in `src/collections/Media.ts`.
 *
 * Note: for already-WebP uploads in production the SERVED file is still the
 * browser's untouched original (the storage adapter skips re-uploading it); this
 * normalized buffer is only used by Payload to generate the resized variants.
 */
export async function normalizeImageToWebp(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer, { failOn: "none" })
      .rotate()
      .webp({ quality: 82 })
      .toBuffer();
  } catch (error) {
    throw new Error(`the image could not be processed (${describeError(error)}).`);
  }
}
