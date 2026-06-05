import type { Access, FieldAccess, Where } from "payload";

export const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" },
  { label: "Operations", value: "operations" },
] satisfies Array<{ label: string; value: string }>;

export type AdminRole = "admin" | "editor" | "operations";

type UserWithRole = {
  id?: number | string;
  role?: AdminRole;
} | null | undefined;

function userHasRole(user: UserWithRole, roles: AdminRole[]) {
  return Boolean(user?.role && roles.includes(user.role));
}

export const isAdminUser = (user: UserWithRole) => userHasRole(user, ["admin"]);
export const isEditorUser = (user: UserWithRole) =>
  userHasRole(user, ["admin", "editor"]);
export const isOperationsUser = (user: UserWithRole) =>
  userHasRole(user, ["admin", "operations"]);
export const isStaffUser = (user: UserWithRole) =>
  userHasRole(user, ["admin", "editor", "operations"]);

export const anyone: Access = () => true;
export const adminOnly: Access = ({ req }) => isAdminUser(req.user as UserWithRole);
export const editorOrAdmin: Access = ({ req }) =>
  isEditorUser(req.user as UserWithRole);
export const operationsOrAdmin: Access = ({ req }) =>
  isOperationsUser(req.user as UserWithRole);
export const staffOnly: Access = ({ req }) => isStaffUser(req.user as UserWithRole);

export const adminFieldOnly: FieldAccess = ({ req }) =>
  isAdminUser(req.user as UserWithRole);

export const selfOrAdmin: Access = ({ req }) => {
  const user = req.user as UserWithRole;
  if (isAdminUser(user)) return true;
  if (!user?.id) return false;

  return {
    id: {
      equals: user.id,
    },
  } satisfies Where;
};

export const publishedOrStaff: Access = ({ req }) => {
  if (isStaffUser(req.user as UserWithRole)) return true;

  return {
    status: {
      equals: "published",
    },
  } satisfies Where;
};
