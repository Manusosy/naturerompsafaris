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
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Legacy single image. Prefer the gallery below for multiple backgrounds.",
        hidden: true,
      },
    },
    {
      name: "images",
      label: "Hero images",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: {
        description: "Add one or more background images. They crossfade at the interval below.",
      },
    },
    {
      name: "slideIntervalSeconds",
      label: "Slide interval (seconds)",
      type: "number",
      defaultValue: 6,
      min: 3,
      max: 30,
      admin: {
        description: "How long each image shows before the next one, and how long this hero slide stays active.",
      },
    },
    {
      name: "backgroundVideoUrl",
      label: "YouTube background video URL",
      type: "text",
      admin: {
        placeholder: "https://www.youtube.com/watch?v=…",
        description: "Optional. When set, the YouTube video plays muted in the hero background instead of the image gallery.",
      },
    },
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
