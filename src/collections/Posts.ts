import type { CollectionConfig } from "payload";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "publishedAt"],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "category", type: "text", defaultValue: "Safari Guide" },
    { name: "publishedAt", type: "date" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "excerpt", type: "textarea", required: true },
    { name: "content", type: "richText" },
    { name: "metaTitle", type: "text" },
    { name: "metaDescription", type: "textarea" },
    { name: "keywords", type: "text" },
  ],
};
