import type React from "react";

import Link from "next/link";

export function PageHeader({
  actionHref,
  actionLabel,
  breadcrumb,
  description,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  breadcrumb?: string;
  description: string;
  title: string;
}) {
  const crumbs = breadcrumb ? breadcrumb.split(" / ") : [];

  return (
    <div className="portal-page-header">
      <div>
        {crumbs.length > 0 ? (
          <p className="portal-breadcrumb">
            {crumbs.map((crumb, i) => (
              <span key={i}>
                {i > 0 && (
                  <span style={{ margin: "0 5px", opacity: 0.45 }}>›</span>
                )}
                <span style={{ opacity: i === crumbs.length - 1 ? 0.65 : 1 }}>
                  {crumb}
                </span>
              </span>
            ))}
          </p>
        ) : null}
        <h2>{title}</h2>
        <span>{description}</span>
      </div>
      {actionHref && actionLabel ? (
        <Link className="portal-button" href={actionHref}>
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({
  color = "green",
  detail,
  href,
  icon: Icon,
  label,
  value,
}: {
  color?: "green" | "gold" | "red" | "teal" | "indigo";
  detail?: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: number | string;
}) {
  const body = (
    <>
      {Icon ? (
        <div className="portal-stat__icon">
          <Icon size={20} strokeWidth={2} />
        </div>
      ) : null}
      <div className="portal-stat__body">
        <strong>{value}</strong>
        <span>{label}</span>
        {detail ? <em className="portal-stat__detail">{detail}</em> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link className={`portal-stat portal-stat--${color} portal-stat--link`} href={href}>
        {body}
      </Link>
    );
  }

  return <article className={`portal-stat portal-stat--${color}`}>{body}</article>;
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="portal-empty">
      <svg
        fill="none"
        height="40"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ color: "var(--p-green-200)", marginBottom: 4 }}
        viewBox="0 0 24 24"
        width="40"
      >
        <path
          d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <strong>{label}</strong>
      <span>Add the first record to get started.</span>
    </div>
  );
}

export function StatusBadge({ value }: { value: unknown }) {
  const raw = String(value ?? "");
  const label =
    typeof value === "boolean" ? (value ? "Yes" : "No") : raw.replace(/-/g, " ").toUpperCase();
  const slug = raw.toLowerCase();

  const colorMap: Record<string, string> = {
    available: "#00a32a",
    booked: "#00a32a",
    closed: "#646970",
    contacted: "#2271b1",
    confirmed: "#00a32a",
    draft: "#646970",
    limited: "#dba617",
    new: "#d63638",
    published: "#00a32a",
    quoted: "#2271b1",
    trashed: "#d63638",
    unavailable: "#d63638",
  };

  const color = colorMap[slug] || "#646970";

  return (
    <span
      className={`portal-badge portal-badge--${slug}`}
      style={{
        background: "none",
        border: `1px solid ${color}`,
        color: color,
        borderRadius: "3px",
        padding: "0 4px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
