import type { CollectionConfig } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

export const Gallery: CollectionConfig = {
  slug: "gallery",
  access: {
    read: publishedOrStaff,
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
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Legacy single image. Prefer the photo gallery below.",
        hidden: true,
      },
    },
    {
      name: "images",
      label: "Photos",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: {
        description: "Select one or more photos for this gallery entry.",
      },
    },
    { name: "alt", type: "text", required: true },
    { name: "featured", type: "checkbox", defaultValue: false },
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
