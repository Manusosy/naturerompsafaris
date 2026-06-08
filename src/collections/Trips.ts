import type { CollectionConfig, FieldHook } from "payload";

import { editorOrAdmin, publishedOrStaff } from "../lib/access";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kenyatanzaniasafariadventures.com";

const canonicalUrlHook: FieldHook = ({ data, value }) => {
  const slug = data?.slug as string | undefined;
  if (slug) return `${siteUrl}/trips/${slug}`;
  return value as string | undefined;
};

export const Trips: CollectionConfig = {
  slug: "trips",
  access: {
    read: publishedOrStaff,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: editorOrAdmin,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "startDate", "availability", "featured"],
    group: "Content",
    description: "Individual safari trips with full itinerary, route map and pricing.",
  },
  fields: [
    // ─── Core Identity ────────────────────────────────────────────────────
    {
      name: "title",
      type: "text",
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description: "URL-friendly identifier — lowercase, hyphens only.",
      },
    },
    // Slug preview
    {
      name: "slugPreview",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/components/admin/SlugDisplay",
            exportName: "SlugDisplay",
            clientProps: { urlPrefix: "/trips" },
          },
        },
      },
    },
    {
      name: "heroEyebrow",
      label: "Hero category line",
      type: "text",
      admin: {
        placeholder: "e.g. Luxury Fly-In Safari",
        description:
          "Short line above the title on the trip detail hero only. Use Package Tier and Experience Types for filters and listing badges.",
      },
    },
    {
      name: "heroSubtitle",
      label: "Hero subtitle / tag line",
      type: "textarea",
      admin: { placeholder: "e.g. A once-in-a-lifetime Kenya wildlife expedition" },
    },
    {
      name: "heroImage",
      label: "Hero media image",
      type: "upload",
      relationTo: "media",
      admin: { description: "Optional hero image override. If empty, the first gallery image is used." },
    },
    {
      name: "heroVideoUrl",
      label: "Hero video URL",
      type: "text",
      admin: { description: "Reserved for future video hero support. Public page falls back to images for now." },
    },
    {
      name: "overview",
      type: "textarea",
      admin: {
        description: "Full trip overview shown on the detail page Overview section.",
        rows: 6,
      },
    },
    {
      name: "cardSummary",
      label: "Listing card summary",
      type: "textarea",
      admin: {
        description:
          "Short excerpt for trip listing cards (about 120–160 characters). Leave empty to auto-truncate the overview.",
        rows: 3,
      },
    },
    {
      name: "departurePoint",
      label: "Departure / flight point",
      type: "text",
      admin: {
        placeholder: "e.g. Wilson Airport, Nairobi",
        description: "Shown in the tour summary and route facts when relevant.",
      },
    },
    {
      name: "package",
      type: "relationship",
      relationTo: "packages",
      admin: { description: "Optionally link this trip to a parent package." },
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
      admin: { description: "Used by package filters and price table grouping." },
    },
    {
      name: "experienceTypes",
      label: "Experience types",
      type: "select",
      hasMany: true,
      options: [
        { label: "Family Safaris", value: "family" },
        { label: "Honeymoon Safaris", value: "honeymoon" },
        { label: "Group Joining Safaris", value: "group-joining" },
        { label: "Private Safaris", value: "private" },
        { label: "Fly-In Safaris", value: "fly-in" },
        { label: "Safari & Beach Holidays", value: "safari-beach" },
        { label: "Beach Extensions", value: "beach-extension" },
        { label: "Mount Climbing", value: "mount-climbing" },
      ],
      admin: { description: "Used by Experiences navigation and public filters." },
    },
    {
      name: "destinations",
      type: "relationship",
      relationTo: "destinations",
      hasMany: true,
    },
    {
      name: "days",
      type: "number",
      admin: { width: "50%" },
    },
    {
      name: "nights",
      type: "number",
      admin: { width: "50%" },
    },
    {
      name: "location",
      type: "text",
      admin: { placeholder: "e.g. Kenya & Tanzania" },
    },
    {
      name: "routeLabel",
      label: "Route label",
      type: "text",
      admin: { placeholder: "e.g. Nairobi to Zanzibar via Masai Mara and Serengeti" },
    },
    {
      name: "startLocation",
      label: "Start location",
      type: "text",
      admin: { placeholder: "e.g. Nairobi, Kenya" },
    },
    {
      name: "endLocation",
      label: "End location",
      type: "text",
      admin: { placeholder: "e.g. Nairobi, Kenya" },
    },

    // ─── Route Map Waypoints ──────────────────────────────────────────────
    {
      name: "routeWaypoints",
      label: "Route waypoints (for map)",
      type: "array",
      admin: {
        description:
          "Add each stop on the route as a place name. These are used to draw the route on Google Maps visible to public visitors. Use clear place names like 'Amboseli National Park, Kenya' or 'Serengeti, Tanzania'.",

      },
      fields: [
        {
          name: "place",
          type: "text",
          required: true,
          admin: { placeholder: "e.g. Masai Mara National Reserve, Kenya" },
        },
        {
          name: "label",
          type: "text",
          admin: { placeholder: "e.g. Day 2–3: Game drives" },
        },
        {
          name: "notes",
          type: "textarea",
          admin: { placeholder: "Optional notes shown under the stop on the public page." },
        },
      ],
    },

    // ─── Highlights ────────────────────────────────────────────────────────
    {
      name: "highlights",
      label: "Tour highlights",
      type: "array",

      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "image", type: "upload", relationTo: "media" },
        { name: "alt", label: "Image alt text", type: "text" },
      ],
    },

    // ─── Destination Stops ────────────────────────────────────────────────
    {
      name: "destinationStops",
      label: "Destination stops (Where You Will Go section)",
      type: "array",
      admin: {
        description: "Each card shown in the 'Where You Will Go' section with image and description.",

      },
      fields: [
        { name: "destination", type: "relationship", relationTo: "destinations" },
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "image", type: "upload", relationTo: "media" },
        { name: "alt", label: "Image alt text", type: "text" },
      ],
    },

    // ─── Itinerary Days ───────────────────────────────────────────────────
    {
      name: "itineraryDays",
      label: "Day-by-day itinerary",
      type: "array",
      admin: {
        description:
          "Click 'Add Day' below to add each day of the itinerary. Each day appears as a card in the connected timeline on the public trip page.",
        components: {
          RowLabel: {
            path: "@/components/admin/ItineraryRowLabel",
            exportName: "ItineraryRowLabel",
          },
        },
      },
      fields: [
        {
          name: "day",
          type: "number",
          min: 1,
          required: true,
          admin: {
            width: "25%",
            description: "Day number",
          },
        },
        {
          name: "title",
          type: "text",
          required: true,
          admin: {
            width: "75%",
            placeholder: "e.g. Arrival in Nairobi & afternoon game drive",
          },
        },
        {
          name: "location",
          type: "text",
          admin: { placeholder: "e.g. Amboseli National Park" },
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          admin: {
            rows: 5,
            description: "Full description of the day's activities and experiences.",
          },
        },
        {
          name: "activities",
          type: "textarea",
          admin: {
            placeholder: "e.g. Morning game drive, visit to Maasai village, sundowner",
            rows: 3,
          },
        },
        {
          name: "meals",
          type: "text",
          admin: { placeholder: "e.g. Breakfast, Lunch, Dinner (B/L/D)" },
        },
        {
          name: "accommodation",
          type: "text",
          admin: { placeholder: "e.g. Amboseli Sopa Lodge" },
        },
        {
          name: "experienceNotes",
          label: "Experience notes",
          type: "textarea",
          admin: {
            placeholder: "Behind-the-scenes tips, wildlife chances, what to pack for this day.",
            rows: 3,
          },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          admin: { description: "Optional image for this day's card." },
        },
      ],
    },

    // ─── Linked itinerary document ────────────────────────────────────────
    {
      name: "itinerary",
      type: "relationship",
      relationTo: "itineraries",
      admin: {
        description: "Alternatively, link a shared Itinerary document instead of entering days above.",
      },
    },

    // ─── Pricing ──────────────────────────────────────────────────────────
    {
      name: "budget",
      type: "group",
      label: "Budget range",
      fields: [
        { name: "currency", type: "text", defaultValue: "USD", admin: { width: "25%" } },
        { name: "min", type: "number", admin: { width: "25%" } },
        { name: "max", type: "number", admin: { width: "25%" } },
        {
          name: "pricingBasis",
          label: "Pricing basis",
          type: "select",
          defaultValue: "per-person",
          options: [
            { label: "Per person", value: "per-person" },
            { label: "Per person sharing", value: "per-person-sharing" },
          ],
          admin: { width: "25%" },
        },
        {
          name: "displayText",
          type: "text",
          admin: {
            readOnly: true,
            description: "Auto-generated from currency, min, max, and pricing basis.",
          },
        },
      ],
    },
    {
      name: "priceText",
      label: "Legacy price text",
      type: "text",
      admin: { description: "Fallback price text if budget range is not set." },
    },
    {
      name: "priceSeasons",
      label: "Prices and seasons",
      type: "array",

      fields: [
        { name: "title", type: "text", required: true },
        {
          name: "tier",
          type: "select",
          options: [
            { label: "Budget", value: "budget" },
            { label: "Mid Range", value: "mid-range" },
            { label: "Luxury", value: "luxury" },
            { label: "High End", value: "high-end" },
          ],
        },
        { name: "seasonLabel", label: "Season", type: "text" },
        {
          name: "packageLabel",
          label: "Package table label",
          type: "text",
          admin: { placeholder: "e.g. Luxury Accommodations" },
        },
        {
          name: "partySizeLabel",
          label: "Group size",
          type: "text",
          admin: { placeholder: "e.g. 2–3 pax, 4–5 pax, 6+ pax" },
        },
        { name: "dateRange", label: "Date range", type: "text" },
        { name: "currency", type: "text", defaultValue: "USD" },
        { name: "min", type: "number" },
        { name: "max", type: "number" },
        { name: "displayText", label: "Display price text", type: "text" },
        { name: "budgetText", label: "Budget / quote text", type: "text" },
        { name: "notes", type: "textarea" },
        { name: "ctaLabel", label: "CTA label", type: "text", defaultValue: "Request Quote" },
      ],
    },

    // ─── Inclusions ────────────────────────────────────────────────────────
    {
      name: "included",
      type: "array",
      admin: { description: "What is included in the trip cost." },
      fields: [{ name: "item", type: "text", required: true }],
    },
    {
      name: "excluded",
      type: "array",
      admin: { description: "What is NOT included — international flights, tips, visa fees, etc." },
      fields: [{ name: "item", type: "text", required: true }],
    },
    {
      name: "optionalExperiences",
      label: "Optional add-on experiences",
      type: "array",
      admin: {
        description: "Paid extras such as balloon safaris or cultural visits. Shown on the trip detail page.",
      },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "priceNote", label: "Price note", type: "text", admin: { placeholder: "e.g. From USD 480 per person" } },
      ],
    },
    {
      name: "accommodationSummary",
      label: "Accommodation summary",
      type: "textarea",
      admin: {
        description: "Introductory copy for the accommodation section on the trip detail page.",
        rows: 4,
      },
    },
    {
      name: "accommodationOptions",
      label: "Accommodation options",
      type: "array",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "note", type: "text", admin: { placeholder: "Optional note" } },
      ],
    },
    {
      name: "bestFor",
      label: "Best for",
      type: "array",
      admin: { description: "Traveller types this trip suits, e.g. honeymooners, families, photographers." },
      fields: [{ name: "item", type: "text", required: true }],
    },
    {
      name: "bestTimeToVisit",
      label: "Best time to visit",
      type: "textarea",
      admin: {
        description: "Seasonal guidance for when to book or travel.",
        rows: 4,
      },
    },

    // ─── Gallery ───────────────────────────────────────────────────────────
    {
      name: "gallery",
      type: "array",

      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "alt", type: "text", required: true },
        { name: "caption", type: "text" },
      ],
    },

    // ─── Legacy map fields (kept for existing data) ──────────────────────
    {
      name: "mapEmbedUrl",
      label: "Custom map embed URL (override)",
      type: "text",
      admin: {
        description: "Paste a Google Maps embed URL here to override the auto-generated route map.",
      },
    },

    // ─── Trust & impact ───────────────────────────────────────────────────
    {
      name: "positiveImpact",
      label: "Positive impact text",
      type: "textarea",
    },
    {
      name: "whyBook",
      label: "Why book with us",
      type: "array",
      fields: [{ name: "item", type: "text", required: true }],
    },
    {
      name: "quoteIntro",
      label: "Quote form intro",
      type: "textarea",
      admin: { description: "Short helper text shown above the trip sidebar quote form." },
    },
    {
      name: "trustindexEmbedOverride",
      label: "Trustindex override",
      type: "textarea",
      admin: { description: "Optional per-trip Trustindex widget embed. Leave empty to use site settings." },
    },
    {
      name: "discount",
      type: "group",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false },
        { name: "label", type: "text" },
        { name: "amountText", type: "text" },
        { name: "expiresAt", type: "date" },
      ],
    },
    {
      name: "relatedTrips",
      label: "Related trips",
      type: "relationship",
      relationTo: "trips",
      hasMany: true,

    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Internal notes — not shown to visitors." },
    },

    // ─── FAQs ──────────────────────────────────────────────────────────────
    {
      name: "faqs",
      type: "array",

      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    {
      name: "directAnswers",
      type: "array",
      admin: {
        description: "Short, direct Q&A pairs for AEO and featured snippets.",

      },
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },

    // ─── SEO ───────────────────────────────────────────────────────────────
    {
      name: "seo",
      type: "group",
      label: "SEO & Metadata",
      admin: {
        hidden: true,
      },

      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "keywords", type: "text" },
        {
          name: "canonicalUrl",
          label: "Canonical URL (auto-filled)",
          type: "text",
          admin: {
            readOnly: true,
            description: "Auto-generated from slug. Format: {site}/trips/{slug}",
          },
          hooks: { beforeChange: [canonicalUrlHook] },
        },
        { name: "openGraphImage", type: "upload", relationTo: "media" },
      ],
    },

    // ─── Sidebar ───────────────────────────────────────────────────────────
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Trashed", value: "trashed" },
        { label: "Paused", value: "paused" },
        { label: "Sold Out", value: "sold-out" },
      ],
      admin: {
        position: "sidebar",
        description: "Only published trips appear on the public website.",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Show in featured trips sections.",
      },
    },
    {
      name: "availability",
      type: "select",
      defaultValue: "on-request",
      required: true,
      options: [
        { label: "Available", value: "available" },
        { label: "Limited", value: "limited" },
        { label: "Unavailable", value: "unavailable" },
        { label: "On Request", value: "on-request" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "startDate",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "endDate",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
  ],
};
