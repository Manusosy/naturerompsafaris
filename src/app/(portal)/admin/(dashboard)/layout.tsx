import { PortalShell } from "@/components/portal/PortalShell";
import { countCollection, requirePortalUser } from "@/lib/portal/data";

export default async function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalUser();
  const notificationCount = await countCollection("enquiries", { status: { equals: "new" } });
  return <PortalShell notificationCount={notificationCount} user={user}>{children}</PortalShell>;
}
