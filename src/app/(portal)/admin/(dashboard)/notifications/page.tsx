import { NotificationCenter } from "@/components/portal/NotificationCenter";
import { PageHeader } from "@/components/portal/PortalCards";
import { countCollection, findCollection, requirePortalUser } from "@/lib/portal/data";

export default async function NotificationsPage() {
  await requirePortalUser();
  const [newCount, recent] = await Promise.all([
    countCollection("enquiries", { status: { equals: "new" } }),
    findCollection("enquiries", 40, undefined, 1, "-createdAt"),
  ]);

  return (
    <div className="portal-stack">
      <PageHeader
        breadcrumb="Dashboard / Notifications"
        description={
          newCount > 0
            ? `${newCount} new ${newCount === 1 ? "enquiry needs" : "enquiries need"} your attention.`
            : "Recent website enquiries and new lead alerts."
        }
        title="Notifications"
      />
      <NotificationCenter docs={recent.docs as Array<Record<string, unknown>>} newCount={newCount} />
    </div>
  );
}
