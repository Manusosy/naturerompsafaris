"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArticleTagsTable({
  docs,
  postCounts,
}: {
  docs: Array<Record<string, unknown>>;
  postCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleBulkApply() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} tag(s)?`)) return;

    setBusyId("bulk");
    await Promise.all(
      selectedIds.map((id) =>
        fetch("/api/portal/records", {
          body: JSON.stringify({ action: "delete", collection: "article-tags", id }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      ),
    );
    setBusyId(null);
    setSelectedIds([]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this tag?")) return;
    setBusyId(id);
    await fetch("/api/portal/records", {
      body: JSON.stringify({ action: "delete", collection: "article-tags", id }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="taxonomy-table-card">
      <div className="taxonomy-table-card__toolbar">
        <select onChange={(event) => setBulkAction(event.target.value)} value={bulkAction}>
          <option value="">Bulk actions</option>
          <option value="delete">Delete</option>
        </select>
        <button disabled={busyId === "bulk"} onClick={handleBulkApply} type="button">
          Apply
        </button>
      </div>

      <div className="portal-table-wrap">
        <table className="portal-table taxonomy-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  checked={docs.length > 0 && selectedIds.length === docs.length}
                  onChange={(event) =>
                    setSelectedIds(event.target.checked ? docs.map((doc) => String(doc.id)) : [])
                  }
                  type="checkbox"
                />
              </th>
              <th>Name</th>
              <th>Slug</th>
              <th className="taxonomy-table__count">Posts</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const id = String(doc.id);
              return (
                <tr className="wp-row-hover" key={id}>
                  <td className="col-check">
                    <input
                      checked={selectedIds.includes(id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, id]
                            : current.filter((value) => value !== id),
                        )
                      }
                      type="checkbox"
                    />
                  </td>
                  <td className="taxonomy-table__name">
                    <Link href={`/admin/article-tags/${id}`}>{String(doc.name ?? "Tag")}</Link>
                    <div className="row-actions">
                      <Link href={`/admin/article-tags/${id}`}>Edit</Link>
                      {" | "}
                      <button disabled={busyId === id} onClick={() => handleDelete(id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                  <td>{String(doc.slug ?? "")}</td>
                  <td className="taxonomy-table__count">
                    <Link href={`/admin/posts?tag=${id}`}>{postCounts[id] || 0}</Link>
                  </td>
                </tr>
              );
            })}
            {!docs.length ? (
              <tr>
                <td colSpan={4}>
                  <div className="portal-table-empty">
                    <strong>No tags yet.</strong>
                    <span>Add your first tag using the form on the left.</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
