import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "@/lib/access";

export const Gallery: CollectionConfig = {
  slug: "gallery",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "sortOrder"],
    group: "Content",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "category", type: "text", defaultValue: "Safari Moments" },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "alt", type: "text", required: true },
    { name: "sortOrder", type: "number", defaultValue: 0 },
  ],
};
