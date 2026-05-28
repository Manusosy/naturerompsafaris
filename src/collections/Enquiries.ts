import type { CollectionConfig } from "payload";

import { operationsOrAdmin } from "../lib/access";

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
    { name: "nationality", type: "text" },
    { name: "destinationChoice", label: "Destination choice", type: "text" },
    { name: "subject", type: "text" },
    { name: "message", type: "textarea", required: true },
    { name: "comments", label: "Additional comments", type: "textarea" },
    { name: "sourcePage", type: "text" },
    { name: "sourceTrip", type: "relationship", relationTo: "trips" },
    { name: "travelDays", type: "text" },
    { name: "tourStartDate", type: "date" },
    { name: "startDate", label: "Preferred start date", type: "date" },
    { name: "endDate", label: "Preferred end date", type: "date" },
    { name: "flexibleDates", label: "Flexible dates", type: "checkbox", defaultValue: false },
    { name: "budgetRange", type: "text" },
    { name: "budgetPerPerson", label: "Budget per person", type: "text" },
    { name: "adults", type: "text" },
    { name: "children", label: "Children under 13", type: "text" },
    { name: "infants", type: "text" },
    { name: "accommodationPreference", label: "Accommodation preference", type: "text" },
    { name: "planningStage", label: "Planning stage", type: "text" },
    { name: "tripType", label: "Trip type", type: "text" },
    { name: "referralSource", label: "Referral source", type: "text" },
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
