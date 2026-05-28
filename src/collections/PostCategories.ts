import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "../lib/access";

export const PostCategories: CollectionConfig = {
  slug: "post-categories",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "description"],
    group: "Content",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea" },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "description", type: "textarea" },
        { name: "keywords", type: "text" },
        { name: "canonicalSlug", type: "text" },
      ],
    },
  ],
};
