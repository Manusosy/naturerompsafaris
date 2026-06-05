import type { CollectionConfig } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "source", type: "text" },
    { name: "location", type: "text" },
    { name: "avatar", type: "upload", relationTo: "media" },
    { name: "quote", type: "textarea", required: true },
    { name: "rating", type: "number", min: 1, max: 5, defaultValue: 5 },
    { name: "featured", type: "checkbox", defaultValue: false },
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
