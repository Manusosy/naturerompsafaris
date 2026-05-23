import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "@/lib/access";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  upload: {
    staticDir: "public/media",
    imageSizes: [
      { name: "card", width: 640, height: 420, position: "centre" },
      { name: "hero", width: 1600, height: 900, position: "centre" },
    ],
  },
  admin: {
    useAsTitle: "alt",
    group: "Content",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
