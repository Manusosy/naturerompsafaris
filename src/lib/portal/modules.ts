import {
  BedDouble,
  Bell,
  Camera,
  FileImage,
  FilePlus2,
  FileText,
  Globe2,
  HelpCircle,
  Home,
  Images,
  Inbox,
  LayoutDashboard,
  ListTree,
  Map,
  MapPinned,
  PackagePlus,
  Plane,
  Settings,
  Tags,
  Trash2,
  Newspaper,
} from "lucide-react";
import type { ComponentType } from "react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

export type PortalField =
  | { label: string; name: string; required?: boolean; rows?: number; type: "content" | "textarea" }
  | { itemName?: string; label: string; name: string; required?: boolean; rows?: number; type: "list" | "qa-list" }
  | { label: string; name: string; required?: boolean; type: "checkbox" | "date" | "email" | "number" | "text" | "url" }
  | { label: string; name: string; options: Array<{ label: string; value: string }>; required?: boolean; type: "select" }
  | { hasMany?: boolean; label: string; name: string; relationTo: string; required?: boolean; type: "relationship" };

export type PortalModule = {
  collection?: string;
  description: string;
  editModuleSlug?: string;
  emptyLabel: string;
  fields: PortalField[];
  global?: string;
  href: string;
  icon: Icon;
  label: string;
  listWhere?: Record<string, unknown>;
  navLabel: string;
  newLabel?: string;
  tableColumns: Array<{ key: string; label: string }>;
  trashable?: boolean;
  trashView?: boolean;
};

export type SidebarLink = {
  badgeKey?: "notifications";
  href: string;
  icon: Icon;
  label: string;
};

export type SidebarGroup = {
  defaultOpen?: boolean;
  icon: Icon;
  label: string;
  links: SidebarLink[];
};

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Trashed", value: "trashed" },
];

const postStatusOptions = statusOptions;

const availabilityOptions = [
  { label: "Available", value: "available" },
  { label: "Limited", value: "limited" },
  { label: "Unavailable", value: "unavailable" },
  { label: "On Request", value: "on-request" },
];

export const portalModules: Record<string, PortalModule> = {
  accommodations: {
    collection: "accommodations",
    description: "Manage stays.",
    emptyLabel: "No stays yet.",
    fields: [
      { label: "Name", name: "name", required: true, type: "text" },
      {
        label: "Type", name: "type", options: [
          { label: "Airbnb / Apartment", value: "airbnb" },
          { label: "Safari Lodge", value: "lodge" },
          { label: "Tented Camp", value: "camp" },
          { label: "Hotel", value: "hotel" },
        ], type: "select"
      },
      {
        label: "Comfort Level", name: "comfortLevel", options: [
          { label: "Economy", value: "economy" },
          { label: "Mid Range", value: "mid-range" },
          { label: "Luxury", value: "luxury" },
          { label: "Ultra Luxury", value: "ultra-luxury" },
        ], type: "select"
      },
      { label: "Country", name: "country", options: [{ label: "Kenya", value: "kenya" }, { label: "Tanzania", value: "tanzania" }], required: true, type: "select" },
      { label: "Location", name: "location", required: true, type: "text" },
      { label: "Cost Per Night (USD)", name: "price", type: "number" },
      { label: "Price text", name: "priceText", type: "text" },
      { label: "Availability", name: "availability", options: availabilityOptions, type: "select" },
      { label: "Availability note", name: "availabilityNote", rows: 3, type: "textarea" },
      { hasMany: true, label: "Photos", name: "photos", relationTo: "media", type: "relationship" },
      { label: "YouTube URL", name: "youtubeUrl", type: "url" },
      { label: "Description", name: "description", rows: 16, type: "content" },
      { label: "Status", name: "status", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], type: "select" },
    ],
    href: "/admin/accommodations",
    icon: BedDouble,
    label: "Accommodations",
    navLabel: "Accommodations",
    newLabel: "New stay",
    tableColumns: [
      { key: "name", label: "Stay" },
      { key: "country", label: "Country" },
      { key: "location", label: "Location" },
      { key: "availability", label: "Availability" },
      { key: "priceText", label: "Price" },
    ],
  },
  navigation: {
    collection: "navigation-items",
    description: "Manage public menu links.",
    emptyLabel: "No navigation items yet.",
    fields: [
      { label: "Label", name: "label", required: true, type: "text" },
      { label: "Dropdown group", name: "parentLabel", type: "text" },
      {
        label: "Link type", name: "linkType", options: [
          { label: "Custom URL / static page", value: "custom-url" },
          { label: "Destination", value: "destination" },
          { label: "Trip", value: "trip" },
          { label: "Package", value: "package" },
        ], type: "select"
      },
      { label: "Custom URL", name: "customUrl", type: "text" },
      { label: "Destination", name: "destination", relationTo: "destinations", type: "relationship" },
      { label: "Trip", name: "trip", relationTo: "trips", type: "relationship" },
      { label: "Package", name: "package", relationTo: "packages", type: "relationship" },
      { label: "Sort order", name: "sortOrder", type: "number" },
      { label: "Visible", name: "visible", type: "checkbox" },
      { label: "Primary button", name: "isPrimaryAction", type: "checkbox" },
      { label: "Notes", name: "notes", rows: 3, type: "textarea" },
    ],
    href: "/admin/navigation",
    icon: ListTree,
    label: "Navigation",
    navLabel: "Navigation",
    newLabel: "New menu item",
    tableColumns: [
      { key: "label", label: "Label" },
      { key: "parentLabel", label: "Group" },
      { key: "linkType", label: "Type" },
      { key: "sortOrder", label: "Order" },
      { key: "visible", label: "Visible" },
    ],
  },
  trips: {
    collection: "trips",
    description: "Manage safari trips.",
    emptyLabel: "No trips yet.",
    fields: [
      { label: "Trip title", name: "title", required: true, type: "text" },
      { label: "Slug", name: "slug", required: true, type: "text" },
      { hasMany: true, label: "Destinations", name: "destinations", relationTo: "destinations", type: "relationship" },
      { label: "Location", name: "location", type: "text" },
      { label: "Days", name: "days", type: "number" },
      { label: "Nights", name: "nights", type: "number" },
      { label: "Package", name: "package", relationTo: "packages", type: "relationship" },
      { label: "Itinerary days", name: "itineraryDaysJson", rows: 14, type: "content" },
      { label: "Status", name: "status", options: [...statusOptions, { label: "Paused", value: "paused" }, { label: "Sold Out", value: "sold-out" }], type: "select" },
      { label: "Start date", name: "startDate", type: "date" },
      { label: "End date", name: "endDate", type: "date" },
      { label: "Availability", name: "availability", options: availabilityOptions, type: "select" },
      { label: "Budget currency", name: "budget.currency", type: "text" },
      { label: "Budget min", name: "budget.min", type: "number" },
      { label: "Budget max", name: "budget.max", type: "number" },
      { label: "Budget display", name: "budget.displayText", type: "text" },
      { hasMany: true, label: "Carousel media", name: "galleryImages", relationTo: "media", type: "relationship" },
      { label: "Carousel alt text", name: "galleryAltText", rows: 5, type: "list" },
      { label: "Carousel captions", name: "galleryCaptions", itemName: "caption", rows: 5, type: "list" },
      { label: "Trip overview", name: "overview", rows: 8, type: "content" },
      { label: "Included", name: "includedItems", itemName: "item", rows: 7, type: "list" },
      { label: "Excluded", name: "excludedItems", itemName: "item", rows: 7, type: "list" },
      { label: "Map embed URL", name: "mapEmbedUrl", type: "url" },
      { label: "Latitude", name: "latitude", type: "text" },
      { label: "Longitude", name: "longitude", type: "text" },
      { label: "Discount enabled", name: "discount.enabled", type: "checkbox" },
      { label: "Discount label", name: "discount.label", type: "text" },
      { label: "Discount amount", name: "discount.amountText", type: "text" },
      { label: "Featured", name: "featured", type: "checkbox" },
      { label: "Notes", name: "notes", rows: 4, type: "textarea" },
      { label: "FAQs", name: "faqsJson", rows: 10, type: "qa-list" },
      { label: "Direct answers", name: "directAnswersJson", rows: 10, type: "qa-list" },
    ],
    href: "/admin/trips",
    icon: Tags,
    label: "All Trips",
    navLabel: "All Trips",
    newLabel: "New trip",
    tableColumns: [
      { key: "title", label: "Trip" },
      { key: "status", label: "Status" },
      { key: "startDate", label: "Start" },
      { key: "availability", label: "Availability" },
      { key: "budget.displayText", label: "Budget" },
    ],
    trashable: true,
  },
  packages: {
    collection: "packages",
    description: "Edit safari products.",
    emptyLabel: "No packages yet.",
    fields: [
      { label: "Package title", name: "title", required: true, type: "text" },
      { label: "Slug", name: "slug", required: true, type: "text" },
      { label: "Status", name: "status", options: statusOptions, type: "select" },
      {
        label: "Category", name: "category", options: [
          { label: "Kenya Safaris", value: "Kenya Safaris" },
          { label: "Tanzania Safaris", value: "Tanzania Safaris" },
          { label: "Zanzibar Holidays", value: "Zanzibar Holidays" },
          { label: "Kenya & Tanzania Combined", value: "Kenya Tanzania Combined Safaris" },
          { label: "Kenya Adventure", value: "Kenya Adventure Safaris" },
          { label: "Tanzania Adventure", value: "Tanzania Adventure Safaris" },
        ], required: true, type: "select"
      },
      {
        label: "Package group", name: "packageGroup", options: [
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
        ], type: "select"
      },
      {
        label: "Package tier", name: "packageTier", options: [
          { label: "Budget", value: "budget" },
          { label: "Mid Range", value: "mid-range" },
          { label: "Luxury", value: "luxury" },
          { label: "High End", value: "high-end" },
        ], type: "select"
      },
      { label: "Duration", name: "duration", type: "text" },
      { label: "Price text", name: "priceText", type: "text" },
      { label: "Featured", name: "featured", type: "checkbox" },
      { label: "Cover image", name: "image", relationTo: "media", type: "relationship" },
      { label: "Excerpt", name: "excerpt", rows: 4, type: "textarea" },
      { label: "Content", name: "content", rows: 12, type: "content" },
      { label: "Destinations text", name: "destinationsText", type: "text" },
      { label: "Destinations", name: "destinations", relationTo: "destinations", hasMany: true, type: "relationship" },
      { label: "Itinerary", name: "itinerary", relationTo: "itineraries", type: "relationship" },
      { label: "Best time", name: "bestTime", type: "text" },
      { label: "Discount enabled", name: "discount.enabled", type: "checkbox" },
      { label: "Discount label", name: "discount.label", type: "text" },
      { label: "Discount amount", name: "discount.amountText", type: "text" },
    ],
    href: "/admin/packages",
    icon: PackagePlus,
    label: "Packages",
    navLabel: "Packages",
    newLabel: "New package",
    tableColumns: [
      { key: "title", label: "Package" },
      { key: "category", label: "Category" },
      { key: "packageGroup", label: "Group" },
      { key: "packageTier", label: "Tier" },
      { key: "status", label: "Status" },
      { key: "priceText", label: "Price" },
      { key: "featured", label: "Featured" },
    ],
    trashable: true,
  },
  destinations: {
    collection: "destinations",
    description: "Manage destination pages.",
    emptyLabel: "No destinations yet.",
    fields: [
      { label: "Name", name: "name", required: true, type: "text" },
      { label: "Slug", name: "slug", required: true, type: "text" },
      { label: "Status", name: "status", options: statusOptions, type: "select" },
      { label: "Country", name: "country", options: [{ label: "Kenya", value: "kenya" }, { label: "Tanzania", value: "tanzania" }], type: "select" },
      { label: "Region", name: "region", type: "text" },
      { label: "Hero image", name: "heroImage", relationTo: "media", type: "relationship" },
      { label: "Summary", name: "summary", rows: 4, type: "textarea" },
      { label: "Content", name: "content", rows: 12, type: "content" },
      { hasMany: true, label: "Gallery media", name: "galleryImages", relationTo: "media", type: "relationship" },
      { label: "Gallery alt text", name: "galleryAltText", rows: 5, type: "list" },
      { label: "Gallery captions", name: "galleryCaptions", itemName: "caption", rows: 5, type: "list" },
      { label: "Map embed URL", name: "mapEmbedUrl", type: "url" },
      { label: "Latitude", name: "latitude", type: "text" },
      { label: "Longitude", name: "longitude", type: "text" },
      { label: "FAQs", name: "faqsJson", rows: 10, type: "qa-list" },
    ],
    href: "/admin/destinations",
    icon: MapPinned,
    label: "Destinations",
    navLabel: "Destinations",
    newLabel: "New destination",
    tableColumns: [
      { key: "name", label: "Destination" },
      { key: "status", label: "Status" },
      { key: "country", label: "Country" },
      { key: "region", label: "Region" },
      { key: "slug", label: "Slug" },
    ],
    trashable: true,
  },
  itineraries: {
    collection: "itineraries",
    description: "Build day plans.",
    emptyLabel: "No itineraries yet.",
    fields: [
      { label: "Title", name: "title", required: true, type: "text" },
      { label: "Package", name: "package", relationTo: "packages", type: "relationship" },
      { label: "Trip", name: "trip", relationTo: "trips", type: "relationship" },
      { label: "Number of days", name: "dayCount", type: "number" },
      { label: "Day plan", name: "daysJson", rows: 14, type: "content" },
    ],
    href: "/admin/itineraries",
    icon: Map,
    label: "Itineraries",
    navLabel: "Itineraries",
    newLabel: "New itinerary",
    tableColumns: [
      { key: "title", label: "Itinerary" },
      { key: "package", label: "Package" },
      { key: "dayCount", label: "Days" },
      { key: "updatedAt", label: "Updated" },
    ],
  },
  enquiries: {
    collection: "enquiries",
    description: "Website safari leads — reply by email or WhatsApp.",
    emptyLabel: "No enquiries yet.",
    fields: [],
    href: "/admin/enquiries",
    icon: Inbox,
    label: "Enquiries",
    navLabel: "Enquiries",
    tableColumns: [
      { key: "name", label: "Lead" },
      { key: "destinationChoice", label: "Interest" },
      { key: "status", label: "Status" },
      { key: "sourcePage", label: "Source" },
      { key: "createdAt", label: "Received" },
    ],
  },
  posts: {
    collection: "posts",
    description: "Manage articles.",
    emptyLabel: "No articles yet.",
    fields: [
      { label: "Heading", name: "title", required: true, type: "text" },
      { label: "Slug", name: "slug", required: true, type: "text" },
      { label: "Status", name: "status", options: postStatusOptions, type: "select" },
      { label: "Category", name: "category", relationTo: "post-categories", type: "relationship" },
      { label: "Tags", name: "tags", relationTo: "article-tags", hasMany: true, type: "relationship" },
      { label: "Featured", name: "featured", type: "checkbox" },
      { label: "Cover image", name: "image", relationTo: "media", type: "relationship" },
      { label: "Cover caption", name: "imageCaption", type: "text" },
      { label: "Excerpt", name: "excerpt", required: true, rows: 4, type: "textarea" },
      { label: "Article body", name: "body", required: true, rows: 16, type: "content" },
      { label: "Keywords", name: "seo.keywords", type: "text" },
    ],
    href: "/admin/posts",
    icon: Newspaper,
    label: "All Articles",
    navLabel: "All Articles",
    newLabel: "New article",
    tableColumns: [
      { key: "title", label: "Article" },
      { key: "status", label: "Status" },
      { key: "category", label: "Category" },
      { key: "publishedAt", label: "Published" },
    ],
    trashable: true,
  },
  "posts-trash": {
    collection: "posts",
    description: "Restore or delete articles.",
    editModuleSlug: "posts",
    emptyLabel: "Trash is empty.",
    fields: [],
    href: "/admin/posts-trash",
    icon: Trash2,
    label: "Trash",
    listWhere: { status: { equals: "trashed" } },
    navLabel: "Trash",
    tableColumns: [
      { key: "title", label: "Article" },
      { key: "category", label: "Category" },
      { key: "updatedAt", label: "Updated" },
    ],
    trashView: true,
  },
  "post-categories": {
    collection: "post-categories",
    description: "Manage article categories.",
    emptyLabel: "No categories yet.",
    fields: [
      { label: "Name", name: "name", required: true, type: "text" },
      { label: "Slug", name: "slug", required: true, type: "text" },
      { label: "Description", name: "description", rows: 4, type: "textarea" },
    ],
    href: "/admin/post-categories",
    icon: FileText,
    label: "Categories",
    navLabel: "Categories",
    tableColumns: [
      { key: "name", label: "Category" },
      { key: "slug", label: "Slug" },
      { key: "description", label: "Description" },
    ],
  },
  "article-tags": {
    collection: "article-tags",
    description: "Manage article tags.",
    emptyLabel: "No tags yet.",
    fields: [
      { label: "Name", name: "name", required: true, type: "text" },
      { label: "Slug", name: "slug", required: true, type: "text" },
    ],
    href: "/admin/article-tags",
    icon: Tags,
    label: "Tags",
    navLabel: "Tags",
    newLabel: "New tag",
    tableColumns: [
      { key: "name", label: "Tag" },
      { key: "slug", label: "Slug" },
    ],
  },
  gallery: {
    collection: "gallery",
    description: "Curate gallery images for the homepage and photo gallery page.",
    emptyLabel: "No gallery items yet.",
    fields: [
      { label: "Title", name: "title", required: true, type: "text" },
      { label: "Category", name: "category", type: "text" },
      {
        hasMany: true,
        label: "Photos",
        name: "images",
        relationTo: "media",
        required: true,
        type: "relationship",
      },
      { label: "Image alt", name: "alt", required: true, type: "text" },
      { label: "Featured on homepage", name: "featured", type: "checkbox" },
      { label: "Sort order", name: "sortOrder", type: "number" },
      { label: "Status", name: "status", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], type: "select" },
    ],
    href: "/admin/gallery",
    icon: Camera,
    label: "Gallery",
    navLabel: "Gallery",
    newLabel: "New gallery item",
    tableColumns: [
      { key: "title", label: "Image" },
      { key: "category", label: "Category" },
      { key: "alt", label: "Alt text" },
      { key: "featured", label: "Featured" },
      { key: "status", label: "Status" },
      { key: "sortOrder", label: "Order" },
    ],
  },
  "homepage-slides": {
    collection: "homepage-slides",
    description: "Manage the homepage hero slider with multiple images or a YouTube background video.",
    emptyLabel: "No homepage slides yet.",
    fields: [
      { label: "Heading", name: "title", required: true, type: "text" },
      { label: "Description", name: "description", required: true, rows: 5, type: "textarea" },
      {
        hasMany: true,
        label: "Hero images",
        name: "images",
        relationTo: "media",
        type: "relationship",
      },
      {
        label: "Slide interval (seconds)",
        name: "slideIntervalSeconds",
        type: "number",
      },
      {
        label: "YouTube background video URL",
        name: "backgroundVideoUrl",
        type: "url",
      },
      { label: "Destination focus", name: "destinationFocus", type: "text" },
      { label: "CTA label", name: "ctaLabel", type: "text" },
      { label: "CTA link", name: "ctaHref", type: "text" },
      { label: "Sort order", name: "sortOrder", type: "number" },
      { label: "Status", name: "status", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], type: "select" },
    ],
    href: "/admin/homepage-slides",
    icon: Home,
    label: "Hero Slides",
    navLabel: "Hero Slides",
    newLabel: "New hero slide",
    tableColumns: [
      { key: "title", label: "Slide" },
      { key: "destinationFocus", label: "Focus" },
      { key: "status", label: "Status" },
      { key: "sortOrder", label: "Order" },
    ],
  },
  faqs: {
    collection: "faqs",
    description: "Manage public FAQs.",
    emptyLabel: "No FAQs yet.",
    fields: [
      { label: "Question", name: "question", required: true, type: "text" },
      { label: "Answer", name: "answer", required: true, rows: 5, type: "textarea" },
      { label: "Category", name: "category", type: "text" },
      { label: "Featured on homepage", name: "featured", type: "checkbox" },
      { label: "Sort order", name: "sortOrder", type: "number" },
      { label: "Status", name: "status", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], type: "select" },
    ],
    href: "/admin/faqs",
    icon: HelpCircle,
    label: "FAQs",
    navLabel: "FAQs",
    newLabel: "New FAQ",
    tableColumns: [
      { key: "question", label: "Question" },
      { key: "category", label: "Category" },
      { key: "featured", label: "Featured" },
      { key: "status", label: "Status" },
      { key: "sortOrder", label: "Order" },
    ],
  },
  testimonials: {
    collection: "testimonials",
    description: "Manage public review cards.",
    emptyLabel: "No reviews yet.",
    fields: [
      { label: "Guest name", name: "name", required: true, type: "text" },
      { label: "Source", name: "source", type: "text" },
      { label: "Location", name: "location", type: "text" },
      { label: "Avatar", name: "avatar", relationTo: "media", type: "relationship" },
      { label: "Review", name: "quote", required: true, rows: 5, type: "textarea" },
      { label: "Rating", name: "rating", type: "number" },
      { label: "Featured on homepage", name: "featured", type: "checkbox" },
      { label: "Status", name: "status", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], type: "select" },
    ],
    href: "/admin/testimonials",
    icon: Bell,
    label: "Reviews",
    navLabel: "Reviews",
    newLabel: "New review",
    tableColumns: [
      { key: "name", label: "Guest" },
      { key: "source", label: "Source" },
      { key: "rating", label: "Rating" },
      { key: "featured", label: "Featured" },
      { key: "status", label: "Status" },
    ],
  },
  media: {
    collection: "media",
    description: "Manage uploaded files.",
    emptyLabel: "No media yet.",
    fields: [
      { label: "Alt text", name: "alt", required: true, type: "text" },
      { label: "Caption", name: "caption", type: "text" },
      { label: "Credit/source", name: "credit", type: "text" },
      { label: "Usage notes", name: "usageNotes", rows: 4, type: "textarea" },
    ],
    href: "/admin/media",
    icon: FileImage,
    label: "Media Library",
    navLabel: "Media",
    newLabel: "New media",
    tableColumns: [
      { key: "alt", label: "Alt text" },
      { key: "filename", label: "File" },
      { key: "mimeType", label: "Type" },
      { key: "updatedAt", label: "Updated" },
    ],
  },
  "seo-settings": {
    description: "Update company contact and site-wide settings.",
    emptyLabel: "Site settings are unavailable.",
    fields: [
      { label: "Site name", name: "siteName", type: "text" },
      { label: "Company name", name: "companyName", type: "text" },
      { label: "Primary email", name: "primaryEmail", type: "email" },
      { label: "Secondary email", name: "secondaryEmail", type: "email" },
      { label: "Phone", name: "phone", type: "text" },
      { label: "WhatsApp", name: "whatsapp", type: "text" },
      { label: "Address", name: "address", rows: 4, type: "textarea" },
      { label: "Footer description", name: "footerDescription", rows: 5, type: "textarea" },
      { label: "WhatsApp enquiry message", name: "whatsappEnquiryMessage", rows: 3, type: "textarea" },
      { label: "Trustindex heading", name: "reviewHeading", type: "text" },
      { label: "Trustindex embed code", name: "trustindexEmbed", rows: 6, type: "textarea" },
      { label: "Booking security heading", name: "bookingSecurityHeading", type: "text" },
      { label: "Booking security text", name: "bookingSecurityText", rows: 5, type: "textarea" },
      { label: "Booking security bullets", name: "bookingSecurityItems", itemName: "item", rows: 5, type: "list" },
    ],
    global: "site-settings",
    href: "/admin/seo-settings",
    icon: Settings,
    label: "Site Settings",
    navLabel: "Settings",
    tableColumns: [],
  },
  "flight-settings": {
    description: "Manage flight affiliate links.",
    emptyLabel: "Flight settings are unavailable.",
    fields: [
      {
        label: "Provider", name: "provider", options: [
          { label: "Disabled", value: "disabled" },
          { label: "Travelpayouts", value: "travelpayouts" },
          { label: "Skyscanner", value: "skyscanner" },
        ], type: "select"
      },
      { label: "CTA label", name: "ctaLabel", type: "text" },
      { label: "Affiliate URL", name: "affiliateUrl", type: "url" },
      { label: "Tracking params", name: "trackingParams", type: "text" },
      { label: "Notes", name: "notes", rows: 4, type: "textarea" },
    ],
    global: "flight-affiliate-settings",
    href: "/admin/flight-settings",
    icon: Plane,
    label: "Flight Affiliate",
    navLabel: "Flight Affiliate",
    tableColumns: [],
  },
};

export const sidebarGroups: SidebarGroup[] = [
  {
    defaultOpen: true,
    icon: LayoutDashboard,
    label: "Overview",
    links: [{ href: "/admin", icon: LayoutDashboard, label: "Overview" }],
  },
  {
    defaultOpen: true,
    icon: MapPinned,
    label: "Destinations",
    links: [
      { href: "/admin/destinations", icon: MapPinned, label: "All Destinations" },
      { href: "/admin/destinations/new", icon: FilePlus2, label: "Add New" },
    ],
  },
  {
    defaultOpen: true,
    icon: PackagePlus,
    label: "Packages",
    links: [
      { href: "/admin/packages", icon: PackagePlus, label: "All Packages" },
      { href: "/admin/packages/new", icon: FilePlus2, label: "Add New" },
    ],
  },
  {
    defaultOpen: true,
    icon: Tags,
    label: "Trips",
    links: [
      { href: "/admin/trips", icon: Tags, label: "All Trips" },
      { href: "/admin/trips/new", icon: FilePlus2, label: "Add New" },
    ],
  },
  {
    defaultOpen: true,
    icon: Newspaper,
    label: "Posts",
    links: [
      { href: "/admin/posts", icon: Newspaper, label: "All Posts" },
      { href: "/admin/posts/new", icon: FilePlus2, label: "Add New" },
      { href: "/admin/post-categories", icon: FileText, label: "Categories" },
      { href: "/admin/article-tags", icon: Tags, label: "Tags" },
    ],
  },
  {
    defaultOpen: true,
    icon: Images,
    label: "Media",
    links: [
      { href: "/admin/media", icon: FileImage, label: "Media Library" },
      { href: "/admin/gallery", icon: Camera, label: "Gallery" },
      { href: "/admin/testimonials", icon: Bell, label: "Reviews" },
    ],
  },
  {
    defaultOpen: true,
    icon: BedDouble,
    label: "Accommodation",
    links: [
      { href: "/admin/accommodations", icon: BedDouble, label: "All Stays" },
      { href: "/admin/accommodations/new", icon: FilePlus2, label: "Add New" },
    ],
  },
  {
    icon: Settings,
    label: "Settings",
    links: [
      { href: "/admin/seo-settings", icon: Globe2, label: "Site Settings" },
      { href: "/admin/navigation", icon: ListTree, label: "Navigation" },
      { href: "/admin/homepage-slides", icon: Home, label: "Homepage Slider" },
      { href: "/admin/faqs", icon: HelpCircle, label: "FAQs" },
      { href: "/admin/flight-settings", icon: Plane, label: "Flight Affiliate" },
    ],
  },
];

export const enquiriesNavLink: SidebarLink = {
  href: "/admin/enquiries",
  icon: Inbox,
  label: "Enquiries",
};

/** Top-level sidebar links rendered after the Trips group. */
export const sidebarLinksAfterTrips: SidebarLink[] = [enquiriesNavLink];

export const notificationsNavLink: SidebarLink = {
  badgeKey: "notifications",
  href: "/admin/notifications",
  icon: Bell,
  label: "Notifications",
};

export const sidebarItems = [
  ...sidebarGroups.flatMap((group) => group.links),
  ...sidebarLinksAfterTrips,
  notificationsNavLink,
];

export const notificationLink: SidebarLink = notificationsNavLink;

export function moduleNeedsMediaOptions(fields: PortalField[]) {
  return fields.some(
    (field) =>
      field.type === "content" ||
      (field.type === "relationship" && field.relationTo === "media"),
  );
}

export function getPortalModule(slug: string) {
  return portalModules[slug];
}
