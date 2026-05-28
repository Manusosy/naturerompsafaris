import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "../lib/access";

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
    adminThumbnail: "thumb",
    mimeTypes: ["image/*"],
    formatOptions: {
      format: "webp",
      options: {
        quality: 82,
      },
    },
    imageSizes: [
      {
        name: "thumb",
        width: 320,
        height: 220,
        position: "centre",
        formatOptions: { format: "webp", options: { quality: 78 } },
      },
      {
        name: "card",
        width: 640,
        height: 420,
        position: "centre",
        formatOptions: { format: "webp", options: { quality: 82 } },
      },
      {
        name: "hero",
        width: 1600,
        height: 900,
        position: "centre",
        formatOptions: { format: "webp", options: { quality: 84 } },
      },
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
    { name: "caption", type: "text" },
    { name: "seoTitle", label: "SEO title", type: "text" },
    { name: "seoDescription", label: "SEO description", type: "textarea" },
    { name: "credit", type: "text" },
    { name: "usageNotes", label: "Usage notes", type: "textarea" },
  ],
};
