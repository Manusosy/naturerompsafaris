"use client";

import { Save, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";
import { RichTextField } from "@/components/portal/RichTextField";
import { slugify } from "@/lib/portal/format";

type Option = { label: string; value: string };
type MediaOption = PortalMediaOption;

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

function fieldValue(document: Record<string, unknown> | undefined, key: string) {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, document);
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function payloadId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : value;
}

export function ArticleEditor({
  categories,
  document,
  media,
  tags,
}: {
  categories: Option[];
  document?: Record<string, unknown>;
  media: MediaOption[];
  tags: Option[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(fieldValue(document, "title"));
  const [slug, setSlug] = useState(fieldValue(document, "slug"));
  const [body, setBody] = useState(fieldValue(document, "body"));
  const [excerpt, setExcerpt] = useState(fieldValue(document, "excerpt"));
  const [status, setStatus] = useState(fieldValue(document, "status") || "draft");
  const [category, setCategory] = useState(relationId(document?.category) || "__none");
  const [selectedTags, setSelectedTags] = useState(relationIds(document?.tags));
  const [featured, setFeatured] = useState(document?.featured === true);
  const [coverImage, setCoverImage] = useState(relationId(document?.image));
  const [imageCaption, setImageCaption] = useState(fieldValue(document, "imageCaption"));
  const [keywords, setKeywords] = useState(fieldValue(document, "seo.keywords"));
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [tagOptions, setTagOptions] = useState(tags);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [taxonomyBusy, setTaxonomyBusy] = useState<"category" | "tag" | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");

  const canonicalPath = useMemo(() => `/blog/${slugify(slug || title || "article-slug")}`, [slug, title]);
  const existingPublishedAt = fieldValue(document, "publishedAt");
  const selectedCover = media.find((item) => item.id === coverImage);

  function toggleTag(tagId: string) {
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setTaxonomyBusy("category");
    setError("");

    const response = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "post-categories",
        data: { name, slug: slugify(name) },
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json().catch(() => null);
    setTaxonomyBusy(null);

    if (!response.ok) {
      setError(result?.message || "Unable to create category.");
      return;
    }

    const id = String(result?.result?.id ?? "");
    if (!id) return;

    const option = { label: name, value: id };
    setCategoryOptions((current) => [...current, option]);
    setCategory(id);
    setNewCategoryName("");
    setShowNewCategory(false);
  }

  async function createTag() {
    const name = newTagName.trim();
    if (!name) return;
    setTaxonomyBusy("tag");
    setError("");

    const response = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "article-tags",
        data: { name, slug: slugify(name) },
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json().catch(() => null);
    setTaxonomyBusy(null);

    if (!response.ok) {
      setError(result?.message || "Unable to create tag.");
      return;
    }

    const id = String(result?.result?.id ?? "");
    if (!id) return;

    const option = { label: name, value: id };
    setTagOptions((current) => [...current, option]);
    setSelectedTags((current) => [...current, id]);
    setNewTagName("");
    setShowNewTag(false);
  }

  async function save(nextStatus: "draft" | "published") {
    setError("");
    setSaving(nextStatus);
    setStatus(nextStatus);
    const finalSlug = slugify(slug || title || `draft-${Date.now()}`);

    if (nextStatus === "published") {
      const missing: string[] = [];
      if (!title.trim()) missing.push("Title");
      if (!excerpt.trim()) missing.push("Meta description / excerpt");
      if (!body.replace(/<[^>]+>/g, "").trim()) missing.push("Article body");
      if (missing.length > 0) {
        setError(`Please fill in the following fields before publishing: ${missing.join(", ")}`);
        setSaving("idle");
        setStatus(fieldValue(document, "status") || "draft");
        return;
      }
    }

    const response = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "posts",
        data: {
          body,
          category: category === "__none" ? undefined : payloadId(category),
          excerpt: excerpt || undefined,
          featured,
          image: coverImage ? payloadId(coverImage) : undefined,
          imageCaption: imageCaption || undefined,
          publishedAt:
            nextStatus === "published"
              ? existingPublishedAt || new Date().toISOString()
              : existingPublishedAt || undefined,
          seo: {
            canonicalSlug: finalSlug,
            keywords: keywords || undefined,
            metaDescription: excerpt || undefined,
            metaTitle: title || undefined,
          },
          slug: finalSlug,
          status: nextStatus,
          tags: selectedTags.map(payloadId),
          title: title || undefined,
        },
        id: document?.id ? String(document.id) : undefined,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json().catch(() => null);
    setSaving("idle");

    if (!response.ok) {
      setError(result?.message || "Unable to save this article.");
      return;
    }

    if (nextStatus === "draft") {
      const recordId = result?.result?.id;
      if (!document?.id && recordId) {
        router.push(`/admin/posts/${recordId}`);
      } else {
        router.refresh();
      }
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <div className="article-workspace">
      <div className="portal-breadcrumb">
        Dashboard / Articles / {document?.id ? "Edit Article" : "Add New"}
      </div>

      <div className="article-workspace__head">
        <h2>{document?.id ? "Edit Article" : "Add New Article"}</h2>
        <div className="article-workspace__actions">
          <button
            className="portal-button portal-button--secondary"
            disabled={saving !== "idle"}
            onClick={() => save("draft")}
            type="button"
          >
            <Save size={18} /> {saving === "draft" ? "Saving..." : "Save Draft"}
          </button>
          <button
            className="portal-button"
            disabled={saving !== "idle"}
            onClick={() => save("published")}
            type="button"
          >
            <Send size={18} /> {saving === "published" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="article-layout">
        <main className="article-main">
          <input
            className="article-title-input"
            onBlur={() => setSlug((value) => value || slugify(title))}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add title"
            value={title}
          />
          <p className="article-canonical-preview">
            Permalink: <strong>{canonicalPath}</strong>
          </p>

          <RichTextField
            defaultValue={body}
            key={document?.id ? String(document.id) : "new-article"}
            media={media}
            name="body"
            onChange={setBody}
          />
        </main>

        <aside className="article-side">
          <section className="article-metabox">
            <div className="article-metabox__head">Publish</div>
            <div className="article-metabox__body">
              <label className="portal-field">
                <span>Status</span>
                <select onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="article-switch">
                <span>Featured article</span>
                <input
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className="portal-field">
                <span>Slug</span>
                <input onChange={(event) => setSlug(slugify(event.target.value))} value={slug} />
              </label>
              <div className="article-status-readout">
                <span>
                  {status === "published"
                    ? "Published articles are visible on the blog."
                    : "Draft articles stay hidden until you publish."}
                </span>
              </div>
            </div>
            <div className="article-metabox__footer">
              <button
                className="portal-button portal-button--secondary"
                disabled={saving !== "idle"}
                onClick={() => save("draft")}
                type="button"
              >
                Save Draft
              </button>
              <button
                className="portal-button"
                disabled={saving !== "idle"}
                onClick={() => save("published")}
                type="button"
              >
                Publish
              </button>
            </div>
          </section>

          <section className="article-metabox">
            <div className="article-metabox__head">Featured image</div>
            <div className="article-metabox__body">
              {selectedCover?.thumbUrl || selectedCover?.url ? (
                <div className="article-featured-preview">
                  <Image
                    alt={selectedCover.alt || title || "Article cover"}
                    height={180}
                    src={selectedCover.thumbUrl || selectedCover.url || ""}
                    unoptimized
                    width={280}
                  />
                </div>
              ) : null}
              <MediaPickerField
                initialValues={coverImage ? [coverImage] : []}
                label={coverImage ? "Change image" : "Set featured image"}
                onChange={(ids) => setCoverImage(ids[0] || "")}
                options={media}
              />
              <input
                onChange={(event) => setImageCaption(event.target.value)}
                placeholder="Image caption (optional)"
                value={imageCaption}
              />
            </div>
          </section>

          <section className="article-metabox">
            <div className="article-metabox__head">Categories</div>
            <div className="article-metabox__body">
              <div className="article-taxonomy-list">
                <label className="article-taxonomy-option">
                  <input
                    checked={category === "__none"}
                    name="article-category"
                    onChange={() => setCategory("__none")}
                    type="radio"
                  />
                  <span>Uncategorized</span>
                </label>
                {categoryOptions.map((item) => (
                  <label className="article-taxonomy-option" key={item.value}>
                    <input
                      checked={category === item.value}
                      name="article-category"
                      onChange={() => setCategory(item.value)}
                      type="radio"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="article-taxonomy-add">
                <button
                  className="article-taxonomy-add__toggle"
                  onClick={() => setShowNewCategory((value) => !value)}
                  type="button"
                >
                  {showNewCategory ? "Cancel" : "+ Add New Category"}
                </button>
                {showNewCategory ? (
                  <>
                    <input
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      placeholder="New category name"
                      value={newCategoryName}
                    />
                    <button
                      disabled={taxonomyBusy === "category"}
                      onClick={createCategory}
                      type="button"
                    >
                      {taxonomyBusy === "category" ? "Adding..." : "Add Category"}
                    </button>
                  </>
                ) : null}
              </div>
              <Link className="article-metabox__link" href="/admin/post-categories">
                Manage categories
              </Link>
            </div>
          </section>

          <section className="article-metabox">
            <div className="article-metabox__head">Tags</div>
            <div className="article-metabox__body">
              <div className="article-taxonomy-list">
                {tagOptions.length ? (
                  tagOptions.map((item) => (
                    <label className="article-taxonomy-option" key={item.value}>
                      <input
                        checked={selectedTags.includes(item.value)}
                        onChange={() => toggleTag(item.value)}
                        type="checkbox"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))
                ) : (
                  <p className="article-status-readout">
                    <span>No tags yet. Add one below.</span>
                  </p>
                )}
              </div>
              <div className="article-taxonomy-add">
                <button
                  className="article-taxonomy-add__toggle"
                  onClick={() => setShowNewTag((value) => !value)}
                  type="button"
                >
                  {showNewTag ? "Cancel" : "+ Add New Tag"}
                </button>
                {showNewTag ? (
                  <>
                    <input
                      onChange={(event) => setNewTagName(event.target.value)}
                      placeholder="New tag name"
                      value={newTagName}
                    />
                    <button disabled={taxonomyBusy === "tag"} onClick={createTag} type="button">
                      {taxonomyBusy === "tag" ? "Adding..." : "Add Tag"}
                    </button>
                  </>
                ) : null}
              </div>
              <Link className="article-metabox__link" href="/admin/article-tags">
                Manage tags
              </Link>
            </div>
          </section>

          <section className="article-metabox">
            <div className="article-metabox__head">Excerpt & SEO</div>
            <div className="article-metabox__body">
              <label className="article-card-field">
                <span>Excerpt</span>
                <textarea
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="Short summary for cards and search results"
                  rows={4}
                  value={excerpt}
                />
              </label>
              <label className="article-card-field">
                <span>Keywords</span>
                <input
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="Kenya safari, Tanzania safari"
                  value={keywords}
                />
              </label>
            </div>
          </section>
        </aside>
      </div>

      {error ? <p className="portal-form__error">{error}</p> : null}
    </div>
  );
}
