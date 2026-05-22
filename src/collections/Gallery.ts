import type { CollectionConfig } from "payload";

export const Gallery: CollectionConfig = {
  slug: "gallery",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "sortOrder"],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "category", type: "text", defaultValue: "Safari Moments" },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "alt", type: "text", required: true },
    { name: "sortOrder", type: "number", defaultValue: 0 },
  ],
};
