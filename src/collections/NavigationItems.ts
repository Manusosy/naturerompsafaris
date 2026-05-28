import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin } from "../lib/access";

const linkTargetFields = [
  { name: "customUrl", label: "Custom URL", type: "text" as const },
  { name: "destination", type: "relationship" as const, relationTo: "destinations" as const },
  { name: "trip", type: "relationship" as const, relationTo: "trips" as const },
  { name: "package", type: "relationship" as const, relationTo: "packages" as const },
];

export const NavigationItems: CollectionConfig = {
  slug: "navigation-items",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "parentLabel", "linkType", "sortOrder", "visible"],
    group: "Portal",
  },
  fields: [
    { name: "label", type: "text", required: true },
    {
      name: "parentLabel",
      label: "Dropdown group",
      type: "text",
      admin: {
        description:
          "Leave blank for top-level menu items. Use the exact parent label for dropdown children, for example Kenya Safaris.",
      },
    },
    {
      name: "linkType",
      type: "select",
      defaultValue: "custom-url",
      required: true,
      options: [
        { label: "Custom URL / static page", value: "custom-url" },
        { label: "Destination", value: "destination" },
        { label: "Trip", value: "trip" },
        { label: "Package", value: "package" },
      ],
    },
    ...linkTargetFields,
    { name: "sortOrder", type: "number", defaultValue: 0, required: true },
    { name: "visible", type: "checkbox", defaultValue: true },
    { name: "isPrimaryAction", label: "Primary button", type: "checkbox", defaultValue: false },
    {
      name: "notes",
      type: "textarea",
      admin: {
        description: "Internal notes for menu management only.",
      },
    },
  ],
};
