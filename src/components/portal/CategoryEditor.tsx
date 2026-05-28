"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { slugify } from "@/lib/portal/format";

function fieldValue(document: Record<string, unknown> | undefined, key: string) {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, document);
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function CategoryEditor({ document }: { document?: Record<string, unknown> }) {
  const router = useRouter();
  const [name, setName] = useState(fieldValue(document, "name"));
  const [slug, setSlug] = useState(fieldValue(document, "slug"));
  const [description, setDescription] = useState(fieldValue(document, "description"));
  const [seoDescription, setSeoDescription] = useState(fieldValue(document, "seo.description"));
  const [keywords, setKeywords] = useState(fieldValue(document, "seo.keywords"));
  const [canonicalSlug, setCanonicalSlug] = useState(fieldValue(document, "seo.canonicalSlug"));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    setSaving(true);
    const response = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "post-categories",
        data: {
          description,
          name,
          seo: {
            canonicalSlug,
            description: seoDescription,
            keywords,
          },
          slug: slugify(slug || name),
        },
        id: document?.id ? String(document.id) : undefined,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message || "Unable to save this category.");
      return;
    }
    router.push("/admin/post-categories");
    router.refresh();
  }

  return (
    <div className="article-workspace">
      <div className="portal-breadcrumb">Dashboard / Articles / Categories / {document?.id ? "Edit Category" : "New Category"}</div>
      <div className="article-workspace__head">
        <h2>{document?.id ? "Edit Category" : "New Category"}</h2>
        <button className="portal-button" disabled={saving} onClick={save} type="button">
          <Save size={18} /> {saving ? "Saving..." : "Save category"}
        </button>
      </div>
      <div className="article-layout">
        <main className="article-main">
          <section className="portal-panel">
            <h3>Category</h3>
            <label className="portal-field">
              <span>Name</span>
              <input onBlur={() => setSlug((value) => value || slugify(name))} onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label className="portal-field">
              <span>Slug</span>
              <input onChange={(event) => setSlug(event.target.value)} value={slug} />
            </label>
            <label className="portal-field">
              <span>Description</span>
              <textarea onChange={(event) => setDescription(event.target.value)} rows={5} value={description} />
            </label>
          </section>
        </main>
        <aside className="article-side">
          <section>
            <h3>SEO</h3>
            <label className="portal-field">
              <span>SEO description</span>
              <textarea onChange={(event) => setSeoDescription(event.target.value)} rows={5} value={seoDescription} />
            </label>
            <label className="portal-field">
              <span>Keywords</span>
              <input onChange={(event) => setKeywords(event.target.value)} value={keywords} />
            </label>
            <label className="portal-field">
              <span>Canonical slug</span>
              <input onChange={(event) => setCanonicalSlug(event.target.value)} value={canonicalSlug} />
            </label>
          </section>
        </aside>
      </div>
      {error ? <p className="portal-form__error">{error}</p> : null}
    </div>
  );
}
