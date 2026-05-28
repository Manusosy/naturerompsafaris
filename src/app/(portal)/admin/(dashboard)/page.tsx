import Link from "next/link";

import { StatCard, StatusBadge } from "@/components/portal/PortalCards";
import { countCollection, findCollection, requirePortalUser } from "@/lib/portal/data";
import { formatValue } from "@/lib/portal/format";

function getKenyaGreeting(name?: string) {
  const hour = Number(new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name?.split(" ").filter(Boolean)[0];
  return firstName ? `${greeting}, ${firstName}` : greeting;
}

export default async function PortalOverviewPage() {
  const user = await requirePortalUser();
  const [newEnquiries, activeBookings, publishedPackages, upcomingTrips, availableStays, recentEnquiries] =
    await Promise.all([
      countCollection("enquiries", { status: { equals: "new" } }),
      countCollection("bookings", { status: { in: ["lead", "planning", "quoted", "confirmed"] } }),
      countCollection("packages", { status: { equals: "published" } }),
      countCollection("trips", { status: { equals: "published" } }),
      countCollection("accommodations", { availability: { equals: "available" } }),
      findCollection("enquiries", 6),
    ]);
  const recentEnquiryDocs = Array.isArray(recentEnquiries.docs)
    ? recentEnquiries.docs as Array<Record<string, unknown>>
    : [];

  return (
    <div className="portal-stack">
      <section className="portal-hero">
        <div>
          <p>{getKenyaGreeting(user.name || user.email)}</p>
          <h2>Safari Operations Portal.</h2>
          <span>Manage content, leads, trips, and bookings.</span>
        </div>
        <Link className="portal-button" href="/admin/trips/new">
          New trip
        </Link>
      </section>

      <div className="portal-stats">
        <StatCard label="New enquiries" value={newEnquiries} />
        <StatCard label="Active bookings" value={activeBookings} />
        <StatCard label="Published packages" value={publishedPackages} />
        <StatCard label="Upcoming trips" value={upcomingTrips} />
        <StatCard label="Available stays" value={availableStays} />
      </div>

      <section className="portal-section-card">
        <div className="portal-section-card__head">
          <h2>Quick Actions</h2>
        </div>
        <div className="portal-action-grid">
          {[
            ["New package", "/admin/packages/new"],
            ["New trip", "/admin/trips/new"],
            ["New destination", "/admin/destinations/new"],
            ["New article", "/admin/posts/new"],
          ].map(([label, href]) => (
            <Link className="portal-action-card" href={href} key={href}>
              <strong>{label}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="portal-section-card">
        <div className="portal-section-card__head">
          <h2>Recent Enquiries</h2>
          <Link href="/admin/enquiries">View all</Link>
        </div>
        <div className="portal-table-wrap portal-table-wrap--flush">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Email</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiryDocs.map((item) => (
                <tr key={String(item.id)}>
                  <td>{formatValue(item.name)}</td>
                  <td>{formatValue(item.email)}</td>
                  <td><StatusBadge value={item.status} /></td>
                  <td>{formatValue(item.createdAt)}</td>
                </tr>
              ))}
              {!recentEnquiryDocs.length ? (
                <tr>
                  <td colSpan={4}>No recent enquiries are available yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
