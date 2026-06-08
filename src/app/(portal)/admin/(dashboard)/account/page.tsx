import { AccountForm } from "@/components/portal/AccountForm";
import { PageHeader } from "@/components/portal/PortalCards";
import { findDocument, requirePortalUser } from "@/lib/portal/data";

export default async function AccountPage() {
  const user = await requirePortalUser();
  const document = user.id
    ? (await findDocument("users", String(user.id)).catch(() => null)) as Record<string, unknown> | null
    : null;

  return (
    <div className="portal-stack">
      <PageHeader
        breadcrumb="Dashboard / My account"
        description="Manage your portal profile and password."
        title="My account"
      />
      <AccountForm
        email={user.email}
        firstName={typeof document?.firstName === "string" ? document.firstName : ""}
        lastName={typeof document?.lastName === "string" ? document.lastName : ""}
        role={user.role}
      />
    </div>
  );
}
