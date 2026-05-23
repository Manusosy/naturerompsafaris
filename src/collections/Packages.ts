import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "@/lib/access";

const seoFields = [
  { name: "metaTitle", type: "text" as const },
  { name: "metaDescription", type: "textarea" as const },
  { name: "keywords", type: "text" as const },
];

export const Packages: CollectionConfig = {
  slug: "packages",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "duration", "featured"],
    group: "Content",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        "Kenya Safaris",
        "Tanzania Safaris",
        "Kenya Tanzania Combined Safaris",
        "Kenya Adventure Safaris",
        "Tanzania Adventure Safaris",
      ],
    },
    { name: "duration", type: "text" },
    { name: "priceText", label: "Price / starting text", type: "text" },
    { name: "featured", type: "checkbox", defaultValue: false },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "excerpt", type: "textarea", required: true },
    { name: "destinations", type: "text" },
    { name: "bestTime", type: "text" },
    {
      name: "accommodations",
      type: "relationship",
      relationTo: "accommodations",
      hasMany: true,
      admin: {
        description:
          "Optional Airbnb, lodge or stay choices shown on this package detail page.",
      },
    },
    { name: "content", type: "richText" },
    {
      name: "faqs",
      type: "array",
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    ...seoFields,
  ],
};
