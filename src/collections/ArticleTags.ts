import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "../lib/access";

export const ArticleTags: CollectionConfig = {
  slug: "article-tags",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
    group: "Content",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
  ],
};
