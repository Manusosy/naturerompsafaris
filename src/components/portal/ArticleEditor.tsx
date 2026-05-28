"use client";

import {
  Bold,
  Code,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Save,
  Send,
  Strikethrough,
  Table as TableIcon,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table as TableExtension } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";

import { slugify } from "@/lib/portal/format";

type Option = { label: string; value: string };
type MediaOption = {
  alt: string;
  caption: string;
  filename: string;
  id: string;
  thumbUrl: string;
  url: string;
};

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
  const value = document?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
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
  const [excerpt, setExcerpt] = useState(fieldValue(document, "excerpt"));
  const [category, setCategory] = useState(relationId(document?.category) || "__none");
  const [selectedTags, setSelectedTags] = useState(relationIds(document?.tags));
  const [publishedAt, setPublishedAt] = useState(fieldValue(document, "publishedAt").slice(0, 16));
  const [featured, setFeatured] = useState(document?.featured === true);
  const [coverImage, setCoverImage] = useState(relationId(document?.image) || "__none");
  const [imageCaption, setImageCaption] = useState(fieldValue(document, "imageCaption"));
  const [metaTitle, setMetaTitle] = useState(fieldValue(document, "metaTitle"));
  const [metaDescription, setMetaDescription] = useState(fieldValue(document, "metaDescription"));
  const [keywords, setKeywords] = useState(fieldValue(document, "keywords"));
  const [canonicalSlug, setCanonicalSlug] = useState(fieldValue(document, "canonicalSlug"));
  const [insertMediaId, setInsertMediaId] = useState(media[0]?.id ?? "__none");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension.configure({ inline: false }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: fieldValue(document, "body"),
    editorProps: {
      attributes: {
        class: "article-editor__canvas",
      },
    },
    immediatelyRender: false,
  });

  const editorText = editor?.getText() ?? "";
  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;

  const selectedCover = media.find((item) => item.id === coverImage);

  function setLink(external = false) {
    const href = window.prompt(external ? "Paste external URL" : "Paste internal path, for example /blog");
    if (!href) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  function insertSelectedImage() {
    const selected = media.find((item) => item.id === insertMediaId);
    const src = selected?.url || window.prompt("Paste image URL");
    if (!src) return;
    editor?.chain().focus().setImage({ src, alt: selected?.alt || "" }).run();
  }

  async function save(status: "draft" | "published") {
    setError("");
    setSaving(status);
    const finalSlug = slugify(slug || title);
    const response = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "posts",
        data: {
          body: editor?.getHTML() ?? "",
          canonicalSlug,
          category: category === "__none" ? undefined : category,
          excerpt,
          featured,
          image: coverImage === "__none" ? undefined : coverImage,
          imageCaption,
          keywords,
          metaDescription,
          metaTitle,
          publishedAt: publishedAt || new Date().toISOString(),
          slug: finalSlug,
          status,
          tags: selectedTags,
          title,
        },
        id: document?.id ? String(document.id) : undefined,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setSaving("idle");

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message || "Unable to save this article.");
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <div className="article-workspace">
      <div className="portal-breadcrumb">Dashboard / Articles / {document?.id ? "Edit Article" : "New Article"}</div>
      <div className="article-workspace__head">
        <h2>{document?.id ? "Edit Article" : "New Article"}</h2>
        <div className="article-workspace__actions">
          <button className="portal-button portal-button--secondary" disabled={saving !== "idle"} onClick={() => save("draft")} type="button">
            <Save size={18} /> {saving === "draft" ? "Saving..." : "Save Draft"}
          </button>
          <button className="portal-button" disabled={saving !== "idle"} onClick={() => save("published")} type="button">
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
            placeholder="Article Title"
            value={title}
          />

          <div className="article-editor">
            <div className="article-editor__toolbar">
              <button onClick={() => editor?.chain().focus().undo().run()} type="button"><Undo2 size={17} /></button>
              <button onClick={() => editor?.chain().focus().redo().run()} type="button"><Redo2 size={17} /></button>
              <span />
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} type="button"><Heading1 size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} type="button"><Heading2 size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} type="button"><Heading3 size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleBold().run()} type="button"><Bold size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleItalic().run()} type="button"><Italic size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleUnderline().run()} type="button"><UnderlineIcon size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleStrike().run()} type="button"><Strikethrough size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleCode().run()} type="button"><Code size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleBulletList().run()} type="button"><List size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} type="button"><ListOrdered size={17} /></button>
              <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} type="button"><Quote size={17} /></button>
              <button onClick={() => editor?.chain().focus().setHorizontalRule().run()} type="button"><Pilcrow size={17} /></button>
              <button onClick={() => setLink(false)} type="button"><LinkIcon size={17} /></button>
              <button onClick={() => setLink(true)} type="button"><ExternalLink size={17} /></button>
              <select aria-label="Select media to insert" onChange={(event) => setInsertMediaId(event.target.value)} value={insertMediaId}>
                <option value="__none">Media</option>
                {media.map((item) => <option key={item.id} value={item.id}>{item.alt || item.filename}</option>)}
              </select>
              <button onClick={insertSelectedImage} type="button"><ImagePlus size={17} /></button>
              <button onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} type="button"><TableIcon size={17} /></button>
              <strong>{wordCount} words</strong>
            </div>
            <EditorContent editor={editor} />
          </div>

          <label className="article-card-field">
            <span>Excerpt <small>(optional, 1-2 sentences)</small></span>
            <textarea onChange={(event) => setExcerpt(event.target.value)} placeholder="A short summary that appears in article cards and previews..." rows={4} value={excerpt} />
          </label>

          <section className="article-card-field">
            <span>SEO Metadata</span>
            <input onChange={(event) => setMetaTitle(event.target.value)} placeholder="SEO title" value={metaTitle} />
            <textarea onChange={(event) => setMetaDescription(event.target.value)} placeholder="SEO description" rows={3} value={metaDescription} />
            <input onChange={(event) => setKeywords(event.target.value)} placeholder="Keywords" value={keywords} />
            <input onChange={(event) => setCanonicalSlug(event.target.value)} placeholder="Canonical slug" value={canonicalSlug} />
          </section>
        </main>

        <aside className="article-side">
          <section>
            <h3>Publish Settings</h3>
            <label className="article-switch">
              <span>Published</span>
              <input checked={saving === "published"} readOnly type="checkbox" />
            </label>
            <label className="article-switch">
              <span>Featured</span>
              <input checked={featured} onChange={(event) => setFeatured(event.target.checked)} type="checkbox" />
            </label>
            <label className="portal-field">
              <span>Publish Date</span>
              <input onChange={(event) => setPublishedAt(event.target.value)} type="datetime-local" value={publishedAt} />
            </label>
            <label className="portal-field">
              <span>Slug</span>
              <input onChange={(event) => setSlug(event.target.value)} value={slug} />
            </label>
          </section>

          <section>
            <h3>Category</h3>
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="__none">- No category -</option>
              {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <Link href="/admin/post-categories">Manage all categories</Link>
          </section>

          <section>
            <h3>Tags</h3>
            <select multiple onChange={(event) => setSelectedTags(Array.from(event.target.selectedOptions).map((item) => item.value))} value={selectedTags}>
              {tags.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <Link href="/admin/article-tags">Manage tags</Link>
          </section>

          <section>
            <h3>Cover Image</h3>
            <select onChange={(event) => setCoverImage(event.target.value)} value={coverImage}>
              <option value="__none">Select cover image</option>
              {media.map((item) => <option key={item.id} value={item.id}>{item.alt || item.filename}</option>)}
            </select>
            <div className="article-cover-box">
              {selectedCover?.thumbUrl ? (
                <Image alt={selectedCover.alt || "Cover image"} height={210} src={selectedCover.thumbUrl} width={320} />
              ) : (
                <ImagePlus size={34} />
              )}
              <strong>{selectedCover ? "Cover selected" : "Select cover image"}</strong>
            </div>
            <input onChange={(event) => setImageCaption(event.target.value)} placeholder="Cover caption" value={imageCaption} />
          </section>
        </aside>
      </div>

      {error ? <p className="portal-form__error">{error}</p> : null}
    </div>
  );
}
