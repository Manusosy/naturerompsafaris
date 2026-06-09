import { describe, expect, it } from "vitest";

import { toPortalMediaOption } from "./media-option";

describe("toPortalMediaOption", () => {
  it("normalizes absolute payload media urls to local public paths", () => {
    const option = toPortalMediaOption({
      alt: "Amboseli trips",
      filename: "naturerompsafaris-amboseli-trips.webp",
      id: 42,
      sizes: {
        thumb: {
          url: "https://portal.kenyatanzaniasafariadventures.com/api/media/file/naturerompsafaris-amboseli-trips-320x220.webp",
        },
        card: {
          url: "https://portal.kenyatanzaniasafariadventures.com/api/media/file/naturerompsafaris-amboseli-trips-640x420.webp",
        },
      },
      url: "https://portal.kenyatanzaniasafariadventures.com/api/media/file/naturerompsafaris-amboseli-trips.webp",
    });

    expect(option.id).toBe("42");
    expect(option.thumbUrl).toBe("/media/naturerompsafaris-amboseli-trips-320x220.webp");
    expect(option.url).toBe("/media/naturerompsafaris-amboseli-trips-640x420.webp");
  });
});
