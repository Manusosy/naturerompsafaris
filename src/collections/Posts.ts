import type { CollectionConfig, FieldHook } from "payload";

import { anyone, editorOrAdmin } from "../lib/access";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventure.com";

const canonicalUrlHook: FieldHook = ({ data, value }) => {
  const slug = data?.slug as string | undefined;
  if (slug) return `${siteUrl}/blog/${slug}`;
  return value as string | undefined;
};

export const Posts: CollectionConfig = {
  slug: "posts",
  access: {
    read: anyone,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "category", "publishedAt"],
    group: "Content",
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
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
    { name: "excerpt", type: "textarea", required: true },
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
        { name: "metaTitle", type: "text" },
        { name: "metaDescription", type: "textarea" },
        { name: "keywords", type: "text" },
        {
          name: "canonicalUrl",
          label: "Canonical URL (auto-filled)",
          type: "text",
          admin: {
            readOnly: true,
            description: "Auto-generated from slug. Format: {site}/blog/{slug}",
          },
          hooks: { beforeChange: [canonicalUrlHook] },
        },
        { name: "openGraphImage", type: "upload", relationTo: "media" },
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
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
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
