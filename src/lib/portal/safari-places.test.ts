import { describe, expect, it } from "vitest";

import { matchSafariPlaces } from "./safari-places";

describe("matchSafariPlaces", () => {
  it("matches Masai Mara National Reserve in Kenya", () => {
    const matches = matchSafariPlaces("Maasai Mara National Reserve", "kenya");
    expect(matches[0]?.label).toContain("Masai Mara");
  });

  it("matches Maasai Mara with country in the query", () => {
    const matches = matchSafariPlaces("Maasai Mara, Kenya", "kenya");
    expect(matches[0]?.label).toContain("Masai Mara");
  });

  it("matches Serengeti in Tanzania", () => {
    const matches = matchSafariPlaces("Serengeti", "tanzania");
    expect(matches[0]?.label).toContain("Serengeti");
  });
});
