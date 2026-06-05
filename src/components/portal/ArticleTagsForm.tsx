"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { slugify } from "@/lib/portal/format";

export function ArticleTagsForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/records", {
        body: JSON.stringify({
          collection: "article-tags",
          data: { name, slug: slug || slugify(name) },
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to create tag");
      }

      setName("");
      setSlug("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="taxonomy-panel">
      <h2 className="taxonomy-panel__title">Add New Tag</h2>
      <form className="taxonomy-panel__form" onSubmit={handleSubmit}>
        <label className="taxonomy-field">
          <span>Name</span>
          <input
            onChange={(event) => {
              setName(event.target.value);
              if (!slug) setSlug(slugify(event.target.value));
            }}
            required
            type="text"
            value={name}
          />
          <small>The name is how it appears on your site.</small>
        </label>

        <label className="taxonomy-field">
          <span>Slug</span>
          <input onChange={(event) => setSlug(event.target.value)} type="text" value={slug} />
          <small>URL-friendly version of the name. Usually lowercase with hyphens.</small>
        </label>

        {error ? <p className="portal-form__error">{error}</p> : null}

        <button className="taxonomy-panel__submit" disabled={busy} type="submit">
          {busy ? "Adding..." : "Add New Tag"}
        </button>
      </form>
    </div>
  );
}
