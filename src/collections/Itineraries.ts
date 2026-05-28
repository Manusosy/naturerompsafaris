import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "../lib/access";

export const Itineraries: CollectionConfig = {
  slug: "itineraries",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "package", "dayCount"],
    group: "Content",
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "package",
      type: "relationship",
      relationTo: "packages",
    },
    { name: "trip", type: "relationship", relationTo: "trips" },
    {
      name: "dayCount",
      label: "Number of days",
      type: "number",
      min: 1,
    },
    {
      name: "days",
      type: "array",
      required: true,
      fields: [
        { name: "day", type: "number", min: 1, required: true },
        { name: "title", type: "text", required: true },
        { name: "location", type: "text" },
        { name: "meals", type: "text" },
        { name: "accommodation", type: "text" },
        { name: "description", type: "textarea", required: true },
        { name: "image", type: "upload", relationTo: "media" },
      ],
    },
  ],
};
