import sharp from "sharp";

export const PORTAL_MEDIA_SIZES = [
  { name: "thumb", width: 320, height: 220, quality: 78 },
  { name: "card", width: 640, height: 420, quality: 82 },
  { name: "hero", width: 1600, height: 900, quality: 84 },
] as const;

export type PortalMediaSizeName = (typeof PORTAL_MEDIA_SIZES)[number]["name"];

export type PortalMediaVariant = {
  buffer: Buffer;
  filename: string;
  height: number;
  width: number;
};

export type PortalMediaAssets = {
  height: number;
  mainBuffer: Buffer;
  sizes: Partial<Record<PortalMediaSizeName, PortalMediaVariant>>;
  width: number;
};

function describeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "unknown error";
}

export function shouldGeneratePortalSize(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
) {
  return width >= targetWidth && height >= targetHeight;
}

export function portalSizeFilename(baseName: string, width: number, height: number) {
  return `${baseName}-${width}x${height}.webp`;
}

/**
 * Decodes an uploaded image and re-encodes it to a clean, metadata-stripped
 * WebP buffer for portal-managed storage and size generation.
 */
export async function normalizeImageToWebp(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer, { failOn: "none", limitInputPixels: false })
      .rotate()
      .toColorspace("srgb")
      .webp({ quality: 82 })
      .toBuffer();
  } catch (error) {
    throw new Error(`the image could not be processed (${describeError(error)}).`);
  }
}

export async function buildPortalMediaAssets(buffer: Buffer, outputBaseName: string): Promise<PortalMediaAssets> {
  const mainBuffer = await normalizeImageToWebp(buffer);
  const metadata = await sharp(mainBuffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error("image dimensions could not be determined; the file may be corrupt.");
  }

  const sizes: Partial<Record<PortalMediaSizeName, PortalMediaVariant>> = {};

  for (const size of PORTAL_MEDIA_SIZES) {
    if (!shouldGeneratePortalSize(width, height, size.width, size.height)) {
      continue;
    }

    try {
      const resized = await sharp(mainBuffer)
        .resize({
          fit: "cover",
          height: size.height,
          position: "centre",
          width: size.width,
          withoutEnlargement: true,
        })
        .webp({ quality: size.quality })
        .toBuffer();
      const resizedMeta = await sharp(resized).metadata();

      sizes[size.name] = {
        buffer: resized,
        filename: portalSizeFilename(outputBaseName, size.width, size.height),
        height: resizedMeta.height ?? size.height,
        width: resizedMeta.width ?? size.width,
      };
    } catch (error) {
      throw new Error(`the server could not generate the ${size.name} size (${describeError(error)}).`);
    }
  }

  return {
    height,
    mainBuffer,
    sizes,
    width,
  };
}
