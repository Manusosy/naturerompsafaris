import type { CollectionConfig } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

export const HomepageSlides: CollectionConfig = {
  slug: "homepage-slides",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "destinationFocus", "status", "sortOrder"],
    group: "Content",
    description: "Homepage hero slider content managed from the dashboard.",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "destinationFocus", type: "text", defaultValue: "Kenya & Tanzania" },
    { name: "ctaLabel", type: "text", defaultValue: "Plan My Safari" },
    { name: "ctaHref", type: "text", defaultValue: "/contact" },
    { name: "sortOrder", type: "number", defaultValue: 0 },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
  ],
};
