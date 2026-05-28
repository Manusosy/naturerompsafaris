"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/portal/PortalCards";
import { formatValue, getValue } from "@/lib/portal/format";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function ResourceTable({
  collection,
  docs,
  editModuleSlug,
  emptyLabel,
  moduleSlug,
  page = 1,
  tableColumns,
  trashable,
  trashView,
  totalPages = 1,
}: {
  collection?: string;
  docs: Array<Record<string, unknown>>;
  editModuleSlug?: string;
  emptyLabel: string;
  moduleSlug: string;
  page?: number;
  tableColumns: Array<{ key: string; label: string }>;
  trashable?: boolean;
  trashView?: boolean;
  totalPages?: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all");
  const [destinationFilter, setDestinationFilter] = useState("__all");
  const [typeFilter, setTypeFilter] = useState("__all");

  const visibleDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const text = tableColumns.map((col) => formatValue(getValue(doc, col.key))).join(" ").toLowerCase();
      const status = String(getValue(doc, "status") ?? "");
      const destText = formatValue(getValue(doc, "destinations")).toLowerCase();
      const typeText = [getValue(doc, "packageGroup"), getValue(doc, "category"), getValue(doc, "availability")]
        .map(formatValue).join(" ").toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (statusFilter === "__all" || status === statusFilter) &&
        (destinationFilter === "__all" || destText.includes(destinationFilter)) &&
        (typeFilter === "__all" || typeText.includes(typeFilter))
      );
    });
  }, [destinationFilter, docs, query, statusFilter, tableColumns, typeFilter]);

  async function updateStatus(id: unknown, status: string) {
    if (!collection) return;
    const idValue = String(id);
    setBusyId(idValue);
    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({ collection, data: { status }, id: idValue }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  async function removeRecord(id: unknown) {
    if (!collection) return;
    const idValue = String(id);
    setBusyId(idValue);
    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({ action: "delete", collection, id: idValue }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  async function bulkTrash() {
    if (!collection || !selectedIds.length) return;
    setBusyId("bulk");
    await Promise.all(
      selectedIds.map((id) =>
        fetch("/api/portal/records", {
          body: JSON.stringify({ collection, data: { status: "trashed" }, id }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
      )
    );
    setBusyId(null);
    setSelectedIds([]);
    router.refresh();
  }

  const resolvedEditModuleSlug = editModuleSlug ?? moduleSlug;
  const hasStatusCol = tableColumns.some((c) => c.key === "status" || c.key === "availability");
  const colCount = tableColumns.length + (trashable ? 2 : 1);

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
    <div className="portal-table-card">
      {/* ── Controls bar ─────────────────────────── */}
      <div className="portal-table-controls">
        {/* Search */}
        <div className="portal-table-search">
          <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${moduleSlug}…`}
            type="search"
            value={query}
          />
        </div>

        {/* Status filter – only if module has status column */}
        {hasStatusCol ? (
          <select
            className="portal-table-filter"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="__all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="trashed">Trashed</option>
            {moduleSlug === "trips" && (
              <>
                <option value="paused">Paused</option>
                <option value="sold-out">Sold out</option>
              </>
            )}
            {moduleSlug === "accommodations" && (
              <>
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="unavailable">Unavailable</option>
                <option value="on-request">On request</option>
              </>
            )}
          </select>
        ) : null}

        {/* Destination filter (trips only) */}
        {moduleSlug === "trips" ? (
          <>
            <select
              className="portal-table-filter"
              onChange={(e) => setDestinationFilter(e.target.value)}
              value={destinationFilter}
            >
              <option value="__all">All destinations</option>
              <option value="kenya">Kenya</option>
              <option value="tanzania">Tanzania</option>
              <option value="mara">Masai Mara</option>
              <option value="serengeti">Serengeti</option>
            </select>
            <select
              className="portal-table-filter"
              onChange={(e) => setTypeFilter(e.target.value)}
              value={typeFilter}
            >
              <option value="__all">All types</option>
              <option value="private">Private</option>
              <option value="group">Group joining</option>
              <option value="lodge">Lodge</option>
              <option value="budget">Budget</option>
            </select>
          </>
        ) : null}

        {/* Right side: bulk action or count */}
        <div className="portal-table-controls-right">
          {trashable && selectedIds.length > 0 ? (
            <div className="portal-bulk-bar">
              <span>{selectedIds.length} selected</span>
              <button
                className="is-danger"
                disabled={busyId === "bulk"}
                onClick={bulkTrash}
                type="button"
              >
                {busyId === "bulk" ? "Moving…" : "Move to trash"}
              </button>
              <button onClick={() => setSelectedIds([])} type="button">
                Clear
              </button>
            </div>
          ) : (
            <span style={{ color: "var(--p-muted)", fontSize: "12.5px", fontWeight: 600 }}>
              {visibleDocs.length} {visibleDocs.length === 1 ? "record" : "records"}
            </span>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────── */}
      <div className="portal-table-wrap">
        <table className="portal-table">
          <thead>
            <tr>
              {trashable ? (
                <th className="col-check">
                  <input
                    aria-label="Select all"
                    checked={visibleDocs.length > 0 && selectedIds.length === visibleDocs.length}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? visibleDocs.map((d) => String(d.id)) : [])
                    }
                    type="checkbox"
                  />
                </th>
              ) : null}
              {tableColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th className="col-actions" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visibleDocs.map((doc, idx) => {
              const status = getValue(doc, "status");
              const isTrashed = status === "trashed";
              const isFirst = idx === 0;
              return (
                <tr key={String(doc.id)}>
                  {trashable ? (
                    <td className="col-check">
                      <input
                        aria-label={`Select ${formatValue(getValue(doc, tableColumns[0]?.key ?? "id"))}`}
                        checked={selectedIds.includes(String(doc.id))}
                        onChange={(e) =>
                          setSelectedIds((cur) =>
                            e.target.checked
                              ? [...new Set([...cur, String(doc.id)])]
                              : cur.filter((id) => id !== String(doc.id))
                          )
                        }
                        type="checkbox"
                      />
                    </td>
                  ) : null}
                  {tableColumns.map((col, ci) => {
                    const value = getValue(doc, col.key);
                    const isStatus = col.key.toLowerCase().includes("status") || col.key === "availability";
                    const isBool = typeof value === "boolean";
                    return (
                      <td key={col.key} className={ci === 0 ? "is-primary" : ""}>
                        {isStatus || isBool ? <StatusBadge value={value} /> : formatValue(value)}
                      </td>
                    );
                  })}
                  <td className="col-actions">
                    <div className="portal-row-actions">
                      {!trashView && !isTrashed ? (
                        <Link
                          className="portal-table__action"
                          href={`/admin/${resolvedEditModuleSlug}/${doc.id}`}
                        >
                          Edit
                        </Link>
                      ) : null}
                      {trashable && !isTrashed ? (
                        <button
                          className="is-danger"
                          disabled={busyId === String(doc.id)}
                          onClick={() => updateStatus(doc.id, "trashed")}
                          title="Move to trash"
                          type="button"
                        >
                          Trash
                        </button>
                      ) : null}
                      {trashView || isTrashed ? (
                        <>
                          <button
                            disabled={busyId === String(doc.id)}
                            onClick={() => updateStatus(doc.id, "draft")}
                            type="button"
                          >
                            Restore
                          </button>
                          <button
                            className="is-danger"
                            disabled={busyId === String(doc.id)}
                            onClick={() => removeRecord(doc.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!visibleDocs.length ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="portal-table-empty">
                    <strong>{docs.length ? "No records match the filters" : emptyLabel}</strong>
                    <span>
                      {docs.length
                        ? "Try adjusting the search or filter above."
                        : "Create your first record to get started."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────── */}
      {totalPages > 1 ? (
        <div className="portal-pagination">
          <span className="portal-pagination__info">
            Page {page} of {totalPages}
          </span>
          <nav className="portal-pagination__nav" aria-label="Pagination">
            <Link
              aria-disabled={page <= 1}
              href={`?page=${Math.max(1, page - 1)}`}
              title="Previous page"
            >
              ←
            </Link>
            {pageNums.map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "var(--p-muted)" }}>
                  …
                </span>
              ) : (
                <Link
                  className={p === page ? "is-current" : ""}
                  href={`?page=${p}`}
                  key={p}
                >
                  {p}
                </Link>
              )
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
    </div>
  );
}
