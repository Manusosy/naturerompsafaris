import type { CollectionConfig, FieldHook } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventures.com";

const canonicalUrlHook: FieldHook = ({ data, value }) => {
  const slug = data?.slug as string | undefined;
  if (slug) return `${siteUrl}/destinations/${slug}`;
  return value as string | undefined;
};

export const Destinations: CollectionConfig = {
  slug: "destinations",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "country", "status"],
    group: "Content",
    description: "Destinations shown on the destinations listing page.",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "General Info",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              admin: { description: "The destination name (e.g. Masai Mara National Reserve)." },
            },
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
              name: "region",
              type: "text",
              admin: { description: "Optional region label (e.g. Northern Circuit, Rift Valley)." },
            },
            {
              name: "slugPreview",
              type: "ui",
              admin: {
                components: {
                  Field: {
                    path: "@/components/admin/SlugDisplay",
                    exportName: "SlugDisplay",
                    clientProps: { urlPrefix: "/destinations" },
                  },
                },
              },
            },
            { 
              name: "summary", 
              type: "textarea", 
              admin: { placeholder: "A brief, compelling summary of the destination..." },
            },
            { 
              name: "content", 
              type: "textarea",
              admin: { description: "Detailed description of the destination." },
            },
          ],
        },
        {
          label: "Media Gallery",
          fields: [
            { name: "heroImage", type: "upload", relationTo: "media" },
            {
              name: "gallery",
              type: "array",
              admin: {
                description: "Add destination gallery images with optional alt text and captions.",
              },
              fields: [
                { name: "image", type: "upload", relationTo: "media", required: true },
                { name: "alt", type: "text" },
                { name: "caption", type: "text" },
              ],
            },
          ],
        },
        {
          label: "Map & Location",
          fields: [
            {
              name: "mapEmbedUrl",
              type: "text",
              admin: {
                description: "Google Maps embed URL (https://www.google.com/maps/embed?...).",
              },
            },
            {
              name: "latitude",
              type: "text",
              admin: { description: "Optional latitude fallback, e.g. -1.406108." },
            },
            {
              name: "longitude",
              type: "text",
              admin: { description: "Optional longitude fallback, e.g. 35.012092." },
            },
          ],
        },
        {
          label: "FAQs",
          fields: [
            {
              name: "faqs",
              type: "array",
              labels: {
                singular: "FAQ",
                plural: "FAQs",
              },
              admin: {
                description: "Add questions and answers. You can drag to reorder, add new ones going down, or remove them.",
              },
              fields: [
                { 
                  name: "question", 
                  type: "text", 
                  required: true, 
                  admin: { placeholder: "e.g. When is the best time to visit?" } 
                },
                { 
                  name: "answer", 
                  type: "textarea", 
                  required: true, 
                  admin: { placeholder: "Provide a clear and helpful answer..." } 
                },
              ],
            },
            {
              name: "directAnswers",
              type: "array",
              labels: {
                singular: "Direct answer",
                plural: "Direct answers",
              },
              admin: {
                description: "Optional short Q&A snippets for quick-answer use cases.",
              },
              fields: [
                {
                  name: "question",
                  type: "text",
                  required: true,
                },
                {
                  name: "answer",
                  type: "textarea",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "SEO & Metadata",
          admin: {
            hidden: true,
          },
          fields: [
            {
              name: "seo",
              type: "group",
              fields: [
                { name: "title", type: "text" },
                { name: "description", type: "textarea" },
                { name: "keywords", type: "text" },
                { name: "canonicalSlug", type: "text" },
                {
                  name: "canonicalUrl",
                  label: "Canonical URL (auto-filled)",
                  type: "text",
                  admin: {
                    readOnly: true,
                    description: "Auto-generated from slug. Format: {site}/destinations/{slug}",
                  },
                  hooks: { beforeChange: [canonicalUrlHook] },
                },
                { name: "openGraphImage", type: "upload", relationTo: "media" },
              ],
            },
          ],
        },
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
      name: "country",
      type: "select",
      options: [
        { label: "Kenya", value: "kenya" },
        { label: "Tanzania", value: "tanzania" },
      ],
      admin: { position: "sidebar" },
    },
  ],
};
