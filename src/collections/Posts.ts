import type { CollectionBeforeChangeHook, CollectionConfig, FieldHook } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventures.com";

const canonicalUrlHook: FieldHook = ({ data, value }) => {
  const slug = data?.slug as string | undefined;
  if (slug) return `${siteUrl}/blog/${slug}`;
  return value as string | undefined;
};

const normalizeArticlePublishing: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const next = { ...data };
  const title = typeof next.title === "string" ? next.title : originalDoc?.title;
  const excerpt = typeof next.excerpt === "string" ? next.excerpt : originalDoc?.excerpt;
  const slug = typeof next.slug === "string" ? next.slug : originalDoc?.slug;
  const status = typeof next.status === "string" ? next.status : originalDoc?.status;
  const previousSeo = next.seo && typeof next.seo === "object" ? next.seo as Record<string, unknown> : {};

  next.seo = {
    ...previousSeo,
    canonicalSlug: slug,
    metaDescription: excerpt,
    metaTitle: title,
  };

  if (status === "published" && !next.publishedAt && !originalDoc?.publishedAt) {
    next.publishedAt = new Date().toISOString();
  }

  if (!next.category && !originalDoc?.category) {
    try {
      const cats = await req.payload.find({
        collection: "post-categories",
        where: { slug: { equals: "uncategorized" } },
        limit: 1,
      });
      if (cats.docs.length > 0) {
        next.category = cats.docs[0].id;
      } else {
        const newCat = await req.payload.create({
          collection: "post-categories",
          data: { name: "Uncategorized", slug: "uncategorized", description: "Default category" },
        });
        next.category = newCat.id;
      }
    } catch (err) {
      console.error("Failed to assign default category", err);
    }
  }

  return next;
};

export const Posts: CollectionConfig = {
  slug: "posts",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "category", "publishedAt"],
    group: "Content",
  },
  hooks: {
    beforeChange: [normalizeArticlePublishing],
  },
  fields: [
    { name: "title", type: "text" },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description: "URL-friendly identifier — lowercase, hyphens only.",
      },
    },
    {
      name: "slugPreview",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/components/admin/SlugDisplay",
            exportName: "SlugDisplay",
            clientProps: { urlPrefix: "/blog" },
          },
        },
      },
    },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "imageAlt", type: "text" },
    { name: "imageCaption", type: "text" },
    { name: "excerpt", type: "textarea" },
    {
      name: "body",
      type: "textarea",
      admin: {
        description:
          "Use short paragraphs, headings, internal links, FAQs and direct answers. Markdown-style formatting is supported by the custom portal.",
      },
    },
    {
      name: "seo",
      type: "group",
      label: "SEO & Metadata",
      fields: [
        { name: "metaTitle", type: "text", admin: { hidden: true } },
        { name: "metaDescription", type: "textarea", admin: { hidden: true } },
        { name: "keywords", type: "text" },
        { name: "canonicalSlug", type: "text", admin: { hidden: true } },
        {
          name: "canonicalUrl",
          label: "Canonical URL (auto-filled)",
          type: "text",
          admin: {
            hidden: true,
            readOnly: true,
            description: "Auto-generated from slug. Format: {site}/blog/{slug}",
          },
          hooks: { beforeChange: [canonicalUrlHook] },
        },
        { name: "openGraphImage", type: "upload", relationTo: "media", admin: { hidden: true } },
      ],
    },

    // Sidebar fields
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Trashed", value: "trashed" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    { name: "publishedAt", type: "date", admin: { hidden: true, position: "sidebar" } },
    {
      name: "category",
      type: "relationship",
      relationTo: "post-categories",
      admin: { position: "sidebar" },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "article-tags",
      hasMany: true,
      admin: { position: "sidebar" },
    },
  ],
};
