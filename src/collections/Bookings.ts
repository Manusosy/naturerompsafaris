import type { CollectionConfig } from "payload";

import { operationsOrAdmin } from "@/lib/access";

export const Bookings: CollectionConfig = {
  slug: "bookings",
  access: {
    read: operationsOrAdmin,
    create: operationsOrAdmin,
    update: operationsOrAdmin,
    delete: operationsOrAdmin,
  },
  admin: {
    useAsTitle: "travellerName",
    defaultColumns: ["travellerName", "status", "package", "travelStartDate"],
    group: "Operations",
  },
  fields: [
    { name: "travellerName", type: "text", required: true },
    { name: "travellerEmail", type: "email" },
    { name: "travellerPhone", type: "text" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "lead",
      options: [
        { label: "Lead", value: "lead" },
        { label: "Planning", value: "planning" },
        { label: "Quoted", value: "quoted" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    { name: "package", type: "relationship", relationTo: "packages" },
    { name: "enquiry", type: "relationship", relationTo: "enquiries" },
    { name: "travelStartDate", type: "date" },
    { name: "travelEndDate", type: "date" },
    { name: "travellers", type: "number", min: 1 },
    { name: "budgetText", type: "text" },
    { name: "notes", type: "textarea" },
  ],
};
