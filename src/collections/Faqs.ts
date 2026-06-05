import type { CollectionConfig } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

export const Faqs: CollectionConfig = {
  slug: "faqs",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "category", "featured", "status", "sortOrder"],
    group: "Content",
    description: "Reusable public FAQs for homepage and safari pages.",
  },
  fields: [
    { name: "question", type: "text", required: true },
    { name: "answer", type: "textarea", required: true },
    { name: "category", type: "text", defaultValue: "Planning" },
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
