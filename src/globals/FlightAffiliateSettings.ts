import type { GlobalConfig } from "payload";

import { adminOnly, anyone } from "../lib/access";

export const FlightAffiliateSettings: GlobalConfig = {
  slug: "flight-affiliate-settings",
  access: {
    read: anyone,
    update: adminOnly,
  },
  admin: {
    group: "Portal",
  },
  fields: [
    {
      name: "provider",
      type: "select",
      required: true,
      defaultValue: "disabled",
      options: [
        { label: "Disabled", value: "disabled" },
        { label: "Travelpayouts", value: "travelpayouts" },
        { label: "Skyscanner", value: "skyscanner" },
      ],
    },
    { name: "ctaLabel", label: "CTA label", type: "text", defaultValue: "Check Flights" },
    { name: "affiliateUrl", type: "text" },
    { name: "trackingParams", type: "text" },
    {
      name: "notes",
      type: "textarea",
      admin: {
        description:
          "Internal setup notes while the client chooses Travelpayouts or Skyscanner.",
      },
    },
  ],
};
