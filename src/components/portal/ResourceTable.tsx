"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";

import { StatusBadge } from "@/components/portal/PortalCards";
import { formatValue, getValue } from "@/lib/portal/format";

type QuickEditState = {
  title: string;
  slug: string;
  status: string;
  featured: boolean;
};

const QUICK_EDIT_FEATURED_MODULES = new Set([
  "trips",
  "packages",
  "posts",
  "gallery",
  "faqs",
  "testimonials",
  "hero-slides",
]);

function relationId(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function relationIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(relationId).filter(Boolean);
}

export function ResourceTable({
  categoryFilter: initialCategoryFilter,
  categoryOptions = [],
  collection,
  docs,
  editModuleSlug,
  emptyLabel,
  moduleSlug,
  page = 1,
  tableColumns,
  tagFilter: initialTagFilter,
  trashable,
  trashView,
  totalPages = 1,
}: {
  categoryFilter?: string;
  categoryOptions?: Array<{ label: string; value: string }>;
  collection?: string;
  docs: Array<Record<string, unknown>>;
  editModuleSlug?: string;
  emptyLabel: string;
  moduleSlug: string;
  page?: number;
  tableColumns: Array<{ key: string; label: string }>;
  tagFilter?: string;
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
  const [countryFilter, setCountryFilter] = useState("__all");
  const [typeFilter, setTypeFilter] = useState("__all");
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter || "__all");
  const [tagFilter, setTagFilter] = useState(initialTagFilter || "__all");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditData, setQuickEditData] = useState<QuickEditState>({
    title: "",
    slug: "",
    status: "draft",
    featured: false,
  });
  const [quickEditBusy, setQuickEditBusy] = useState(false);
  const quickEditTitleKey = tableColumns[0]?.key ?? "title";
  const quickEditTitleLabel = tableColumns[0]?.label ?? "Title";
  const quickEditShowsFeatured = QUICK_EDIT_FEATURED_MODULES.has(moduleSlug);

  function openQuickEdit(doc: Record<string, unknown>) {
    setQuickEditId(String(doc.id));
    setQuickEditData({
      title: String(getValue(doc, quickEditTitleKey) ?? ""),
      slug: String(getValue(doc, "slug") ?? ""),
      status: String(getValue(doc, "status") ?? "draft"),
      featured: Boolean(getValue(doc, "featured") ?? false),
    });
  }

  async function saveQuickEdit() {
    if (!collection || !quickEditId) return;
    setQuickEditBusy(true);
    const data: Record<string, unknown> = {
      slug: quickEditData.slug,
      status: quickEditData.status,
      [quickEditTitleKey]: quickEditData.title,
    };
    if (quickEditShowsFeatured) {
      data.featured = quickEditData.featured;
    }
    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({ collection, data, id: quickEditId }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setQuickEditBusy(false);
    if (res.ok) {
      setQuickEditId(null);
      router.refresh();
    }
  }

  const visibleDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((doc) => {
      const text = tableColumns
        .map((col) => formatValue(getValue(doc, col.key)))
        .join(" ")
        .toLowerCase();
      const status = String(getValue(doc, "status") ?? "");
      const destText = formatValue(getValue(doc, "destinations")).toLowerCase();
      const country = String(getValue(doc, "country") ?? "");
      const typeText = [
        getValue(doc, "packageGroup"),
        getValue(doc, "category"),
        getValue(doc, "availability"),
      ]
        .map(formatValue)
        .join(" ")
        .toLowerCase();

      const matchesStatus =
        statusFilter === "__all"
          ? status !== "trashed"
          : status === statusFilter;
      const docCategoryId = relationId(getValue(doc, "category"));
      const docTagIds = relationIds(getValue(doc, "tags"));
      const matchesCategory =
        categoryFilter === "__all" || docCategoryId === categoryFilter;
      const matchesTag = tagFilter === "__all" || docTagIds.includes(tagFilter);

      return (
        (!q || text.includes(q)) &&
        matchesStatus &&
        matchesCategory &&
        matchesTag &&
        (destinationFilter === "__all" || destText.includes(destinationFilter)) &&
        (countryFilter === "__all" || country === countryFilter) &&
        (typeFilter === "__all" || typeText.includes(typeFilter))
      );
    });
  }, [
    categoryFilter,
    countryFilter,
    destinationFilter,
    docs,
    query,
    statusFilter,
    tableColumns,
    tagFilter,
    typeFilter,
  ]);

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
    if (!window.confirm("Are you sure you want to permanently delete this record? This action cannot be undone.")) return;
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
    if (!window.confirm(`Are you sure you want to move ${selectedIds.length} records to the trash?`)) return;
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

  async function emptyTrash() {
    if (!collection) return;
    const trashedIds = docs
      .filter((doc) => getValue(doc, "status") === "trashed")
      .map((doc) => String(doc.id));
    if (!trashedIds.length) return;
    if (
      !window.confirm(
        `Permanently delete all ${trashedIds.length} item${trashedIds.length === 1 ? "" : "s"} in trash? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusyId("empty-trash");
    await Promise.all(
      trashedIds.map((id) =>
        fetch("/api/portal/records", {
          body: JSON.stringify({ action: "delete", collection, id }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      ),
    );
    setBusyId(null);
    setSelectedIds([]);
    setStatusFilter("__all");
    router.refresh();
  }

  const trashedCount = docs.filter((d) => getValue(d, "status") === "trashed").length;

  const resolvedEditModuleSlug = editModuleSlug ?? moduleSlug;
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
    <div className="portal-table-card wp-style">
      {/* WordPress Subsubsub Navigation */}
      <ul className="wp-subsubsub">
        <li className="all">
          <a
            className={statusFilter === "__all" ? "current" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter("__all");
            }}
          >
            All <span className="count">({docs.filter((d) => getValue(d, "status") !== "trashed").length})</span>
          </a>{" "}
          |
        </li>
        <li className="published">
          <a
            className={statusFilter === "published" ? "current" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter("published");
            }}
          >
            Published{" "}
            <span className="count">
              ({docs.filter((d) => getValue(d, "status") === "published").length})
            </span>
          </a>
          {(docs.some((d) => getValue(d, "status") === "draft") || trashable) && " |"}
        </li>
        {docs.some((d) => getValue(d, "status") === "draft") && (
          <li className="draft">
            <a
              className={statusFilter === "draft" ? "current" : ""}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("draft");
              }}
            >
              Drafts{" "}
              <span className="count">
                ({docs.filter((d) => getValue(d, "status") === "draft").length})
              </span>
            </a>
            {trashable && " |"}
          </li>
        )}
        {trashable && (
          <li className="trash">
            <a
              className={statusFilter === "trashed" ? "current" : ""}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("trashed");
              }}
            >
              Trash{" "}
              <span className="count">({trashedCount})</span>
            </a>
            {statusFilter === "trashed" && trashedCount > 0 ? (
              <>
                {" "}
                |{" "}
                <button
                  className="wp-empty-trash"
                  disabled={busyId === "empty-trash"}
                  onClick={emptyTrash}
                  type="button"
                >
                  {busyId === "empty-trash" ? "Emptying…" : "Empty Trash"}
                </button>
              </>
            ) : null}
          </li>
        )}
      </ul>

      {/* Search Box */}
      <div className="wp-search-box">
        <input
          className="wp-search-input"
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${moduleSlug}…`}
          type="search"
          value={query}
        />
        <button className="wp-button" type="button">
          Search {moduleSlug}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="wp-filter-bar">
        <div className="wp-filter-bar-left">
          {trashable && (
            <>
              <select className="wp-select" defaultValue="bulk-actions">
                <option value="bulk-actions">Bulk actions</option>
                <option value="edit">Edit</option>
                <option value="trash">Move to Trash</option>
              </select>
              <button
                className="wp-button"
                disabled={selectedIds.length === 0}
                onClick={bulkTrash}
                type="button"
              >
                Apply
              </button>
            </>
          )}

          {/* Optional Module Specific Filters */}
          <select
            className="wp-select"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="__all">{moduleSlug === "posts" ? "All statuses" : "All dates"}</option>
            {moduleSlug === "posts" ? (
              <>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="trashed">Trash</option>
              </>
            ) : null}
          </select>

          {moduleSlug === "posts" && (
            <select
              className="wp-select"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="__all">All Categories</option>
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}

          {moduleSlug === "destinations" && (
            <select
              className="wp-select"
              onChange={(e) => setCountryFilter(e.target.value)}
              value={countryFilter}
            >
              <option value="__all">All countries</option>
              <option value="kenya">Kenya</option>
              <option value="tanzania">Tanzania</option>
            </select>
          )}

          {moduleSlug === "trips" && (
            <>
              <select
                className="wp-select"
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
                className="wp-select"
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
          )}

          <button className="wp-button" type="button">
            Filter
          </button>
        </div>
        <div className="wp-filter-bar-right">
          {visibleDocs.length} {visibleDocs.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* ── Table ────────────────────────────────── */}
      <div className="portal-table-wrap">
        <table className="wp-table">
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
            </tr>
          </thead>
          <tbody>
            {visibleDocs.map((doc) => {
              const status = getValue(doc, "status");
              const isTrashed = status === "trashed";
              const title = formatValue(getValue(doc, tableColumns[0]?.key ?? "id"));

              const isQuickEditing = quickEditId === String(doc.id);
              return (
                <Fragment key={String(doc.id)}>
                  <tr className="wp-row-hover">
                    {trashable ? (
                      <td className="col-check">
                        <input
                          aria-label={`Select ${title}`}
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
                      const isStatus =
                        col.key.toLowerCase().includes("status") || col.key === "availability";
                      const isBool = typeof value === "boolean";

                      if (ci === 0) {
                        const isDraft = String(getValue(doc, "status")) === "draft";
                        return (
                          <td className="is-primary" key={col.key}>
                            <Link className="row-title" href={`/admin/${resolvedEditModuleSlug}/${doc.id}`}>
                              {title}
                              {isDraft && <span style={{ fontWeight: 400, color: "#646970" }}> — Draft</span>}
                            </Link>
                            <div className="row-actions">
                              {!trashView && !isTrashed ? (
                                <>
                                  <span className="edit">
                                    <Link href={`/admin/${resolvedEditModuleSlug}/${doc.id}`}>
                                      Edit
                                    </Link>{" "}
                                    <span className="divider">|</span>
                                  </span>
                                  <span className="inline-edit">
                                    <button
                                      onClick={() =>
                                        isQuickEditing
                                          ? setQuickEditId(null)
                                          : openQuickEdit(doc)
                                      }
                                      type="button"
                                    >
                                      Quick Edit
                                    </button>{" "}
                                    <span className="divider">|</span>
                                  </span>
                                  <span className="trash">
                                    <button
                                      className="trash-action"
                                      onClick={() => updateStatus(doc.id, "trashed")}
                                      type="button"
                                    >
                                      Trash
                                    </button>{" "}
                                    <span className="divider">|</span>
                                  </span>
                                  <span className="view">
                                    <a
                                      href={
                                        moduleSlug === "destinations"
                                          ? `/destinations/${doc.slug}`
                                          : moduleSlug === "packages"
                                            ? `/safari-packages/${doc.slug}`
                                            : moduleSlug === "posts"
                                              ? `/blog/${doc.slug}`
                                              : moduleSlug === "trips"
                                                ? `/trips/${doc.slug}`
                                                : `/${doc.slug}`
                                      }
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      View
                                    </a>
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="restore">
                                    <button onClick={() => updateStatus(doc.id, "draft")} type="button">
                                      Restore
                                    </button>{" "}
                                    <span className="divider">|</span>
                                  </span>
                                  <span className="delete">
                                    <button
                                      className="trash-action"
                                      onClick={() => removeRecord(doc.id)}
                                      type="button"
                                    >
                                      Delete Permanently
                                    </button>
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={col.key}>
                          {isStatus || isBool ? <StatusBadge value={value} /> : formatValue(value)}
                        </td>
                      );
                    })}
                  </tr>
                  {isQuickEditing ? (
                    <tr className="inline-edit-row">
                      <td colSpan={colCount}>
                        <div className="quick-edit-panel">
                          <p className="quick-edit-panel__heading">Quick Edit</p>
                          <div className="quick-edit-fields">
                            <div className="quick-edit-field">
                              <label htmlFor={`qe-title-${doc.id}`}>{quickEditTitleLabel}</label>
                              <input
                                id={`qe-title-${doc.id}`}
                                onChange={(e) =>
                                  setQuickEditData((d) => ({ ...d, title: e.target.value }))
                                }
                                type="text"
                                value={quickEditData.title}
                              />
                            </div>
                            <div className="quick-edit-field">
                              <label htmlFor={`qe-slug-${doc.id}`}>Slug</label>
                              <input
                                id={`qe-slug-${doc.id}`}
                                onChange={(e) =>
                                  setQuickEditData((d) => ({ ...d, slug: e.target.value }))
                                }
                                type="text"
                                value={quickEditData.slug}
                              />
                            </div>
                            <div className="quick-edit-field">
                              <label htmlFor={`qe-status-${doc.id}`}>Status</label>
                              <select
                                id={`qe-status-${doc.id}`}
                                onChange={(e) =>
                                  setQuickEditData((d) => ({ ...d, status: e.target.value }))
                                }
                                value={quickEditData.status}
                              >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                              </select>
                            </div>
                            {quickEditShowsFeatured ? (
                              <label className="quick-edit-check">
                                <input
                                  checked={quickEditData.featured}
                                  onChange={(e) =>
                                    setQuickEditData((d) => ({ ...d, featured: e.target.checked }))
                                  }
                                  type="checkbox"
                                />
                                <span>Featured</span>
                              </label>
                            ) : null}
                          </div>
                          <div className="quick-edit-actions">
                            <button
                              className="quick-edit-save"
                              disabled={quickEditBusy}
                              onClick={saveQuickEdit}
                              type="button"
                            >
                              {quickEditBusy ? "Saving…" : "Update"}
                            </button>
                            <button
                              className="quick-edit-cancel"
                              onClick={() => setQuickEditId(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
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
