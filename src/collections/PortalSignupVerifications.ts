import type { CollectionConfig } from "payload";

export const PortalSignupVerifications: CollectionConfig = {
  slug: "portal-signup-verifications",
  timestamps: true,
  admin: {
    hidden: true,
  },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      index: true,
    },
    {
      name: "codeHash",
      type: "text",
      required: true,
    },
    {
      name: "expiresAt",
      type: "date",
      required: true,
      index: true,
    },
    {
      name: "attempts",
      type: "number",
      defaultValue: 0,
      required: true,
    },
    {
      name: "requestIpHash",
      type: "text",
      index: true,
    },
  ],
};
