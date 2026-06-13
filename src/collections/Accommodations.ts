import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { anyone, operationsOrAdmin } from "../lib/access";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventures.com";

export const availabilityOptions = [
  { label: "Available", value: "available" },
  { label: "Limited", value: "limited" },
  { label: "Unavailable", value: "unavailable" },
  { label: "On Request", value: "on-request" },
] satisfies Array<{ label: string; value: string }>;

export const accommodationCountryOptions = [
  { label: "Kenya", value: "kenya" },
  { label: "Tanzania", value: "tanzania" },
] satisfies Array<{ label: string; value: string }>;

const normalizeSlug: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.name && !data?.slug) {
    data.slug = String(data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return data;
};

export const Accommodations: CollectionConfig = {
  slug: "accommodations",
  access: {
    read: anyone,
    create: operationsOrAdmin,
    update: operationsOrAdmin,
    delete: operationsOrAdmin,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "location", "availability"],
    group: "Operations",
  },
  hooks: {
    beforeChange: [normalizeSlug],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      admin: { description: "Auto-generated from name. Used for public URL." },
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "lodge",
      options: [
        { label: "Safari Lodge", value: "lodge" },
        { label: "Tented Camp", value: "camp" },
        { label: "Airbnb / Apartment", value: "airbnb" },
        { label: "Hotel", value: "hotel" },
        { label: "Boutique", value: "boutique" },
      ],
    },
    {
      name: "comfortLevel",
      label: "Comfort Level",
      type: "select",
      options: [
        { label: "Economy", value: "economy" },
        { label: "Mid Range", value: "mid-range" },
        { label: "Luxury", value: "luxury" },
        { label: "Ultra Luxury", value: "ultra-luxury" },
      ],
    },
    {
      name: "roomTypes",
      label: "Room Types",
      type: "array",
      fields: [
        {
          name: "roomType",
          type: "select",
          required: true,
          options: [
            { label: "Two Bedroom Cottage", value: "two-bedroom-cottage" },
            { label: "Three Bedroomed Cottage", value: "three-bedroom-cottage" },
            { label: "Five Bedroomed Cottage", value: "five-bedroom-cottage" },
            { label: "Standard Suite", value: "standard-suite" },
          ],
        },
      ],
    },
    {
      name: "country",
      type: "select",
      required: true,
      defaultValue: "kenya",
      options: accommodationCountryOptions,
    },
    { name: "location", type: "text", required: true },
    { name: "price", label: "Price Per Night (USD)", type: "number" },
    { name: "priceText", label: "Price Display Text", type: "text", admin: { description: `e.g. "From $250 / night" — shown on public pages` } },
    {
      name: "availability",
      type: "select",
      required: true,
      defaultValue: "on-request",
      options: availabilityOptions,
    },
    { name: "availabilityNote", type: "textarea" },
    { name: "availabilityLastUpdated", type: "date" },
    {
      name: "photos",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: { description: "First photo is the cover image. Add up to 20 photos." },
    },
    { name: "youtubeUrl", label: "YouTube Video URL", type: "text", admin: { description: "e.g. https://www.youtube.com/watch?v=XXXXXXXXXXX" } },
    {
      name: "linkedPackages",
      type: "relationship",
      relationTo: "packages",
      hasMany: true,
    },
    {
      name: "amenities",
      type: "array",
      fields: [{ name: "amenity", type: "text", required: true }],
    },
    { name: "description", type: "textarea" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft — not visible on website", value: "draft" },
        { label: "Published — visible on website", value: "published" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        { name: "metaTitle", type: "text" },
        { name: "metaDescription", type: "textarea" },
        {
          name: "canonicalUrl",
          label: "Canonical URL (auto)",
          type: "text",
          admin: { readOnly: true },
          hooks: {
            beforeChange: [({ data }) => {
              const slug = data?.slug as string | undefined;
              return slug ? `${siteUrl}/accommodations/${slug}` : undefined;
            }],
          },
        },
      ],
    },
  ],
};
