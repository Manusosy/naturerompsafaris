import { BedDouble, Inbox, MapPinned, Package } from "lucide-react";

import { StatCard } from "@/components/portal/PortalCards";
import type { DashboardSnapshot } from "@/lib/portal/dashboard";

export function DashboardSections({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="portal-stats">
      <StatCard
        color="red"
        href="/admin/enquiries"
        icon={Inbox}
        label="Enquiries"
        value={snapshot.totalEnquiries}
      />
      <StatCard
        color="indigo"
        href="/admin/accommodations"
        icon={BedDouble}
        label="Accommodations"
        value={snapshot.totalAccommodations}
      />
      <StatCard
        color="teal"
        href="/admin/destinations"
        icon={MapPinned}
        label="Destinations"
        value={snapshot.totalDestinations}
      />
      <StatCard
        color="green"
        href="/admin/packages"
        icon={Package}
        label="Packages"
        value={snapshot.totalPackages}
      />
    </div>
  );
}
