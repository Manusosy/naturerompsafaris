import { PortalShell } from "@/components/portal/PortalShell";
import { requirePortalUser } from "@/lib/portal/data";

export default async function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalUser();
  return <PortalShell user={user}>{children}</PortalShell>;
}
