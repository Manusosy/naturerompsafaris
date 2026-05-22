import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "public/media",
    imageSizes: [
      { name: "card", width: 640, height: 420, position: "centre" },
      { name: "hero", width: 1600, height: 900, position: "centre" },
    ],
  },
  admin: {
    useAsTitle: "alt",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
