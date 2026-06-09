import sharp from "sharp";

/**
 * Mirrors the image transforms Payload performs inside `generateFileData`
 * (auto-rotate, convert the main file to WebP, and generate each configured
 * size). Payload wraps ANY failure in those steps in a generic
 * "There was a problem while uploading the file" error and only writes the real
 * cause to `payload.logger`, which end users never see and which is effectively
 * invisible on serverless platforms. Running the same pipeline here lets us
 * surface the actual reason (corrupt bytes, unsupported color profile, sharp
 * platform issue, out-of-memory, etc.) directly to the uploader.
 *
 * Thrown messages intentionally OMIT the filename: the caller passes the error
 * through `formatPortalUploadError`, which is the single place responsible for
 * prefixing the filename. Including it here would duplicate it.
 *
 * Keep the operations in sync with `src/collections/Media.ts` `upload`.
 */
const MEDIA_SIZES = [
  { name: "thumb", width: 320, height: 220, quality: 78 },
  { name: "card", width: 640, height: 420, quality: 82 },
  { name: "hero", width: 1600, height: 900, quality: 84 },
] as const;

function describeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "unknown error";
}

export async function assertImageProcessable(buffer: Buffer) {
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (error) {
    throw new Error(`the file is not a readable image (${describeError(error)}).`);
  }

  if (!metadata.width || !metadata.height) {
    throw new Error("image dimensions could not be determined; the file may be corrupt.");
  }

  try {
    await sharp(buffer).rotate().toFormat("webp", { quality: 82 }).toBuffer();
  } catch (error) {
    throw new Error(`the server could not convert this image (${describeError(error)}).`);
  }

  for (const size of MEDIA_SIZES) {
    // Payload omits a size when the source is smaller than the target, so only
    // probe sizes the source can actually satisfy without enlargement.
    if (metadata.width < size.width || metadata.height < size.height) continue;
    try {
      await sharp(buffer)
        .rotate()
        .resize({ width: size.width, height: size.height, position: "centre" })
        .toFormat("webp", { quality: size.quality })
        .toBuffer();
    } catch (error) {
      throw new Error(`the server could not generate the ${size.name} size (${describeError(error)}).`);
    }
  }
}
