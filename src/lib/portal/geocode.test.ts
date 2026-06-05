import { describe, expect, it } from "vitest";

import { buildMapEmbedUrl } from "./geocode";

describe("buildMapEmbedUrl", () => {
  it("builds a google maps query embed without an api key", () => {
    const url = buildMapEmbedUrl("-1.406108", "35.012092", "Masai Mara, Kenya");
    expect(url).toContain("maps.google.com/maps");
    expect(url).toContain(encodeURIComponent("Masai Mara, Kenya"));
  });
});
