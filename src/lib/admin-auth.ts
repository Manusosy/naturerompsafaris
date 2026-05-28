import type { AdminRole } from "@/lib/access";

export const unauthorizedAdminEmailMessage =
  "This email is not authorized for portal access.";

type UserData = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  name?: unknown;
  role?: unknown;
};

export function normalizeAdminEmail(email: unknown) {
  if (typeof email !== "string") return email;
  return email.trim().toLowerCase();
}

export function isAuthorizedAdminEmail(email: unknown, allowedDomain: string) {
  const normalizedEmail = normalizeAdminEmail(email);
  const normalizedDomain = allowedDomain.toLowerCase().replace(/^@/, "");

  return (
    typeof normalizedEmail === "string" &&
    normalizedEmail.endsWith(`@${normalizedDomain}`)
  );
}

export function assertAuthorizedAdminEmail(email: unknown, allowedDomain: string) {
  if (!isAuthorizedAdminEmail(email, allowedDomain)) {
    throw new Error(unauthorizedAdminEmailMessage);
  }
}

function normalizeNamePart(value: unknown) {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
}

export function prepareUserAuthData<TData extends UserData>(
  data: TData | undefined,
  options: {
    allowedDomain: string;
    forceAdminRole?: boolean;
  },
) {
  const nextData = { ...(data ?? {}) } as TData & {
    email?: unknown;
    role?: AdminRole;
  };

  if (nextData.email) {
    nextData.email = normalizeAdminEmail(nextData.email);
    assertAuthorizedAdminEmail(nextData.email, options.allowedDomain);
  }

  nextData.firstName = normalizeNamePart(nextData.firstName);
  nextData.lastName = normalizeNamePart(nextData.lastName);

  if (nextData.firstName || nextData.lastName) {
    nextData.name = [nextData.firstName, nextData.lastName]
      .filter((part) => typeof part === "string" && part.length > 0)
      .join(" ");
  }

  if (options.forceAdminRole) {
    nextData.role = "admin";
  }

  return nextData;
}
