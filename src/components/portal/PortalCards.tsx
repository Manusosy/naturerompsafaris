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

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="portal-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
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
  const label = typeof value === "boolean"
    ? value ? "Yes" : "No"
    : raw.replace(/-/g, " ");
  const slug = raw.toLowerCase();
  return (
    <span className={`portal-badge portal-badge--${slug}`}>{label}</span>
  );
}
