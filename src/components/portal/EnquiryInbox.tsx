"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";

import { StatusBadge } from "@/components/portal/PortalCards";
import {
  buildEnquiryMailto,
  buildEnquiryWhatsAppHref,
  getEnquiryInterestLabel,
  inferEnquiryFormType,
} from "@/lib/portal/enquiry-helpers";
import { formatValue, getValue } from "@/lib/portal/format";

const openEnquiryStatuses = new Set(["new", "contacted", "quoted"]);

const statusFilters = [
  { label: "All", value: "__all" },
  { label: "Open", value: "__open" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Quoted", value: "quoted" },
  { label: "Booked", value: "booked" },
  { label: "Closed", value: "closed" },
];

export function EnquiryInbox({
  docs,
  emptyLabel,
  initialStatusFilter = "__all",
  page = 1,
  totalPages = 1,
}: {
  docs: Array<Record<string, unknown>>;
  emptyLabel: string;
  initialStatusFilter?: string;
  page?: number;
  totalPages?: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState("__all");

  const visibleDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const status = String(getValue(doc, "status") ?? "");
      const formType = inferEnquiryFormType(doc);
      const text = [
        getValue(doc, "name"),
        getValue(doc, "email"),
        getValue(doc, "phone"),
        getValue(doc, "subject"),
        getValue(doc, "sourcePage"),
        getEnquiryInterestLabel(doc),
      ]
        .map(formatValue)
        .join(" ")
        .toLowerCase();

      const matchesStatus =
        statusFilter === "__all" ||
        (statusFilter === "__open" ? openEnquiryStatuses.has(status) : status === statusFilter);

      return (
        (!q || text.includes(q)) &&
        matchesStatus &&
        (typeFilter === "__all" || formType === typeFilter)
      );
    });
  }, [docs, query, statusFilter, typeFilter]);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({ collection: "enquiries", data: { status }, id }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  const pageNums: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    if (page > 3) pageNums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push("…");
    pageNums.push(totalPages);
  }

  return (
    <div className="portal-table-card wp-style enquiry-inbox">
      <div className="enquiry-inbox__toolbar">
        <input
          className="enquiry-inbox__search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search leads…"
          type="search"
          value={query}
        />
        <select
          className="enquiry-inbox__filter"
          onChange={(event) => setTypeFilter(event.target.value)}
          value={typeFilter}
        >
          <option value="__all">All form types</option>
          <option value="quick">Quick enquiry</option>
          <option value="quote">Full quote</option>
        </select>
      </div>

      <ul className="wp-subsubsub">
        {statusFilters.map((item) => (
          <li key={item.value}>
            <button
              className={statusFilter === item.value ? "current" : undefined}
              onClick={() => setStatusFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="portal-table-wrap">
        <table className="portal-table wp-list-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Type</th>
              <th>Interest</th>
              <th>Source</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {visibleDocs.map((doc) => {
              const id = String(doc.id);
              const name = formatValue(getValue(doc, "name"));
              const email = formatValue(getValue(doc, "email"));
              const formType = inferEnquiryFormType(doc);
              const sourcePage = String(getValue(doc, "sourcePage") ?? "");
              const sourceShort = sourcePage ? sourcePage.replace(/^\//, "") || "/" : "-";
              const whatsappHref = buildEnquiryWhatsAppHref(doc);
              const mailto = buildEnquiryMailto(doc);
              const isBusy = busyId === id;

              return (
                <Fragment key={id}>
                  <tr className="wp-row-hover">
                    <td className="is-primary">
                      <Link className="row-title" href={`/admin/enquiries/${id}`}>
                        {name}
                      </Link>
                      <span className="enquiry-inbox__email">{email}</span>
                      <div className="row-actions">
                        <span className="view">
                          <Link href={`/admin/enquiries/${id}`}>Open</Link>{" "}
                          <span className="divider">|</span>
                        </span>
                        <span className="edit">
                          <a href={mailto}>Reply</a>{" "}
                          <span className="divider">|</span>
                        </span>
                        {whatsappHref ? (
                          <span className="inline-edit">
                            <a href={whatsappHref} rel="noreferrer" target="_blank">
                              WhatsApp
                            </a>{" "}
                            <span className="divider">|</span>
                          </span>
                        ) : null}
                        <span className="trash">
                          <button
                            disabled={isBusy}
                            onClick={() => updateStatus(id, "contacted")}
                            type="button"
                          >
                            Mark contacted
                          </button>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`enquiry-type-badge enquiry-type-badge--${formType}`}>
                        {formType === "quote" ? "Full quote" : "Quick"}
                      </span>
                    </td>
                    <td>{getEnquiryInterestLabel(doc)}</td>
                    <td className="enquiry-inbox__source">{sourceShort}</td>
                    <td>
                      <StatusBadge value={getValue(doc, "status")} />
                    </td>
                    <td>{formatValue(getValue(doc, "createdAt"))}</td>
                  </tr>
                </Fragment>
              );
            })}
            {!visibleDocs.length ? (
              <tr>
                <td colSpan={6}>
                  <div className="portal-table-empty">
                    <strong>{docs.length ? "No enquiries match the filters" : emptyLabel}</strong>
                    <span>
                      {docs.length
                        ? "Try adjusting the search or filter above."
                        : "New website enquiries will appear here and email info@naturerompsafaris.com."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="portal-pagination">
          <span className="portal-pagination__info">
            Page {page} of {totalPages}
          </span>
          <nav aria-label="Pagination" className="portal-pagination__nav">
            <Link aria-disabled={page <= 1} href={`?page=${Math.max(1, page - 1)}`} title="Previous page">
              ←
            </Link>
            {pageNums.map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} style={{ color: "var(--p-muted)", padding: "0 4px" }}>
                  …
                </span>
              ) : (
                <Link className={p === page ? "is-current" : ""} href={`?page=${p}`} key={p}>
                  {p}
                </Link>
              ),
            )}
            <Link
              aria-disabled={page >= totalPages}
              href={`?page=${Math.min(totalPages, page + 1)}`}
              title="Next page"
            >
              →
            </Link>
          </nav>
        </div>
      ) : null}

      <p className="enquiry-inbox__hint">
        <Mail size={14} /> Submissions are emailed to info@naturerompsafaris.com. Use Reply or WhatsApp to follow up
        with the traveler.
        <MessageCircle size={14} />
      </p>
    </div>
  );
}
