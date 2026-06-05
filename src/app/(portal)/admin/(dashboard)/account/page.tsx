import { AccountForm } from "@/components/portal/AccountForm";
import { findDocument, requirePortalUser } from "@/lib/portal/data";

export default async function AccountPage() {
  const user = await requirePortalUser();
  const document = user.id
    ? (await findDocument("users", String(user.id)).catch(() => null)) as Record<string, unknown> | null
    : null;

  return (
    <div className="portal-stack">
      <AccountForm
        email={user.email}
        firstName={typeof document?.firstName === "string" ? document.firstName : ""}
        lastName={typeof document?.lastName === "string" ? document.lastName : ""}
        role={user.role}
      />
    </div>
  );
}
