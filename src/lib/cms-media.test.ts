import { describe, expect, it } from "vitest";

import { encodeMediaPath, normalizeMediaUrl } from "./cms-media";

describe("normalizeMediaUrl", () => {
  it("encodes spaces in local media paths", () => {
    expect(normalizeMediaUrl("/media/Olare Mara Tented Camp.webp")).toBe(
      "/media/Olare%20Mara%20Tented%20Camp.webp",
    );
  });

  it("maps api media paths to public media paths", () => {
    expect(normalizeMediaUrl("/api/media/file/blog1.webp")).toBe("/media/blog1.webp");
  });

  it("preserves external blob urls", () => {
    const blobUrl = "https://example.public.blob.vercel-storage.com/photo.webp";
    expect(normalizeMediaUrl(blobUrl)).toBe(blobUrl);
  });
});

describe("encodeMediaPath", () => {
  it("leaves already encoded segments unchanged", () => {
    expect(encodeMediaPath("/media/Olare%20Mara.webp")).toBe("/media/Olare%20Mara.webp");
  });
});
