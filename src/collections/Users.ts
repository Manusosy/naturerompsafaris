import { ValidationError, type CollectionConfig, type PayloadRequest } from "payload";

import { adminFieldOnly, adminOnly, roleOptions, selfOrAdmin } from "../lib/access";
import {
  assertAuthorizedAdminEmail,
  prepareUserAuthData,
  unauthorizedAdminEmailMessage,
} from "../lib/admin-auth";
import { getEnv } from "../lib/env";

function throwUnauthorizedEmailValidation(req: PayloadRequest) {
  throw new ValidationError({
    collection: "users",
    errors: [
      {
        message: unauthorizedAdminEmailMessage,
        path: "email",
      },
    ],
    req,
  });
}

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 14,
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token ?? "";
        const resetUrl = `${getEnv().PAYLOAD_SERVER_URL}/admin/reset-password/${token}`;
        return `<p>You requested a password reset for the Nature Romp Safaris portal.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`;
      },
      generateEmailSubject: () => "Reset your Nature Romp Safaris portal password",
    },
  },
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
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== "create" && operation !== "update") {
          return data;
        }

        try {
          return prepareUserAuthData(data, {
            allowedDomain: getEnv().ADMIN_EMAIL_DOMAIN,
            forceAdminRole: operation === "create" && !req.user,
          });
        } catch (error) {
          if (error instanceof Error && error.message === unauthorizedAdminEmailMessage) {
            throwUnauthorizedEmailValidation(req);
          }

          throw error;
        }
      },
    ],
    beforeLogin: [
      ({ user }) => {
        assertAuthorizedAdminEmail(user.email, getEnv().ADMIN_EMAIL_DOMAIN);
      },
    ],
  },
  fields: [
    {
      name: "firstName",
      type: "text",
      required: true,
      label: "First Name",
    },
    {
      name: "lastName",
      type: "text",
      required: true,
      label: "Second Name",
    },
    {
      name: "name",
      type: "text",
      admin: {
        hidden: true,
      },
    },
    {
      name: "role",
      type: "select",
      defaultValue: "admin",
      options: roleOptions,
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
      admin: {
        condition: (_, __, { user }) => Boolean(user),
        description:
          "Admin manages users/settings, Editor manages content, Operations manages enquiries/stays.",
      },
    },
  ],
};
