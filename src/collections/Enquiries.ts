import type { CollectionConfig } from "payload";

import { operationsOrAdmin } from "@/lib/access";

export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  access: {
    read: operationsOrAdmin,
    create: operationsOrAdmin,
    update: operationsOrAdmin,
    delete: operationsOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "status", "sourcePage", "createdAt"],
    group: "Operations",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "whatsapp", type: "text" },
    { name: "subject", type: "text" },
    { name: "message", type: "textarea", required: true },
    { name: "sourcePage", type: "text" },
    { name: "adults", type: "text" },
    { name: "infants", type: "text" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "Contacted", value: "contacted" },
        { label: "Quoted", value: "quoted" },
        { label: "Booked", value: "booked" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      name: "assignedTo",
      type: "relationship",
      relationTo: "users",
    },
    { name: "internalNotes", type: "textarea" },
  ],
};
