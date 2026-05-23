import type { CollectionConfig } from "payload";

import { adminFieldOnly, adminOnly, roleOptions, selfOrAdmin } from "@/lib/access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  access: {
    read: selfOrAdmin,
    create: adminOnly,
    update: selfOrAdmin,
    delete: adminOnly,
  },
  admin: {
    useAsTitle: "email",
    group: "Portal",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: roleOptions,
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
      admin: {
        description:
          "Admin manages users/settings, Editor manages content, Operations manages enquiries/bookings/stays.",
      },
    },
  ],
};
