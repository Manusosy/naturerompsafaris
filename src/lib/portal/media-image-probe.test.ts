import { describe, expect, it } from "vitest";

import { shouldGeneratePortalSize } from "./media-image-probe";
import { toWebpStorageFilename } from "./media-upload";

describe("toWebpStorageFilename", () => {
  it("converts jpeg filenames to webp storage names", () => {
    expect(toWebpStorageFilename("Amboseli National Park.jpg")).toBe("Amboseli-National-Park.webp");
  });
});

describe("shouldGeneratePortalSize", () => {
  it("omits sizes when the source image is smaller than the target", () => {
    expect(shouldGeneratePortalSize(600, 400, 1600, 900)).toBe(false);
    expect(shouldGeneratePortalSize(800, 500, 640, 420)).toBe(true);
  });
});
