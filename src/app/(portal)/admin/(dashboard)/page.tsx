import { BedDouble, FileText, Inbox, MapPin, MessageSquare, Newspaper, Package, PackagePlus } from "lucide-react";
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

const quickActions = [
  { color: "var(--p-green-800)", bg: "var(--p-green-100)", href: "/admin/packages/new", icon: PackagePlus, label: "New package", sub: "Create a safari package" },
  { color: "#0d9488", bg: "#f0fdfa", href: "/admin/trips/new", icon: MapPin, label: "New trip", sub: "Add an itinerary" },
  { color: "var(--p-gold)", bg: "var(--p-gold-soft)", href: "/admin/destinations/new", icon: FileText, label: "New destination", sub: "Add a country page" },
  { color: "#4f46e5", bg: "#eef2ff", href: "/admin/posts/new", icon: Newspaper, label: "New article", sub: "Write a blog post" },
] as const;

export default async function PortalOverviewPage() {
  const user = await requirePortalUser();
  const [newEnquiries, openEnquiries, publishedPackages, upcomingTrips, availableStays, recentEnquiries] =
    await Promise.all([
      countCollection("enquiries", { status: { equals: "new" } }),
      countCollection("enquiries", { status: { in: ["new", "contacted", "quoted"] } }),
      countCollection("packages", { status: { equals: "published" } }),
      countCollection("trips", { status: { equals: "published" } }),
      countCollection("accommodations", { availability: { equals: "available" } }),
      findCollection("enquiries", 6, undefined, 1, "-createdAt"),
    ]);
  const recentEnquiryDocs = Array.isArray(recentEnquiries.docs)
    ? recentEnquiries.docs as Array<Record<string, unknown>>
    : [];

  return (
    <div className="portal-stack">
      <section
        className="portal-hero"
        style={{
          backgroundImage:
            "linear-gradient(100deg, rgba(8,18,8,0.93) 0%, rgba(18,42,14,0.85) 50%, rgba(10,22,8,0.60) 100%), url('/assets/img/about/about-jeep.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
        }}
      >
        <div className="portal-hero__text">
          <p>{getKenyaGreeting(user.name || user.email)}</p>
          <h2>Safari Operations Portal.</h2>
          <span>Manage content, safari leads, and trips.</span>
        </div>
        <Link className="portal-button portal-hero__cta" href="/admin/trips/new">
          <svg fill="none" height="16" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="16">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New trip
        </Link>
      </section>

      <div className="portal-stats">
        <StatCard color="red"    icon={Inbox}         label="New enquiries"      value={newEnquiries} />
        <StatCard color="gold"   icon={MessageSquare} label="Open enquiries"     value={openEnquiries} />
        <StatCard color="green"  icon={Package}       label="Published packages" value={publishedPackages} />
        <StatCard color="teal"   icon={MapPin}        label="Upcoming trips"     value={upcomingTrips} />
        <StatCard color="indigo" icon={BedDouble}     label="Available stays"    value={availableStays} />
      </div>

      <section className="portal-section-card">
        <div className="portal-section-card__head">
          <h2>Quick Actions</h2>
        </div>
        <div className="portal-action-grid">
          {quickActions.map(({ bg, color, href, icon: Icon, label, sub }) => (
            <Link className="portal-action-card" href={href} key={href}>
              <div className="portal-action-card__icon" style={{ background: bg, color }}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <strong>{label}</strong>
                <span>{sub}</span>
              </div>
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
                  <td>
                    <Link className="enquiry-dashboard-link" href={`/admin/enquiries/${item.id}`}>
                      {formatValue(item.name)}
                    </Link>
                  </td>
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
