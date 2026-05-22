import type { CollectionConfig } from "payload";

const seoFields = [
  { name: "metaTitle", type: "text" as const },
  { name: "metaDescription", type: "textarea" as const },
  { name: "keywords", type: "text" as const },
];

export const Packages: CollectionConfig = {
  slug: "packages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "duration", "featured"],
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
