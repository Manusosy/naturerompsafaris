"use client";

import { Grid2X2, List, Search, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatValue } from "@/lib/portal/format";

function imageUrl(doc: Record<string, unknown>) {
  const sizes = doc.sizes && typeof doc.sizes === "object" ? doc.sizes as Record<string, unknown> : {};
  const thumb = sizes.thumb && typeof sizes.thumb === "object" ? sizes.thumb as Record<string, unknown> : {};
  const card = sizes.card && typeof sizes.card === "object" ? sizes.card as Record<string, unknown> : {};
  return String(thumb.url ?? card.url ?? doc.url ?? "");
}

export function MediaLibrary({
  docs,
  page,
  totalPages,
}: {
  docs: Array<Record<string, unknown>>;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return docs;
    return docs.filter((doc) =>
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
    const response = await fetch("/api/portal/media", {
      body: new FormData(form),
      credentials: "include",
      method: "POST",
    });
    setUploading(false);
    if (!response.ok) {
      setMessage("Upload failed. Use Internal CMS if this file needs advanced processing.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <div className="media-library">
      <div className="media-library__bar">
        <label className="media-library__search">
          <Search size={18} />
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search media by alt, caption, file name..." value={query} />
        </label>
        <div className="media-library__view">
          <button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} type="button"><Grid2X2 size={17} /> Grid</button>
          <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} type="button"><List size={17} /> List</button>
        </div>
      </div>

      <form className="media-upload-card" onSubmit={uploadMedia}>
        <label>
          <span>Upload image</span>
          <input accept="image/*" name="file" required type="file" />
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
        {message ? <p>{message}</p> : null}
      </form>

      {view === "grid" ? (
        <div className="media-grid">
          {filtered.map((doc) => {
            const src = imageUrl(doc);
            return (
              <article className="media-card" key={String(doc.id)}>
                {src ? <Image alt={String(doc.alt ?? "")} height={220} src={src} width={320} /> : <div className="media-card__empty">No preview</div>}
                <div>
                  <strong>{formatValue(doc.alt)}</strong>
                  <span>{formatValue(doc.caption)}</span>
                  <small>{formatValue(doc.filename)} - {formatValue(doc.mimeType)}</small>
                  <Link href={`/admin/media/${doc.id}`}>Edit metadata</Link>
                </div>
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
                return (
                  <tr key={String(doc.id)}>
                    <td>{src ? <Image alt={String(doc.alt ?? "")} height={54} src={src} width={72} /> : "-"}</td>
                    <td>{formatValue(doc.alt)}</td>
                    <td>{formatValue(doc.caption)}</td>
                    <td>{formatValue(doc.mimeType)}</td>
                    <td>{formatValue(doc.updatedAt)}</td>
                    <td><Link className="portal-table__action" href={`/admin/media/${doc.id}`}>Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="portal-pagination">
          <Link aria-disabled={page <= 1} href={`?page=${Math.max(1, page - 1)}`}>Previous</Link>
          <span>Page {page} of {totalPages}</span>
          <Link aria-disabled={page >= totalPages} href={`?page=${Math.min(totalPages, page + 1)}`}>Next</Link>
        </div>
      ) : null}
    </div>
  );
}
