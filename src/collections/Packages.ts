import type { CollectionConfig, FieldHook } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventures.com";

/** Auto-populate canonical URL from slug before save */
const canonicalUrlHook: FieldHook = ({ data, value }) => {
  const slug = data?.slug as string | undefined;
  if (slug) return `${siteUrl}/safari-packages/${slug}`;
  return value as string | undefined;
};

export const Packages: CollectionConfig = {
  slug: "packages",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "duration", "status", "featured"],
    group: "Content",
    description: "Safari packages displayed on the packages listing page.",
  },
  fields: [
    // ─── Main content area ───────────────────────────────────────────────
    {
      name: "title",
      type: "text",
      admin: { description: "The full package title as shown to visitors." },
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description: "URL-friendly identifier — lowercase, hyphens only. Auto-used in the public URL.",
      },
    },
    // Slug preview URL link (custom UI component)
    {
      name: "slugPreview",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/components/admin/SlugDisplay",
            exportName: "SlugDisplay",
            clientProps: { urlPrefix: "/safari-packages" },
          },
        },
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: { description: "Short description shown on listing cards and in meta tags." },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "duration",
      type: "text",
      admin: { placeholder: "e.g. 7 Days / 6 Nights — fallback when no linked trip exists" },
    },
    {
      name: "priceText",
      label: "Price / starting text",
      type: "text",
      admin: {
        placeholder: "e.g. From USD 2,400 per person",
        description: "Fallback for listing cards. Linked published trips supply live pricing automatically.",
      },
    },
    {
      name: "bestTime",
      type: "text",
      admin: { placeholder: "e.g. July – October (Wildebeest Migration)" },
    },
    {
      name: "destinationsText",
      label: "Destinations text",
      type: "text",
      admin: { description: "Short freeform destinations label shown on cards." },
    },
    {
      name: "destinations",
      type: "relationship",
      relationTo: "destinations",
      hasMany: true,
    },
    {
      name: "itinerary",
      type: "relationship",
      relationTo: "itineraries",
      admin: {
        description: "Link to an Itinerary document. Alternatively, itinerary days can be managed inside the linked Trip.",
      },
    },
    {
      name: "accommodations",
      type: "relationship",
      relationTo: "accommodations",
      hasMany: true,
      admin: {
        description: "Optional lodge / Airbnb / camp choices shown on the package detail page.",
      },
    },
    {
      name: "content",
      type: "textarea",
      admin: { description: "Main body content for the package detail page. Supports basic markdown." },
    },
    {
      name: "discount",
      type: "group",
      admin: { description: "Optional promotional discount shown on the package card." },
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false },
        { name: "label", type: "text", admin: { placeholder: "e.g. Early Bird Discount" } },
        { name: "amountText", type: "text", admin: { placeholder: "e.g. 10% off" } },
        { name: "expiresAt", type: "date" },
      ],
    },
    {
      name: "faqs",
      type: "array",
      admin: { description: "Frequently asked questions shown on the package detail page." },
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },

    // ─── SEO / Metadata ──────────────────────────────────────────────────
    {
      name: "seo",
      type: "group",
      label: "SEO & Metadata",
      admin: {
        hidden: true,
        description: "Generated automatically outside articles. Canonical URL is auto-generated from the slug.",
      },
      fields: [
        { name: "metaTitle", type: "text", admin: { placeholder: "Leave blank to use the package title" } },
        { name: "metaDescription", type: "textarea", admin: { placeholder: "155–160 characters recommended" } },
        { name: "keywords", type: "text", admin: { placeholder: "Comma-separated keywords" } },
        { name: "canonicalSlug", type: "text" },
        {
          name: "canonicalUrl",
          type: "text",
          label: "Canonical URL (auto-filled)",
          admin: {
            readOnly: true,
            description: "Auto-generated from the slug. Format: {site}/safari-packages/{slug}",
          },
          hooks: { beforeChange: [canonicalUrlHook] },
        },
        { name: "openGraphImage", type: "upload", relationTo: "media" },
      ],
    },

    // ─── Sidebar fields ──────────────────────────────────────────────────
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
      admin: {
        position: "sidebar",
        description: "Only published packages appear on the public website.",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Feature this package on the homepage and listing page.",
      },
    },
    {
      name: "category",
      type: "select",
      options: [
        { label: "— Select category —", value: "" },
        "Kenya Safaris",
        "Tanzania Safaris",
        "Zanzibar Holidays",
        "Kenya Tanzania Combined Safaris",
        "Kenya Adventure Safaris",
        "Tanzania Adventure Safaris",
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "packageTier",
      label: "Package tier",
      type: "select",
      options: [
        { label: "Budget", value: "budget" },
        { label: "Mid Range", value: "mid-range" },
        { label: "Luxury", value: "luxury" },
        { label: "High End", value: "high-end" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "packageGroup",
      label: "Package group",
      type: "select",
      defaultValue: "economy-private",
      options: [
        { label: "Mount Kenya Climbing", value: "mount-kenya-climbing" },
        { label: "Nairobi Excursion", value: "nairobi-excursion" },
        { label: "Day Trips", value: "day-trips" },
        { label: "Economy Private Safaris", value: "economy-private" },
        { label: "Group Joining Safaris", value: "group-joining" },
        { label: "Kenya Lodge Safaris", value: "kenya-lodge" },
        { label: "Kenya Fly In Safaris", value: "kenya-fly-in" },
        { label: "Beach Extension", value: "beach-extension" },
        { label: "4x4 Safaris", value: "4x4-safaris" },
        { label: "Short Safaris", value: "short-safaris" },
        { label: "Mount Kilimanjaro Climbing", value: "kilimanjaro-climbing" },
        { label: "Tanzania Lodge Safaris", value: "tanzania-lodge" },
        { label: "Tanzania Budget Camping Safaris", value: "tanzania-budget-camping" },
        { label: "Kenya & Tanzania Lodge Safaris", value: "combined-lodge" },
        { label: "Private Economy Safaris", value: "combined-private-economy" },
        { label: "Combined Group Joining Safaris", value: "combined-group-joining" },
        { label: "Combined Lodge Safari", value: "combined-lodge-safari" },
        { label: "Combined Budget Safari", value: "combined-budget" },
      ],
      admin: { position: "sidebar" },
    },
  ],
};
