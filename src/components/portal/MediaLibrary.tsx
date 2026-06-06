"use client";

import { Grid2X2, List, Save, Search, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { formatValue } from "@/lib/portal/format";
import { normalizeMediaUrl } from "@/lib/cms-media";
import { fetchMoreMedia } from "@/app/(portal)/admin/(dashboard)/[module]/actions";

function imageUrl(doc: Record<string, unknown>) {
  const sizes = doc.sizes && typeof doc.sizes === "object" ? doc.sizes as Record<string, unknown> : {};
  const thumb = sizes.thumb && typeof sizes.thumb === "object" ? sizes.thumb as Record<string, unknown> : {};
  const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};
  return normalizeMediaUrl(String(thumb.url ?? card.url ?? doc.url ?? ""));
}

export function MediaLibrary({
  docs,
  page,
  totalPages,
  totalDocs,
}: {
  docs: Array<Record<string, unknown>>;
  page: number;
  totalPages: number;
  totalDocs?: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Record<string, unknown> | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [savingState, setSavingState] = useState(false);
  const [loadedDocs, setLoadedDocs] = useState(docs);
  const [currentPage, setCurrentPage] = useState(page);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync loadedDocs if initial docs prop changes (e.g. upload or delete changes the initial list)
  useEffect(() => {
    setLoadedDocs(docs);
    setCurrentPage(page);
  }, [docs, page]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return loadedDocs;
    return loadedDocs.filter((doc) =>
      [doc.alt, doc.caption, doc.filename, doc.seoTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [docs, query]);

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setUploading(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("file") as File[];

    let successCount = 0;
    const totalToUpload = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const singleFormData = new FormData();
      singleFormData.append("file", file);
      // Use filename as default alt for bulk
      singleFormData.append("alt", file.name);

      setMessage(`Uploading ${i + 1} of ${totalToUpload}...`);

      try {
        const response = await fetch("/api/portal/media", {
          body: singleFormData,
          credentials: "include",
          method: "POST",
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result.results && result.results[0]) {
          const m = result.results[0];
          const sizes = m.sizes && typeof m.sizes === "object" ? m.sizes as Record<string, unknown> : {};
          const thumb = sizes.thumb && typeof sizes.thumb === "object" ? sizes.thumb as Record<string, unknown> : {};
          const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};

          const newDoc = {
            alt: String(m.alt ?? ""),
            caption: m.caption ? String(m.caption) : "",
            filename: String(m.filename ?? ""),
            id: String(m.id),
            url: normalizeMediaUrl(String(card.url ?? m.url ?? thumb.url ?? "")),
            sizes: m.sizes,
          };

          setLoadedDocs((prev) => [newDoc as Record<string, unknown>, ...prev]);
          successCount++;
        }
      } catch (err) {
        console.error("Upload error for file", file.name, err);
      }
    }

    setUploading(false);
    form.reset();
    setMessage(`✓ Uploaded ${successCount} of ${totalToUpload} successfully!`);
    setTimeout(() => setMessage(""), 5000);
  }

  async function deleteMedia(id: string) {
    if (!confirm("Are you sure you want to delete this media?")) return;
    setMessage("");
    setSavingState(true);

    try {
      const response = await fetch("/api/portal/records", {
        body: JSON.stringify({
          action: "delete",
          collection: "media",
          id: String(id),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        method: "POST",
      });

      setSavingState(false);

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setMessage(result?.message || "Failed to delete media.");
        return;
      }

      setMessage("✓ Deleted successfully!");
      if (selectedDoc?.id === id) setSelectedDoc(null);
      setTimeout(() => setMessage(""), 3000);
      router.refresh();
    } catch (err) {
      setSavingState(false);
      setMessage("An unexpected error occurred.");
    }
  }

  async function saveMediaChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDoc) return;
    setMessage("");
    setSavingState(true);

    try {
      const response = await fetch("/api/portal/records", {
        body: JSON.stringify({
          collection: "media",
          id: String(selectedDoc.id),
          data: {
            alt: editAlt.trim(),
            caption: editCaption.trim(),
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        method: "POST",
      });

      setSavingState(false);

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setMessage(result?.message || "Failed to update media details. Please try again.");
        return;
      }

      setMessage("✓ Saved changes successfully!");
      const updatedDoc = { ...selectedDoc, alt: editAlt.trim(), caption: editCaption.trim() };
      setSelectedDoc(updatedDoc);

      setTimeout(() => setMessage(""), 3000);
      router.refresh();
    } catch (err) {
      setSavingState(false);
      setMessage("An unexpected error occurred.");
    }
  }

  return (
    <div className="media-library">
      <div className="media-library__bar">
        <label className="media-library__search">
          <Search size={18} />
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search media by alt, caption, file name..." value={query} />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {totalDocs !== undefined && (
            <span style={{ fontSize: "13px", color: "var(--p-muted)", fontWeight: "600" }}>
              Showing {loadedDocs.length} of {totalDocs} images
            </span>
          )}
          <div className="media-library__view">
            <button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} type="button"><Grid2X2 size={17} /> Grid</button>
            <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} type="button"><List size={17} /> List</button>
          </div>
        </div>
      </div>

      {selectedDoc ? (
        <form
          className="media-upload-card"
          onSubmit={saveMediaChanges}
          style={{
            alignItems: "flex-start",
            background: "var(--p-surface-2)",
            border: "1.5px solid var(--p-line)",
            borderRadius: "var(--p-radius)",
          }}
        >
          <div className="media-upload-card__row">
            <div className="media-upload-card__preview">
              <Image alt="Selected" fill src={imageUrl(selectedDoc)} style={{ objectFit: "cover" }} />
            </div>
            <div className="media-upload-card__body">
              <div className="media-upload-card__head">
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "bold", display: "block", color: "var(--p-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    EDITING MEDIA
                  </span>
                  <p style={{ fontSize: "14px", margin: "2px 0 0", color: "var(--p-ink)", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {String(selectedDoc.filename || "")}
                  </p>
                </div>
                <div className="media-upload-card__actions">
                  <button className="portal-button" disabled={savingState} type="submit" style={{ background: "var(--p-green-800)", minHeight: "44px" }}>
                    <Save size={16} /> {savingState ? "Saving..." : "Save changes"}
                  </button>
                  <button className="portal-button portal-button--secondary" onClick={() => setSelectedDoc(null)} type="button" style={{ minHeight: "44px" }}>
                    <X size={16} /> Cancel
                  </button>
                  <button
                    className="portal-button"
                    onClick={() => deleteMedia(String(selectedDoc.id))}
                    type="button"
                    style={{ background: "var(--p-brown)", minHeight: "44px" }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>

              <div className="media-upload-card__fields">
                <label className="portal-field">
                  <span>Alt text</span>
                  <input
                    name="alt"
                    placeholder="Describe the image for SEO and accessibility"
                    required
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                  />
                </label>
                <label className="portal-field">
                  <span>Caption</span>
                  <input
                    name="caption"
                    placeholder="Optional caption for articles"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                  />
                </label>
              </div>
              {message ? <p style={{ margin: 0, color: "var(--p-green-800)", fontWeight: "bold", fontSize: "13px" }}>{message}</p> : null}
            </div>
          </div>
        </form>
      ) : (
        <form className="media-upload-card" onSubmit={uploadMedia}>
          <label>
            <span>Upload image(s)</span>
            <input accept="image/*" name="file" required type="file" multiple />
          </label>
          <label>
            <span>Alt text</span>
            <input name="alt" placeholder="Describe the image for SEO and accessibility" required />
          </label>
          <label>
            <span>Caption</span>
            <input name="caption" placeholder="Optional caption for articles" />
          </label>
          <button className="portal-button" disabled={uploading} type="submit">
            <Upload size={17} /> {uploading ? "Uploading..." : "Upload"}
          </button>
          {message ? <p style={{ gridColumn: "span 4", margin: "4px 0 0" }}>{message}</p> : null}
        </form>
      )}

      {view === "grid" ? (
        <div className="media-grid">
          {filtered.map((doc) => {
            const src = imageUrl(doc);
            const isSelected = selectedDoc && selectedDoc.id === doc.id;
            return (
              <article
                className={`media-card ${isSelected ? "is-selected" : ""}`}
                key={String(doc.id)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName === "A" || (e.target as HTMLElement).closest("a")) return;
                  setSelectedDoc(doc);
                  setEditAlt(String(doc.alt ?? ""));
                  setEditCaption(String(doc.caption ?? ""));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{ cursor: "pointer" }}
              >
                {src ? <Image alt={String(doc.alt ?? "")} height={220} src={src} width={320} /> : <div className="media-card__empty">No preview</div>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Alt</th>
                <th>Caption</th>
                <th>Type</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const src = imageUrl(doc);
                const isSelected = selectedDoc && selectedDoc.id === doc.id;
                return (
                  <tr
                    key={String(doc.id)}
                    className={isSelected ? "is-selected-row" : ""}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "A" || (e.target as HTMLElement).closest("a")) return;
                      setSelectedDoc(doc);
                      setEditAlt(String(doc.alt ?? ""));
                      setEditCaption(String(doc.caption ?? ""));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{src ? <Image alt={String(doc.alt ?? "")} height={54} src={src} width={72} /> : "-"}</td>
                    <td>{formatValue(doc.alt)}</td>
                    <td>{formatValue(doc.caption)}</td>
                    <td>{formatValue(doc.mimeType)}</td>
                    <td>{formatValue(doc.updatedAt)}</td>
                    <td><Link className="portal-table__action" href={`/admin/media/${doc.id}`} onClick={(e) => e.stopPropagation()}>Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {currentPage < totalPages ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
          <button
            className="portal-button"
            onClick={async () => {
              setLoadingMore(true);
              try {
                const nextDocs = await fetchMoreMedia(currentPage + 1);
                setLoadedDocs((prev) => {
                  // filter out duplicates just in case
                  const newIds = new Set(nextDocs.map(d => String(d.id)));
                  const filteredPrev = prev.filter(p => !newIds.has(String(p.id)));
                  return [...filteredPrev, ...nextDocs as Array<Record<string, unknown>>];
                });
                setCurrentPage((p) => p + 1);
              } catch (err) {
                console.error("Failed to load more media", err);
              } finally {
                setLoadingMore(false);
              }
            }}
            disabled={loadingMore}
            type="button"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
