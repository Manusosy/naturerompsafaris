import type { CollectionConfig } from "payload";

import { anyone, operationsOrAdmin } from "../lib/access";

export const availabilityOptions = [
  { label: "Available", value: "available" },
  { label: "Limited", value: "limited" },
  { label: "Unavailable", value: "unavailable" },
  { label: "On Request", value: "on-request" },
] satisfies Array<{ label: string; value: string }>;

export const Accommodations: CollectionConfig = {
  slug: "accommodations",
  access: {
    read: anyone,
    create: operationsOrAdmin,
    update: operationsOrAdmin,
    delete: operationsOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "location", "availability"],
    group: "Operations",
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "airbnb",
      options: [
        { label: "Airbnb / Apartment", value: "airbnb" },
        { label: "Safari Lodge", value: "lodge" },
        { label: "Tented Camp", value: "camp" },
        { label: "Hotel", value: "hotel" },
      ],
    },
    { name: "location", type: "text", required: true },
    { name: "priceText", label: "Price / starting text", type: "text" },
    {
      name: "availability",
      type: "select",
      required: true,
      defaultValue: "on-request",
      options: availabilityOptions,
    },
    { name: "availabilityNote", type: "textarea" },
    { name: "availabilityLastUpdated", type: "date" },
    {
      name: "photos",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "linkedPackages",
      type: "relationship",
      relationTo: "packages",
      hasMany: true,
    },
    {
      name: "amenities",
      type: "array",
      fields: [{ name: "amenity", type: "text", required: true }],
    },
    { name: "description", type: "textarea" },
  ],
};
