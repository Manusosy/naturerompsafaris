import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "@/lib/access";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: {
    read: anyone,
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
    { name: "quote", type: "textarea", required: true },
    { name: "rating", type: "number", min: 1, max: 5, defaultValue: 5 },
  ],
};
