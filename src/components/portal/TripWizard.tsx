"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronLeft, ChevronRight, ExternalLink, Plus, X } from "lucide-react";

import { TripRouteMap } from "@/components/TripRouteMap";
import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";
import { PlaceSearchInput } from "@/components/portal/PlaceSearchInput";
import { slugify } from "@/lib/portal/format";
import type { WizardLinkOption } from "@/lib/portal/data";
import {
  suggestTripHeroEyebrow,
  TRIP_EXPERIENCE_FILTER_OPTIONS,
  TRIP_TIER_FILTER_OPTIONS,
} from "@/lib/trip-labels";
import { buildTripBudgetPayload, formatTripPrice, type TripPricingBasis } from "@/lib/trip-pricing";
import {
  DEFAULT_PARTY_COLUMNS,
  defaultPackageLabel,
  emptyPricingPackage,
  emptyPricingPackageRow,
  packagesToPriceSeasons,
  priceSeasonsToPackages,
  type PricingPackage,
} from "@/lib/trip-pricing-table";

type QaItem = { question: string; answer: string };
type ItineraryDay = {
  accommodation: string;
  activities: string;
  day: number;
  description: string;
  experienceNotes: string;
  imageId: string;
  location: string;
  meals: string;
  title: string;
};
type RouteWaypoint = { label: string; notes: string; place: string };
type Highlight = { alt: string; description: string; imageId: string; title: string };
type DestinationStop = {
  alt: string;
  description: string;
  destinationId: string;
  imageId: string;
  title: string;
};
type OptionalExperience = { description: string; priceNote: string; title: string };
type AccommodationOption = { name: string; note: string };

type WizardData = {
  title: string;
  slug: string;
  heroEyebrow: string;
  heroSubtitle: string;
  cardSummary: string;
  departurePoint: string;
  location: string;
  routeLabel: string;
  startLocation: string;
  endLocation: string;
  packageId: string;
  packageTier: string;
  experienceTypes: string[];
  destinationIds: string[];
  availability: string;
  heroImageId: string;
  heroVideoUrl: string;
  galleryImageIds: string[];
  routeWaypoints: RouteWaypoint[];
  destinationStops: DestinationStop[];
  highlights: Highlight[];
  itineraryMode: "inline" | "linked";
  itineraryId: string;
  itineraryDays: ItineraryDay[];
  budgetCurrency: string;
  budgetMin: string;
  budgetMax: string;
  pricingBasis: TripPricingBasis;
  budgetDisplay: string;
  priceText: string;
  pricingPackages: PricingPackage[];
  included: string[];
  excluded: string[];
  optionalExperiences: OptionalExperience[];
  accommodationSummary: string;
  accommodationOptions: AccommodationOption[];
  overview: string;
  positiveImpact: string;
  bestFor: string[];
  bestTimeToVisit: string;
  whyBook: string[];
  quoteIntro: string;
  faqs: QaItem[];
  directAnswers: QaItem[];
  discountEnabled: boolean;
  discountLabel: string;
  discountAmount: string;
  mapEmbedUrl: string;
  relatedTripIds: string[];
  notes: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  trustindexEmbedOverride: string;
  featured: boolean;
};

const STEPS = [
  { id: 1, label: "Basics", description: "Title & links" },
  { id: 2, label: "Media", description: "Hero & gallery" },
  { id: 3, label: "Itinerary", description: "Day 1, 2, 3…" },
  { id: 4, label: "Route", description: "Map path & stops" },
  { id: 5, label: "Pricing", description: "Budget & inclusions" },
  { id: 6, label: "Content", description: "Overview & FAQs" },
  { id: 7, label: "Publish", description: "Availability & save" },
] as const;

const AVAILABILITY_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Limited", value: "limited" },
  { label: "Unavailable", value: "unavailable" },
  { label: "On Request", value: "on-request" },
];

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

function toPayloadMediaId(id: string) {
  if (!id) return undefined;
  const numericId = Number(id);
  return Number.isInteger(numericId) && String(numericId) === id ? numericId : id;
}

function normalizeMapEmbedUrl(raw: string) {
  let url = raw.trim();
  if (!url) return "";
  if (url.includes("<iframe")) {
    const match = url.match(/src="([^"]+)"/);
    if (match?.[1]) url = match[1];
  }
  return url;
}

function parseQaItems(value: unknown): QaItem[] {
  if (!Array.isArray(value)) return [{ question: "", answer: "" }];
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      return {
        question: String(row.question ?? "").trim(),
        answer: String(row.answer ?? "").trim(),
      };
    })
    .filter((item): item is QaItem => !!item && (!!item.question || !!item.answer));
  return items.length ? items : [{ question: "", answer: "" }];
}

function parseStringItems(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return String((item as Record<string, unknown>)[key] ?? "").trim();
    })
    .filter(Boolean);
}

function emptyItineraryDay(day: number): ItineraryDay {
  return {
    accommodation: "",
    activities: "",
    day,
    description: "",
    experienceNotes: "",
    imageId: "",
    location: "",
    meals: "",
    title: "",
  };
}

function computeTripDuration(
  itineraryMode: WizardData["itineraryMode"],
  itineraryDays: ItineraryDay[],
  linkedItinerary?: WizardLinkOption,
) {
  if (itineraryMode === "linked" && linkedItinerary?.dayCount) {
    const days = linkedItinerary.dayCount;
    return { days, nights: Math.max(0, days - 1) };
  }
  const filled = itineraryDays.filter((d) => d.title.trim());
  if (!filled.length) return { days: 0, nights: 0 };
  const maxDay = Math.max(...filled.map((d) => d.day));
  return { days: maxDay, nights: Math.max(0, maxDay - 1) };
}

function generateRouteFromItinerary(itineraryDays: ItineraryDay[]) {
  const filled = [...itineraryDays]
    .filter((d) => d.title.trim())
    .sort((a, b) => a.day - b.day);
  const waypoints: RouteWaypoint[] = [];
  let lastPlace = "";

  for (const day of filled) {
    const place = day.location.trim();
    if (place && place !== lastPlace) {
      waypoints.push({
        place,
        label: `Day ${day.day}: ${day.title.trim()}`,
        notes: "",
      });
      lastPlace = place;
    }
  }

  const startLocation = filled[0]?.location.trim() || "";
  const endLocation = filled[filled.length - 1]?.location.trim() || "";
  const startShort = startLocation.split(",")[0]?.trim();
  const endShort = endLocation.split(",")[0]?.trim();
  const routeLabel = startShort && endShort ? `${startShort} to ${endShort}` : "";

  return {
    endLocation,
    routeLabel,
    startLocation,
    waypoints: waypoints.length ? waypoints : [{ place: "", label: "", notes: "" }],
  };
}

function buildFromDoc(doc: Record<string, unknown>): WizardData {
  const budget =
    doc.budget && typeof doc.budget === "object"
      ? (doc.budget as Record<string, unknown>)
      : {};
  const discount =
    doc.discount && typeof doc.discount === "object"
      ? (doc.discount as Record<string, unknown>)
      : {};
  const seo =
    doc.seo && typeof doc.seo === "object"
      ? (doc.seo as Record<string, unknown>)
      : {};

  const gallery = Array.isArray(doc.gallery)
    ? (doc.gallery as Array<Record<string, unknown>>)
    : [];
  const itineraryDaysRaw = Array.isArray(doc.itineraryDays)
    ? (doc.itineraryDays as Array<Record<string, unknown>>)
    : [];
  const waypoints = Array.isArray(doc.routeWaypoints)
    ? (doc.routeWaypoints as Array<Record<string, unknown>>)
    : [];
  const stops = Array.isArray(doc.destinationStops)
    ? (doc.destinationStops as Array<Record<string, unknown>>)
    : [];
  const highlightsRaw = Array.isArray(doc.highlights)
    ? (doc.highlights as Array<Record<string, unknown>>)
    : [];
  const seasonsRaw = Array.isArray(doc.priceSeasons)
    ? (doc.priceSeasons as Array<Record<string, unknown>>)
    : [];

  const linkedItineraryId = relationId(doc.itinerary);

  return {
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    heroEyebrow: String(doc.heroEyebrow ?? ""),
    heroSubtitle: String(doc.heroSubtitle ?? ""),
    cardSummary: String(doc.cardSummary ?? ""),
    departurePoint: String(doc.departurePoint ?? ""),
    location: String(doc.location ?? ""),
    routeLabel: String(doc.routeLabel ?? ""),
    startLocation: String(doc.startLocation ?? ""),
    endLocation: String(doc.endLocation ?? ""),
    packageId: relationId(doc.package),
    packageTier: String(doc.packageTier ?? "mid-range"),
    experienceTypes: Array.isArray(doc.experienceTypes)
      ? doc.experienceTypes.map(String)
      : [],
    destinationIds: relationIds(doc.destinations),
    availability: String(doc.availability ?? "on-request"),
    heroImageId: relationId(doc.heroImage),
    heroVideoUrl: String(doc.heroVideoUrl ?? ""),
    galleryImageIds: gallery
      .map((item) => relationId(item.image))
      .filter(Boolean),
    routeWaypoints: waypoints.length
      ? waypoints.map((item) => ({
          place: String(item.place ?? ""),
          label: String(item.label ?? ""),
          notes: String(item.notes ?? ""),
        }))
      : [{ place: "", label: "", notes: "" }],
    destinationStops: stops.length
      ? stops.map((item) => ({
          destinationId: relationId(item.destination),
          title: String(item.title ?? ""),
          description: String(item.description ?? ""),
          imageId: relationId(item.image),
          alt: String(item.alt ?? ""),
        }))
      : [],
    highlights: highlightsRaw.length
      ? highlightsRaw.map((item) => ({
          title: String(item.title ?? ""),
          description: String(item.description ?? ""),
          imageId: relationId(item.image),
          alt: String(item.alt ?? ""),
        }))
      : [],
    itineraryMode: linkedItineraryId && !itineraryDaysRaw.length ? "linked" : "inline",
    itineraryId: linkedItineraryId,
    itineraryDays: itineraryDaysRaw.length
      ? itineraryDaysRaw.map((item, index) => ({
          day: Number(item.day ?? index + 1),
          title: String(item.title ?? ""),
          location: String(item.location ?? ""),
          description: String(item.description ?? ""),
          activities: String(item.activities ?? ""),
          meals: String(item.meals ?? ""),
          accommodation: String(item.accommodation ?? ""),
          experienceNotes: String(item.experienceNotes ?? ""),
          imageId: relationId(item.image),
        }))
      : [emptyItineraryDay(1)],
    budgetCurrency: String(budget.currency ?? "USD"),
    budgetMin: budget.min != null ? String(budget.min) : "",
    budgetMax: budget.max != null ? String(budget.max) : "",
    pricingBasis:
      budget.pricingBasis === "per-person-sharing" ? "per-person-sharing" : "per-person",
    budgetDisplay: String(budget.displayText ?? ""),
    priceText: String(doc.priceText ?? ""),
    pricingPackages: seasonsRaw.length
      ? priceSeasonsToPackages(seasonsRaw.map((item) => ({
          title: String(item.title ?? ""),
          tier: String(item.tier ?? "mid-range"),
          seasonLabel: String(item.seasonLabel ?? ""),
          packageLabel: String(item.packageLabel ?? ""),
          dateRange: String(item.dateRange ?? ""),
          currency: String(item.currency ?? "USD"),
          min: typeof item.min === "number" ? item.min : undefined,
          max: typeof item.max === "number" ? item.max : undefined,
          notes: String(item.notes ?? ""),
          partySizeLabel: String(item.partySizeLabel ?? ""),
          ctaLabel: String(item.ctaLabel ?? "Inquire"),
        })))
      : [],
    included: parseStringItems(doc.included, "item"),
    excluded: parseStringItems(doc.excluded, "item"),
    optionalExperiences: Array.isArray(doc.optionalExperiences)
      ? (doc.optionalExperiences as Array<Record<string, unknown>>).map((item) => ({
          title: String(item.title ?? ""),
          description: String(item.description ?? ""),
          priceNote: String(item.priceNote ?? ""),
        }))
      : [],
    accommodationSummary: String(doc.accommodationSummary ?? ""),
    accommodationOptions: Array.isArray(doc.accommodationOptions)
      ? (doc.accommodationOptions as Array<Record<string, unknown>>).map((item) => ({
          name: String(item.name ?? ""),
          note: String(item.note ?? ""),
        }))
      : [],
    overview: String(doc.overview ?? ""),
    positiveImpact: String(doc.positiveImpact ?? ""),
    bestFor: parseStringItems(doc.bestFor, "item"),
    bestTimeToVisit: String(doc.bestTimeToVisit ?? ""),
    whyBook: parseStringItems(doc.whyBook, "item"),
    quoteIntro: String(doc.quoteIntro ?? ""),
    faqs: parseQaItems(doc.faqs),
    directAnswers: parseQaItems(doc.directAnswers),
    discountEnabled: discount.enabled === true,
    discountLabel: String(discount.label ?? ""),
    discountAmount: String(discount.amountText ?? ""),
    mapEmbedUrl: String(doc.mapEmbedUrl ?? ""),
    relatedTripIds: relationIds(doc.relatedTrips),
    notes: String(doc.notes ?? ""),
    seoTitle: String(seo.title ?? doc.title ?? ""),
    seoDescription: String(seo.description ?? ""),
    seoKeywords: String(seo.keywords ?? ""),
    trustindexEmbedOverride: String(doc.trustindexEmbedOverride ?? ""),
    featured: doc.featured === true,
  };
}

function QaEditor({
  addLabel,
  items,
  onChange,
  title,
}: {
  addLabel: string;
  items: QaItem[];
  onChange: (items: QaItem[]) => void;
  title: string;
}) {
  function updateItem(index: number, key: keyof QaItem, value: string) {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  }

  return (
    <div className="acc-field">
      <div className="acc-faq-head">
        <label className="acc-label">{title}</label>
        <button
          className="acc-amenity-btn"
          onClick={() => onChange([...items, { question: "", answer: "" }])}
          type="button"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <div className="acc-faq-list">
        {items.map((item, index) => (
          <div className="acc-faq-item" key={index}>
            <button
              aria-label="Remove"
              className="acc-faq-remove"
              onClick={() => onChange(items.filter((_, i) => i !== index).length ? items.filter((_, i) => i !== index) : [{ question: "", answer: "" }])}
              type="button"
            >
              <X size={14} />
            </button>
            <div className="acc-field">
              <label className="acc-label">Question</label>
              <input
                className="acc-input"
                onChange={(e) => updateItem(index, "question", e.target.value)}
                type="text"
                value={item.question}
              />
            </div>
            <div className="acc-field">
              <label className="acc-label">Answer</label>
              <textarea
                className="acc-textarea"
                onChange={(e) => updateItem(index, "answer", e.target.value)}
                rows={3}
                value={item.answer}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagListEditor({
  items,
  onChange,
  placeholder,
  title,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  title: string;
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const trimmed = draft.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setDraft("");
  }

  return (
    <div className="acc-field">
      <label className="acc-label">{title}</label>
      <div className="acc-amenities-list">
        {items.map((item) => (
          <span className="acc-amenity-tag" key={item}>
            {item}
            <button onClick={() => onChange(items.filter((x) => x !== item))} type="button">
              <X size={12} />
            </button>
          </span>
        ))}
        {!items.length && <span className="acc-amenities-empty">None added yet.</span>}
      </div>
      <div className="acc-amenity-add">
        <input
          className="acc-input"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          type="text"
          value={draft}
        />
        <button className="acc-amenity-btn" disabled={!draft.trim()} onClick={addItem} type="button">
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  );
}

function MultiSelectDropdown({
  addLabel,
  emptyLabel,
  onChange,
  options,
  selectedIds,
}: {
  addLabel: string;
  emptyLabel: string;
  onChange: (ids: string[]) => void;
  options: WizardLinkOption[];
  selectedIds: string[];
}) {
  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="acc-field">
      {selectedIds.length > 0 ? (
        <div className="acc-amenities-list" style={{ marginBottom: 8 }}>
          {selectedIds.map((id) => {
            const opt = options.find((o) => o.value === id);
            return (
              <span className="acc-amenity-tag" key={id}>
                {opt?.label ?? id}
                {opt?.href ? (
                  <a className="acc-relation-item__link" href={opt.href} rel="noreferrer" target="_blank">
                    <ExternalLink size={11} />
                  </a>
                ) : null}
                <button onClick={() => remove(id)} type="button"><X size={12} /></button>
              </span>
            );
          })}
        </div>
      ) : (
        <span className="acc-amenities-empty" style={{ display: "block", marginBottom: 8 }}>{emptyLabel}</span>
      )}
      <select
        className="acc-select"
        onChange={(e) => {
          const value = e.target.value;
          if (value && !selectedIds.includes(value)) {
            onChange([...selectedIds, value]);
          }
          e.target.value = "";
        }}
        value=""
      >
        <option value="">{addLabel}</option>
        {options
          .filter((o) => !selectedIds.includes(o.value))
          .map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{opt.meta ? ` — ${opt.meta}` : ""}
            </option>
          ))}
      </select>
    </div>
  );
}

function MediaSelect({
  label,
  media,
  onChange,
  value,
}: {
  label: string;
  media: PortalMediaOption[];
  onChange: (id: string) => void;
  value: string;
}) {
  return (
    <div className="acc-field">
      <label className="acc-label">{label}</label>
      <select className="acc-select" onChange={(e) => onChange(e.target.value)} value={value}>
        <option value="">— None —</option>
        {media.map((item) => (
          <option key={item.id} value={item.id}>{item.alt || item.filename}</option>
        ))}
      </select>
    </div>
  );
}

export function TripWizard({
  destinations,
  document,
  itineraries,
  media,
  packages,
  trips,
}: {
  destinations: WizardLinkOption[];
  document?: Record<string, unknown>;
  itineraries: WizardLinkOption[];
  media: PortalMediaOption[];
  packages: WizardLinkOption[];
  trips: WizardLinkOption[];
}) {
  const router = useRouter();
  const isEdit = !!document?.id;
  const currentTripId = isEdit ? String(document!.id) : "";

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(() =>
    document
      ? buildFromDoc(document)
      : {
          title: "",
          slug: "",
          heroEyebrow: "",
          heroSubtitle: "",
          cardSummary: "",
          departurePoint: "",
          location: "",
          routeLabel: "",
          startLocation: "",
          endLocation: "",
          packageId: "",
          packageTier: "mid-range",
          experienceTypes: [],
          destinationIds: [],
          availability: "on-request",
          heroImageId: "",
          heroVideoUrl: "",
          galleryImageIds: [],
          routeWaypoints: [{ place: "", label: "", notes: "" }],
          destinationStops: [],
          highlights: [],
          itineraryMode: "inline",
          itineraryId: "",
          itineraryDays: [emptyItineraryDay(1)],
          budgetCurrency: "USD",
          budgetMin: "",
          budgetMax: "",
          pricingBasis: "per-person",
          budgetDisplay: "",
          priceText: "",
          pricingPackages: [],
          included: [],
          excluded: [],
          optionalExperiences: [],
          accommodationSummary: "",
          accommodationOptions: [],
          overview: "",
          positiveImpact: "",
          bestFor: [],
          bestTimeToVisit: "",
          whyBook: [],
          quoteIntro: "",
          faqs: [{ question: "", answer: "" }],
          directAnswers: [{ question: "", answer: "" }],
          discountEnabled: false,
          discountLabel: "",
          discountAmount: "",
          mapEmbedUrl: "",
          relatedTripIds: [],
          notes: "",
          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
          trustindexEmbedOverride: "",
          featured: false,
        },
  );
  const [savingAs, setSavingAs] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"draft" | "published" | null>(null);

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function handleTitleChange(val: string) {
    set("title", val);
    if (!isEdit || !data.slug) {
      set("slug", slugify(val));
      if (!data.seoTitle) set("seoTitle", val);
    }
  }

  function toggleExperience(value: string) {
    set(
      "experienceTypes",
      data.experienceTypes.includes(value)
        ? data.experienceTypes.filter((x) => x !== value)
        : [...data.experienceTypes, value],
    );
  }

  function addItineraryDay() {
    const nextDay = data.itineraryDays.reduce((max, d) => Math.max(max, d.day), 0) + 1;
    set("itineraryDays", [...data.itineraryDays, emptyItineraryDay(nextDay)]);
  }

  function updateItineraryDay(index: number, patch: Partial<ItineraryDay>) {
    setData((d) => {
      const next = [...d.itineraryDays];
      next[index] = { ...next[index], ...patch };
      return { ...d, itineraryDays: next };
    });
  }

  function removeItineraryDay(index: number) {
    if (data.itineraryDays.length === 1) {
      set("itineraryDays", [emptyItineraryDay(1)]);
      return;
    }
    set("itineraryDays", data.itineraryDays.filter((_, i) => i !== index));
  }

  function addDestinationStop() {
    set("destinationStops", [
      ...data.destinationStops,
      { destinationId: "", title: "", description: "", imageId: "", alt: "" },
    ]);
  }

  function applyRouteFromItinerary() {
    const route = generateRouteFromItinerary(data.itineraryDays);
    setData((d) => ({
      ...d,
      endLocation: route.endLocation,
      routeLabel: route.routeLabel || d.routeLabel,
      routeWaypoints: route.waypoints,
      startLocation: route.startLocation,
    }));
  }

  function updateDestinationStop(index: number, patch: Partial<DestinationStop>) {
    setData((d) => {
      const next = [...d.destinationStops];
      const current = { ...next[index], ...patch };
      if (patch.destinationId && !patch.title) {
        const dest = destinations.find((o) => o.value === patch.destinationId);
        if (dest) current.title = dest.label;
      }
      next[index] = current;
      return { ...d, destinationStops: next };
    });
  }

  function validateBeforeSave() {
    if (!data.title.trim()) return "Trip title is required.";
    const nextSlug = (data.slug || slugify(data.title)).trim();
    if (!nextSlug) return "URL slug is required.";
    return "";
  }

  async function save(targetStatus: "draft" | "published") {
    const validationMessage = validateBeforeSave();
    if (validationMessage) {
      setError(validationMessage);
      setSuccess(null);
      return;
    }

    setSavingAs(targetStatus);
    setError("");
    setSuccess(null);

    const finalSlug = data.slug || slugify(data.title);
    const mapUrl = normalizeMapEmbedUrl(data.mapEmbedUrl);
    const linkedItinerary = itineraries.find((it) => it.value === data.itineraryId);
    const { days, nights } = computeTripDuration(data.itineraryMode, data.itineraryDays, linkedItinerary);
    const budgetPayload = buildTripBudgetPayload({
      currency: data.budgetCurrency.trim() || "USD",
      max: data.budgetMax ? Number(data.budgetMax) : undefined,
      min: data.budgetMin ? Number(data.budgetMin) : undefined,
      pricingBasis: data.pricingBasis,
    });

    const payload: Record<string, unknown> = {
      title: data.title.trim(),
      slug: finalSlug,
      heroEyebrow: data.heroEyebrow.trim(),
      heroSubtitle: data.heroSubtitle.trim(),
      cardSummary: data.cardSummary.trim(),
      departurePoint: data.departurePoint.trim(),
      heroVideoUrl: data.heroVideoUrl.trim(),
      days: days || undefined,
      nights: nights || undefined,
      location: data.location.trim(),
      routeLabel: data.routeLabel.trim(),
      startLocation: data.startLocation.trim(),
      endLocation: data.endLocation.trim(),
      packageTier: data.packageTier,
      experienceTypes: data.experienceTypes,
      availability: data.availability,
      overview: data.overview.trim(),
      positiveImpact: data.positiveImpact.trim(),
      quoteIntro: data.quoteIntro.trim(),
      mapEmbedUrl: mapUrl,
      notes: data.notes.trim(),
      trustindexEmbedOverride: data.trustindexEmbedOverride.trim(),
      featured: data.featured,
      status: targetStatus,
      budget: budgetPayload,
      priceText: budgetPayload.displayText || "",
      discount: {
        enabled: data.discountEnabled,
        label: data.discountLabel.trim(),
        amountText: data.discountAmount.trim(),
      },
      seo: {
        title: (data.seoTitle || data.title).trim(),
        description: data.seoDescription.trim(),
        keywords: data.seoKeywords.trim(),
      },
      faqs: data.faqs.filter((i) => i.question.trim() && i.answer.trim()),
      directAnswers: data.directAnswers.filter((i) => i.question.trim() && i.answer.trim()),
      included: data.included.map((item) => ({ item })),
      excluded: data.excluded.map((item) => ({ item })),
      whyBook: data.whyBook.map((item) => ({ item })),
      bestFor: data.bestFor.map((item) => ({ item })),
      bestTimeToVisit: data.bestTimeToVisit.trim(),
      accommodationSummary: data.accommodationSummary.trim(),
    };

    const optionalExperiences = data.optionalExperiences
      .filter((item) => item.title.trim())
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        priceNote: item.priceNote.trim(),
      }));
    if (optionalExperiences.length) payload.optionalExperiences = optionalExperiences;

    const accommodationOptions = data.accommodationOptions
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        note: item.note.trim(),
      }));
    if (accommodationOptions.length) payload.accommodationOptions = accommodationOptions;

    if (data.packageId) payload.package = toPayloadMediaId(data.packageId);
    if (data.heroImageId) payload.heroImage = toPayloadMediaId(data.heroImageId);
    if (data.destinationIds.length) {
      payload.destinations = data.destinationIds.map((id) => toPayloadMediaId(id));
    }
    if (data.relatedTripIds.length) {
      payload.relatedTrips = data.relatedTripIds.map((id) => toPayloadMediaId(id));
    }
    if (data.galleryImageIds.length) {
      payload.gallery = data.galleryImageIds.map((id) => {
        const asset = media.find((item) => item.id === id);
        return {
          image: toPayloadMediaId(id),
          alt: asset?.alt?.trim() || data.title.trim() || "Safari trip image",
          caption: asset?.caption?.trim() || "",
        };
      });
    }

    const waypoints = data.routeWaypoints.filter((w) => w.place.trim());
    if (waypoints.length) payload.routeWaypoints = waypoints;

    const stops = data.destinationStops
      .filter((s) => s.title.trim() || s.destinationId)
      .map((s) => ({
        destination: s.destinationId ? toPayloadMediaId(s.destinationId) : undefined,
        title: s.title.trim() || destinations.find((d) => d.value === s.destinationId)?.label || "Destination stop",
        description: s.description.trim(),
        image: s.imageId ? toPayloadMediaId(s.imageId) : undefined,
        alt: s.alt.trim(),
      }));
    if (stops.length) payload.destinationStops = stops;

    const highlightItems = data.highlights
      .filter((h) => h.title.trim())
      .map((h) => ({
        title: h.title.trim(),
        description: h.description.trim(),
        image: h.imageId ? toPayloadMediaId(h.imageId) : undefined,
        alt: h.alt.trim(),
      }));
    if (highlightItems.length) payload.highlights = highlightItems;

    if (data.itineraryMode === "linked" && data.itineraryId) {
      payload.itinerary = toPayloadMediaId(data.itineraryId);
    } else {
      const days = data.itineraryDays
        .filter((d) => d.title.trim() && d.description.trim())
        .map((d) => ({
          day: d.day,
          title: d.title.trim(),
          location: d.location.trim(),
          description: d.description.trim(),
          activities: d.activities.trim(),
          meals: d.meals.trim(),
          accommodation: d.accommodation.trim(),
          experienceNotes: d.experienceNotes.trim(),
          image: d.imageId ? toPayloadMediaId(d.imageId) : undefined,
        }));
      if (days.length) payload.itineraryDays = days;
    }

    const seasons = packagesToPriceSeasons(data.pricingPackages).map((season) => ({
      title: season.title || season.seasonLabel || "",
      tier: season.tier,
      packageLabel: season.packageLabel,
      seasonLabel: season.seasonLabel,
      partySizeLabel: season.partySizeLabel,
      dateRange: season.dateRange,
      currency: season.currency || "USD",
      min: season.min,
      max: season.max,
      displayText: season.displayText,
      notes: season.notes,
      ctaLabel: season.ctaLabel || "Inquire",
    }));
    if (seasons.length) payload.priceSeasons = seasons;

    const body: Record<string, unknown> = { collection: "trips", data: payload };
    if (isEdit) body.id = currentTripId;

    const res = await fetch("/api/portal/records", {
      body: JSON.stringify(body),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setSavingAs(null);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as Record<string, string>).message ?? "Failed to save. Please try again.");
      return;
    }

    setSuccess(targetStatus);
    setTimeout(() => {
      router.push("/admin/trips");
      router.refresh();
    }, 1800);
  }

  const mapPreviewUrl = normalizeMapEmbedUrl(data.mapEmbedUrl);
  const relatedTripOptions = trips.filter((t) => t.value !== currentTripId);
  const linkedItinerary = itineraries.find((it) => it.value === data.itineraryId);
  const tripDuration = computeTripDuration(data.itineraryMode, data.itineraryDays, linkedItinerary);
  const activeWaypoints = useMemo(
    () => data.routeWaypoints.filter((w) => w.place.trim()),
    [data.routeWaypoints],
  );

  const stepValid: Record<number, boolean> = {
    1: !!data.title.trim(),
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  };

  return (
    <div className="acc-wizard acc-wizard--wide">
      <div className="acc-wizard__steps">
        {STEPS.map((s) => (
          <button
            className={["acc-wizard__step", step === s.id ? "is-active" : "", step > s.id ? "is-done" : ""].filter(Boolean).join(" ")}
            key={s.id}
            onClick={() => step > s.id && setStep(s.id)}
            type="button"
          >
            <span className="acc-wizard__step-num">
              {step > s.id ? <Check size={12} strokeWidth={3} /> : s.id}
            </span>
            <span className="acc-wizard__step-text">
              <strong>{s.label}</strong>
              <small>{s.description}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="acc-wizard__body">
        {step === 1 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Trip Basics</h2>
            <p className="acc-wizard__sub">
              Set the public title, filters, and tour summary. Duration is calculated automatically from the itinerary in Step 3.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-title">Trip Title <span className="acc-req">*</span></label>
              <input className="acc-input" id="trip-title" onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. 3 Days Masai Mara Fly-In Safari Package" type="text" value={data.title} />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-slug">URL Slug <span className="acc-req">*</span></label>
              <div className="acc-slug-wrap">
                <span className="acc-slug-prefix">/trips/</span>
                <input className="acc-input acc-input--slug" id="trip-slug" onChange={(e) => set("slug", slugify(e.target.value))} type="text" value={data.slug} />
              </div>
              <span className="acc-hint">Use lowercase words separated by hyphens, e.g. <code>3-days-masai-mara-fly-in-safari-package</code>.</span>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="trip-tier">Package Tier</label>
                <select className="acc-select" id="trip-tier" onChange={(e) => set("packageTier", e.target.value)} value={data.packageTier}>
                  {TRIP_TIER_FILTER_OPTIONS.filter((option) => option.value !== "__all").map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="acc-hint">Controls listing badge and price table grouping.</span>
              </div>
              <div className="acc-field">
                <label className="acc-label">Experience Types</label>
                <span className="acc-hint">Select every style that applies. Used by filters and listing badges.</span>
              </div>
            </div>

            <div className="acc-field">
              <div className="acc-amenity-suggestions">
                {TRIP_EXPERIENCE_FILTER_OPTIONS.filter((option) => option.value !== "__all").map((opt) => (
                  <button
                    className={`acc-amenity-suggest${data.experienceTypes.includes(opt.value) ? " is-on" : ""}`}
                    key={opt.value}
                    onClick={() => toggleExperience(opt.value)}
                    type="button"
                  >
                    {data.experienceTypes.includes(opt.value) ? "✓ " : "+ "}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="trip-eyebrow">Hero Category Line</label>
                <input className="acc-input" id="trip-eyebrow" onChange={(e) => set("heroEyebrow", e.target.value)} placeholder="e.g. Luxury Fly-In Safari" type="text" value={data.heroEyebrow} />
                <button
                  className="acc-amenity-btn"
                  onClick={() => set("heroEyebrow", suggestTripHeroEyebrow({
                    experienceTypes: data.experienceTypes,
                    packageTier: data.packageTier,
                  }))}
                  style={{ marginTop: 8 }}
                  type="button"
                >
                  Suggest from tier + experience
                </button>
                <span className="acc-hint">Shown above the title on the trip detail hero only. Do not paste the full package title here.</span>
              </div>
              <div className="acc-field">
                <label className="acc-label" htmlFor="trip-subtitle">Hero Subtitle</label>
                <textarea className="acc-textarea" id="trip-subtitle" onChange={(e) => set("heroSubtitle", e.target.value)} placeholder="e.g. Luxury air safari from Nairobi to the Masai Mara" rows={3} value={data.heroSubtitle} />
              </div>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-location">Primary Destination Label</label>
              <input className="acc-input" id="trip-location" onChange={(e) => set("location", e.target.value)} placeholder="e.g. Masai Mara, Kenya" type="text" value={data.location} />
              <span className="acc-hint">Short label shown on listing cards and hero facts.</span>
            </div>

            <div className="acc-row">
              <PlaceSearchInput
                datalistOptions={destinations.map((d) => d.mapPlace ?? d.label)}
                id="trip-start-loc-basics"
                label="Start Point"
                onChange={(value) => set("startLocation", value)}
                placeholder="Nairobi, Kenya"
                value={data.startLocation}
              />
              <PlaceSearchInput
                datalistOptions={destinations.map((d) => d.mapPlace ?? d.label)}
                id="trip-end-loc-basics"
                label="End Point"
                onChange={(value) => set("endLocation", value)}
                placeholder="Nairobi, Kenya"
                value={data.endLocation}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-departure">Departure / Flight Point</label>
              <input className="acc-input" id="trip-departure" onChange={(e) => set("departurePoint", e.target.value)} placeholder="e.g. Wilson Airport" type="text" value={data.departurePoint} />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-package">Linked Package</label>
              <select className="acc-select" id="trip-package" onChange={(e) => set("packageId", e.target.value)} value={data.packageId}>
                <option value="">— No package —</option>
                {packages.map((pkg) => (
                  <option key={pkg.value} value={pkg.value}>{pkg.label}{pkg.meta ? ` — ${pkg.meta}` : ""}</option>
                ))}
              </select>
              {data.packageId ? (
                <a className="acc-inline-link" href={packages.find((p) => p.value === data.packageId)?.href} rel="noreferrer" target="_blank">
                  View published package <ExternalLink size={12} />
                </a>
              ) : (
                <span className="acc-hint">Only published packages are listed.</span>
              )}
            </div>

            <div className="acc-field">
              <label className="acc-label">Destinations Visited</label>
              <MultiSelectDropdown
                addLabel="Add a published destination…"
                emptyLabel="No destinations selected."
                onChange={(ids) => set("destinationIds", ids)}
                options={destinations}
                selectedIds={data.destinationIds}
              />
            </div>

          </div>
        )}

        {step === 2 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Hero & Gallery</h2>
            <p className="acc-wizard__sub">Hero media for the trip page header and carousel gallery images.</p>

            <MediaPickerField
              hasMany={false}
              initialValues={data.heroImageId ? [data.heroImageId] : []}
              label="Hero Image"
              onChange={(ids) => set("heroImageId", ids[0] ?? "")}
              options={media}
            />
            <span className="acc-hint">If empty, the first gallery image is used on the public page.</span>

            <div className="acc-field" style={{ marginTop: 16 }}>
              <label className="acc-label" htmlFor="trip-hero-video">Hero Video URL</label>
              <input className="acc-input" id="trip-hero-video" onChange={(e) => set("heroVideoUrl", e.target.value)} placeholder="Reserved for future video hero support" type="url" value={data.heroVideoUrl} />
            </div>

            <div style={{ marginTop: 24 }}>
              <MediaPickerField
                hasMany
                initialValues={data.galleryImageIds}
                label="Gallery / Carousel Images"
                onChange={(ids) => set("galleryImageIds", ids)}
                options={media}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Itinerary</h2>
            <p className="acc-wizard__sub">
              Build the day-by-day plan. Trip length is calculated from the highest day number — e.g. Day 1 through Day 7 means a 7-day / 6-night safari.
            </p>

            {tripDuration.days > 0 ? (
              <div className="acc-duration-badge">
                <strong>{tripDuration.days} day{tripDuration.days === 1 ? "" : "s"}</strong>
                <span>/ {tripDuration.nights} night{tripDuration.nights === 1 ? "" : "s"}</span>
              </div>
            ) : null}

            <div className="acc-field">
              <label className="acc-label">Itinerary Source</label>
              <div className="acc-amenity-suggestions">
                <button className={`acc-amenity-suggest${data.itineraryMode === "inline" ? " is-on" : ""}`} onClick={() => set("itineraryMode", "inline")} type="button">Day-by-day on this trip</button>
                <button className={`acc-amenity-suggest${data.itineraryMode === "linked" ? " is-on" : ""}`} onClick={() => set("itineraryMode", "linked")} type="button">Link shared itinerary</button>
              </div>
            </div>

            {data.itineraryMode === "linked" ? (
              <div className="acc-field">
                <label className="acc-label">Shared Itinerary</label>
                <select className="acc-select" onChange={(e) => set("itineraryId", e.target.value)} value={data.itineraryId}>
                  <option value="">— Select itinerary —</option>
                  {itineraries.map((it) => (
                    <option key={it.value} value={it.value}>{it.label}{it.meta ? ` — ${it.meta}` : ""}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="acc-faq-head">
                  <label className="acc-label">Day-by-Day Plan</label>
                  <button className="acc-amenity-btn" onClick={addItineraryDay} type="button"><Plus size={14} /> Add Day</button>
                </div>
                <div className="acc-faq-list">
                  {data.itineraryDays.map((day, index) => (
                    <div className="acc-faq-item acc-itinerary-day" key={index}>
                      <div className="acc-itinerary-day__badge">Day {day.day}</div>
                      <button aria-label="Remove day" className="acc-faq-remove" onClick={() => removeItineraryDay(index)} type="button"><X size={14} /></button>
                      <div className="acc-row">
                        <div className="acc-field">
                          <label className="acc-label">Day Number</label>
                          <input className="acc-input" min="1" onChange={(e) => updateItineraryDay(index, { day: Number(e.target.value) || 1 })} type="number" value={day.day} />
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">Title <span className="acc-req">*</span></label>
                          <input className="acc-input" onChange={(e) => updateItineraryDay(index, { title: e.target.value })} placeholder="Arrival & afternoon game drive" type="text" value={day.title} />
                        </div>
                      </div>
                      <div className="acc-row">
                        <PlaceSearchInput
                          datalistOptions={destinations.map((d) => d.mapPlace ?? d.label)}
                          id={`trip-locations-${index}`}
                          label="Location (for route map)"
                          onChange={(value) => updateItineraryDay(index, { location: value })}
                          placeholder="e.g. Masai Mara, Kenya"
                          value={day.location}
                        />
                        <div className="acc-field">
                          <label className="acc-label">Pick from destination</label>
                          <select
                            className="acc-select"
                            onChange={(e) => {
                              const dest = destinations.find((d) => d.value === e.target.value);
                              if (dest?.mapPlace) updateItineraryDay(index, { location: dest.mapPlace });
                            }}
                            value=""
                          >
                            <option value="">Fill location from CMS…</option>
                            {destinations.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="acc-row">
                        <div className="acc-field">
                          <label className="acc-label">Meals</label>
                          <input className="acc-input" onChange={(e) => updateItineraryDay(index, { meals: e.target.value })} placeholder="B/L/D" type="text" value={day.meals} />
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">Accommodation</label>
                          <input className="acc-input" onChange={(e) => updateItineraryDay(index, { accommodation: e.target.value })} type="text" value={day.accommodation} />
                        </div>
                      </div>
                      <div className="acc-field">
                        <label className="acc-label">Main Experience</label>
                        <textarea className="acc-textarea" onChange={(e) => updateItineraryDay(index, { activities: e.target.value })} placeholder="e.g. Scenic flight, afternoon game drive" rows={2} value={day.activities} />
                      </div>
                      <div className="acc-field">
                        <label className="acc-label">Description <span className="acc-req">*</span></label>
                        <textarea className="acc-textarea" onChange={(e) => updateItineraryDay(index, { description: e.target.value })} rows={4} value={day.description} />
                      </div>
                      <div className="acc-field">
                        <label className="acc-label">Experience Notes</label>
                        <textarea className="acc-textarea" onChange={(e) => updateItineraryDay(index, { experienceNotes: e.target.value })} rows={2} value={day.experienceNotes} />
                      </div>
                      <MediaSelect label="Day Image" media={media} onChange={(id) => updateItineraryDay(index, { imageId: id })} value={day.imageId} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Route & Map</h2>
            <p className="acc-wizard__sub">
              Build the travel path from stop to stop. Use &quot;Generate from itinerary&quot; to pull locations from Day 1, Day 2, etc. The map preview shows the route like Nairobi → Masai Mara on the public trip page.
            </p>

            <div className="acc-faq-head">
              <label className="acc-label">Route Summary</label>
              <button className="acc-amenity-btn" onClick={applyRouteFromItinerary} type="button">Generate from itinerary</button>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-route-label">Route Label</label>
              <input className="acc-input" id="trip-route-label" onChange={(e) => set("routeLabel", e.target.value)} placeholder="Nairobi to Masai Mara" type="text" value={data.routeLabel} />
            </div>

            <div className="acc-row">
              <PlaceSearchInput
                datalistOptions={destinations.map((d) => d.mapPlace ?? d.label)}
                id="trip-start-loc"
                label="From"
                onChange={(value) => set("startLocation", value)}
                placeholder="Nairobi, Kenya"
                value={data.startLocation}
              />
              <PlaceSearchInput
                datalistOptions={destinations.map((d) => d.mapPlace ?? d.label)}
                id="trip-end-loc"
                label="To"
                onChange={(value) => set("endLocation", value)}
                placeholder="Masai Mara, Kenya"
                value={data.endLocation}
              />
            </div>

            {activeWaypoints.length > 0 ? (
              <div className="acc-field">
                <label className="acc-label">Route Map Preview</label>
                <TripRouteMap
                  endLocation={data.endLocation}
                  startLocation={data.startLocation}
                  waypoints={activeWaypoints}
                />
              </div>
            ) : null}

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Route Waypoints</label>
                <button className="acc-amenity-btn" onClick={() => set("routeWaypoints", [...data.routeWaypoints, { place: "", label: "", notes: "" }])} type="button">
                  <Plus size={14} /> Add Stop
                </button>
              </div>
              <div className="acc-faq-list">
                {data.routeWaypoints.map((wp, index) => (
                  <div className="acc-faq-item" key={index}>
                    <button aria-label="Remove" className="acc-faq-remove" onClick={() => set("routeWaypoints", data.routeWaypoints.filter((_, i) => i !== index).length ? data.routeWaypoints.filter((_, i) => i !== index) : [{ place: "", label: "", notes: "" }])} type="button"><X size={14} /></button>
                    <div className="acc-row">
                      <PlaceSearchInput
                        datalistOptions={destinations.map((d) => d.mapPlace ?? d.label)}
                        id={`trip-waypoint-places-${index}`}
                        label="Place"
                        onChange={(value) => {
                          const n = [...data.routeWaypoints];
                          n[index] = { ...n[index], place: value };
                          set("routeWaypoints", n);
                        }}
                        placeholder="Masai Mara, Kenya"
                        value={wp.place}
                      />
                      <div className="acc-field">
                        <label className="acc-label">Label</label>
                        <input className="acc-input" onChange={(e) => { const n = [...data.routeWaypoints]; n[index] = { ...n[index], label: e.target.value }; set("routeWaypoints", n); }} placeholder="Day 2–3: Game drives" type="text" value={wp.label} />
                      </div>
                    </div>
                    <div className="acc-field">
                      <label className="acc-label">Notes</label>
                      <textarea className="acc-textarea" onChange={(e) => { const n = [...data.routeWaypoints]; n[index] = { ...n[index], notes: e.target.value }; set("routeWaypoints", n); }} rows={2} value={wp.notes} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Destination Stops — Where You Will Go</label>
                <button className="acc-amenity-btn" onClick={addDestinationStop} type="button"><Plus size={14} /> Add Stop Card</button>
              </div>
              {data.destinationStops.length === 0 ? (
                <span className="acc-hint">Add cards for each major destination on this trip.</span>
              ) : null}
              <div className="acc-faq-list">
                {data.destinationStops.map((stop, index) => (
                  <div className="acc-faq-item" key={index}>
                    <button aria-label="Remove" className="acc-faq-remove" onClick={() => set("destinationStops", data.destinationStops.filter((_, i) => i !== index))} type="button"><X size={14} /></button>
                    <div className="acc-row">
                      <div className="acc-field">
                        <label className="acc-label">Linked Destination</label>
                        <select className="acc-select" onChange={(e) => updateDestinationStop(index, { destinationId: e.target.value })} value={stop.destinationId}>
                          <option value="">— Select —</option>
                          {destinations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="acc-field">
                        <label className="acc-label">Card Title</label>
                        <input className="acc-input" onChange={(e) => updateDestinationStop(index, { title: e.target.value })} type="text" value={stop.title} />
                      </div>
                    </div>
                    <div className="acc-field">
                      <label className="acc-label">Description</label>
                      <textarea className="acc-textarea" onChange={(e) => updateDestinationStop(index, { description: e.target.value })} rows={3} value={stop.description} />
                    </div>
                    <div className="acc-row">
                      <MediaSelect label="Image" media={media} onChange={(id) => updateDestinationStop(index, { imageId: id })} value={stop.imageId} />
                      <div className="acc-field">
                        <label className="acc-label">Image Alt</label>
                        <input className="acc-input" onChange={(e) => updateDestinationStop(index, { alt: e.target.value })} type="text" value={stop.alt} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="acc-hint">
              The route map is built automatically from your From, To, and waypoint places above — no embed URL or coordinates needed.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Pricing & Inclusions</h2>
            <p className="acc-wizard__sub">
              Set the headline price, seasonal rate rows, accommodation options, inclusions, exclusions, and optional paid add-ons.
            </p>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label">Currency</label>
                <input className="acc-input" onChange={(e) => set("budgetCurrency", e.target.value)} type="text" value={data.budgetCurrency} />
              </div>
              <div className="acc-field">
                <label className="acc-label">Budget Min</label>
                <input className="acc-input" min="0" onChange={(e) => set("budgetMin", e.target.value)} type="number" value={data.budgetMin} />
              </div>
              <div className="acc-field">
                <label className="acc-label">Budget Max</label>
                <input className="acc-input" min="0" onChange={(e) => set("budgetMax", e.target.value)} type="number" value={data.budgetMax} />
              </div>
            </div>

            <div className="acc-field">
              <label className="acc-label">Pricing Basis</label>
              <select
                className="acc-select"
                onChange={(e) => set("pricingBasis", e.target.value as TripPricingBasis)}
                value={data.pricingBasis}
              >
                <option value="per-person">Per person</option>
                <option value="per-person-sharing">Per person sharing</option>
              </select>
            </div>

            <div className="acc-field">
              <label className="acc-label">Public price line</label>
              <p className="acc-hint" style={{ color: "#111827", fontWeight: 700, margin: 0 }}>
                {formatTripPrice({
                  currency: data.budgetCurrency,
                  max: data.budgetMax ? Number(data.budgetMax) : undefined,
                  min: data.budgetMin ? Number(data.budgetMin) : undefined,
                  pricingBasis: data.pricingBasis,
                })}
              </p>
              <p className="acc-hint">Generated automatically from currency, min, max, and pricing basis.</p>
            </div>

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Pricing Packages</label>
                <button
                  className="acc-amenity-btn"
                  onClick={() => set("pricingPackages", [...data.pricingPackages, emptyPricingPackage(data.packageTier || "luxury")])}
                  type="button"
                >
                  <Plus size={14} /> Add Package Table
                </button>
              </div>
              <span className="acc-hint">
                Add one table per sub-package (Budget, Luxury, etc.). Each season row can include prices for 2–3, 4–5, and 6+ travellers. Visitors see an Inquire button on every row.
              </span>
              <div className="acc-price-packages">
                {data.pricingPackages.map((pkg, pkgIndex) => (
                  <div className={`acc-price-package acc-price-package--${pkg.tier}`} key={pkg.id}>
                    <div className="acc-price-package__head">
                      <div className="acc-row">
                        <div className="acc-field">
                          <label className="acc-label">Tier</label>
                          <select
                            className="acc-select"
                            onChange={(e) => {
                              const tier = e.target.value;
                              const next = [...data.pricingPackages];
                              next[pkgIndex] = {
                                ...next[pkgIndex],
                                tier,
                                packageLabel: next[pkgIndex].packageLabel || defaultPackageLabel(tier),
                              };
                              set("pricingPackages", next);
                            }}
                            value={pkg.tier}
                          >
                            {TRIP_TIER_FILTER_OPTIONS.filter((option) => option.value !== "__all").map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">Table Label</label>
                          <input
                            className="acc-input"
                            onChange={(e) => {
                              const next = [...data.pricingPackages];
                              next[pkgIndex] = { ...next[pkgIndex], packageLabel: e.target.value };
                              set("pricingPackages", next);
                            }}
                            placeholder="e.g. Luxury Accommodations"
                            type="text"
                            value={pkg.packageLabel}
                          />
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">Currency</label>
                          <input
                            className="acc-input"
                            onChange={(e) => {
                              const next = [...data.pricingPackages];
                              next[pkgIndex] = { ...next[pkgIndex], currency: e.target.value };
                              set("pricingPackages", next);
                            }}
                            type="text"
                            value={pkg.currency}
                          />
                        </div>
                      </div>
                      <button
                        aria-label="Remove package"
                        className="acc-faq-remove"
                        onClick={() => set("pricingPackages", data.pricingPackages.filter((_, index) => index !== pkgIndex))}
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="acc-price-matrix-scroll">
                      <table className="acc-price-matrix">
                        <thead>
                          <tr>
                            <th>Season</th>
                            <th>Dates</th>
                            {DEFAULT_PARTY_COLUMNS.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                            <th aria-label="Actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {pkg.rows.map((row, rowIndex) => (
                            <tr key={`${pkg.id}-${rowIndex}`}>
                              <td>
                                <input
                                  className="acc-input"
                                  onChange={(e) => {
                                    const next = [...data.pricingPackages];
                                    const rows = [...next[pkgIndex].rows];
                                    rows[rowIndex] = { ...rows[rowIndex], seasonLabel: e.target.value };
                                    next[pkgIndex] = { ...next[pkgIndex], rows };
                                    set("pricingPackages", next);
                                  }}
                                  placeholder="Jan–Mar"
                                  type="text"
                                  value={row.seasonLabel}
                                />
                              </td>
                              <td>
                                <input
                                  className="acc-input"
                                  onChange={(e) => {
                                    const next = [...data.pricingPackages];
                                    const rows = [...next[pkgIndex].rows];
                                    rows[rowIndex] = { ...rows[rowIndex], dateRange: e.target.value };
                                    next[pkgIndex] = { ...next[pkgIndex], rows };
                                    set("pricingPackages", next);
                                  }}
                                  placeholder="January to March"
                                  type="text"
                                  value={row.dateRange}
                                />
                              </td>
                              {DEFAULT_PARTY_COLUMNS.map((column) => (
                                <td key={column}>
                                  <input
                                    className="acc-input"
                                    min="0"
                                    onChange={(e) => {
                                      const next = [...data.pricingPackages];
                                      const rows = [...next[pkgIndex].rows];
                                      rows[rowIndex] = {
                                        ...rows[rowIndex],
                                        prices: { ...rows[rowIndex].prices, [column]: e.target.value },
                                      };
                                      next[pkgIndex] = { ...next[pkgIndex], rows };
                                      set("pricingPackages", next);
                                    }}
                                    placeholder="0"
                                    type="number"
                                    value={row.prices[column] || ""}
                                  />
                                </td>
                              ))}
                              <td>
                                <button
                                  aria-label="Remove season row"
                                  className="acc-faq-remove"
                                  onClick={() => {
                                    const next = [...data.pricingPackages];
                                    next[pkgIndex] = {
                                      ...next[pkgIndex],
                                      rows: next[pkgIndex].rows.filter((_, index) => index !== rowIndex),
                                    };
                                    set("pricingPackages", next);
                                  }}
                                  type="button"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      className="acc-amenity-btn"
                      onClick={() => {
                        const next = [...data.pricingPackages];
                        next[pkgIndex] = {
                          ...next[pkgIndex],
                          rows: [...next[pkgIndex].rows, emptyPricingPackageRow()],
                        };
                        set("pricingPackages", next);
                      }}
                      type="button"
                    >
                      <Plus size={14} /> Add Season Row
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-accommodation-summary">Accommodation Summary</label>
              <textarea className="acc-textarea" id="trip-accommodation-summary" onChange={(e) => set("accommodationSummary", e.target.value)} placeholder="Your stay will be arranged in a carefully selected luxury tented camp or safari lodge…" rows={4} value={data.accommodationSummary} />
            </div>

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Accommodation Options</label>
                <button className="acc-amenity-btn" onClick={() => set("accommodationOptions", [...data.accommodationOptions, { name: "", note: "" }])} type="button"><Plus size={14} /> Add Lodge/Camp</button>
              </div>
              <div className="acc-faq-list">
                {data.accommodationOptions.map((option, index) => (
                  <div className="acc-faq-item" key={index}>
                    <button aria-label="Remove" className="acc-faq-remove" onClick={() => set("accommodationOptions", data.accommodationOptions.filter((_, i) => i !== index))} type="button"><X size={14} /></button>
                    <div className="acc-row">
                      <div className="acc-field">
                        <label className="acc-label">Property Name</label>
                        <input className="acc-input" onChange={(e) => { const n = [...data.accommodationOptions]; n[index] = { ...n[index], name: e.target.value }; set("accommodationOptions", n); }} type="text" value={option.name} />
                      </div>
                      <div className="acc-field">
                        <label className="acc-label">Note</label>
                        <input className="acc-input" onChange={(e) => { const n = [...data.accommodationOptions]; n[index] = { ...n[index], note: e.target.value }; set("accommodationOptions", n); }} placeholder="Optional" type="text" value={option.note} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <TagListEditor items={data.included} onChange={(items) => set("included", items)} placeholder="e.g. Park fees, domestic flights, meals as per itinerary…" title="Included" />
            <TagListEditor items={data.excluded} onChange={(items) => set("excluded", items)} placeholder="e.g. International flights, visa fees, tips…" title="Excluded" />

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Optional Add-On Experiences</label>
                <button className="acc-amenity-btn" onClick={() => set("optionalExperiences", [...data.optionalExperiences, { title: "", description: "", priceNote: "" }])} type="button"><Plus size={14} /> Add Optional Experience</button>
              </div>
              <div className="acc-faq-list">
                {data.optionalExperiences.map((experience, index) => (
                  <div className="acc-faq-item" key={index}>
                    <button aria-label="Remove" className="acc-faq-remove" onClick={() => set("optionalExperiences", data.optionalExperiences.filter((_, i) => i !== index))} type="button"><X size={14} /></button>
                    <div className="acc-field">
                      <label className="acc-label">Title</label>
                      <input className="acc-input" onChange={(e) => { const n = [...data.optionalExperiences]; n[index] = { ...n[index], title: e.target.value }; set("optionalExperiences", n); }} placeholder="Hot Air Balloon Safari" type="text" value={experience.title} />
                    </div>
                    <div className="acc-field">
                      <label className="acc-label">Description</label>
                      <textarea className="acc-textarea" onChange={(e) => { const n = [...data.optionalExperiences]; n[index] = { ...n[index], description: e.target.value }; set("optionalExperiences", n); }} rows={3} value={experience.description} />
                    </div>
                    <div className="acc-field">
                      <label className="acc-label">Price Note</label>
                      <input className="acc-input" onChange={(e) => { const n = [...data.optionalExperiences]; n[index] = { ...n[index], priceNote: e.target.value }; set("optionalExperiences", n); }} placeholder="Approx. USD 480 per person" type="text" value={experience.priceNote} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="acc-field">
              <label className="acc-label acc-check-label">
                <input checked={data.discountEnabled} onChange={(e) => set("discountEnabled", e.target.checked)} type="checkbox" />
                <span>Show promotional discount on listing</span>
              </label>
            </div>
            {data.discountEnabled && (
              <div className="acc-row">
                <div className="acc-field">
                  <label className="acc-label">Discount Label</label>
                  <input className="acc-input" onChange={(e) => set("discountLabel", e.target.value)} type="text" value={data.discountLabel} />
                </div>
                <div className="acc-field">
                  <label className="acc-label">Discount Amount</label>
                  <input className="acc-input" onChange={(e) => set("discountAmount", e.target.value)} type="text" value={data.discountAmount} />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Content & FAQs</h2>
            <p className="acc-wizard__sub">
              Add the long overview, listing card excerpt, safari highlights, audience fit, and FAQs visitors will read on the trip page.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-overview">Trip Overview</label>
              <textarea className="acc-textarea" id="trip-overview" onChange={(e) => set("overview", e.target.value)} placeholder="Full introductory copy for the Overview section on the trip detail page." rows={8} value={data.overview} />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-card-summary">Listing Card Summary</label>
              <textarea className="acc-textarea" id="trip-card-summary" onChange={(e) => set("cardSummary", e.target.value)} placeholder="Short excerpt used on /trips listing cards. Aim for 120–160 characters." rows={3} value={data.cardSummary} />
            </div>

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Safari Highlights</label>
                <button className="acc-amenity-btn" onClick={() => set("highlights", [...data.highlights, { title: "", description: "", imageId: "", alt: "" }])} type="button"><Plus size={14} /> Add Highlight</button>
              </div>
              <span className="acc-hint">One bullet per highlight. Title is required; description and image are optional.</span>
              <div className="acc-faq-list">
                {data.highlights.map((hl, index) => (
                  <div className="acc-faq-item" key={index}>
                    <button aria-label="Remove" className="acc-faq-remove" onClick={() => set("highlights", data.highlights.filter((_, i) => i !== index))} type="button"><X size={14} /></button>
                    <div className="acc-field">
                      <label className="acc-label">Highlight</label>
                      <input className="acc-input" onChange={(e) => { const n = [...data.highlights]; n[index] = { ...n[index], title: e.target.value }; set("highlights", n); }} placeholder="Scenic flight from Nairobi Wilson Airport to the Masai Mara" type="text" value={hl.title} />
                    </div>
                    <div className="acc-field">
                      <label className="acc-label">Optional Detail</label>
                      <textarea className="acc-textarea" onChange={(e) => { const n = [...data.highlights]; n[index] = { ...n[index], description: e.target.value }; set("highlights", n); }} rows={2} value={hl.description} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <TagListEditor items={data.bestFor} onChange={(items) => set("bestFor", items)} placeholder="e.g. Honeymooners, families, photographers…" title="Best For" />
            <TagListEditor items={data.whyBook} onChange={(items) => set("whyBook", items)} placeholder="Why choose this safari package…" title="Why Choose This Safari" />

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-best-time">Best Time to Visit</label>
              <textarea className="acc-textarea" id="trip-best-time" onChange={(e) => set("bestTimeToVisit", e.target.value)} rows={4} value={data.bestTimeToVisit} />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-impact">Positive Impact</label>
              <textarea className="acc-textarea" id="trip-impact" onChange={(e) => set("positiveImpact", e.target.value)} rows={4} value={data.positiveImpact} />
            </div>
            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-quote-intro">Quote Form Intro</label>
              <textarea className="acc-textarea" id="trip-quote-intro" onChange={(e) => set("quoteIntro", e.target.value)} rows={3} value={data.quoteIntro} />
            </div>

            <QaEditor addLabel="Add FAQ" items={data.faqs} onChange={(items) => set("faqs", items)} title="Frequently Asked Questions" />
            <QaEditor addLabel="Add Direct Answer" items={data.directAnswers} onChange={(items) => set("directAnswers", items)} title="Direct Answers (SEO / featured snippets)" />
          </div>
        )}

        {step === 7 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Publish</h2>
            <p className="acc-wizard__sub">Set availability, SEO, related trips, then save or publish.</p>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="trip-avail">Availability</label>
                <select className="acc-select" id="trip-avail" onChange={(e) => set("availability", e.target.value)} value={data.availability}>
                  {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="acc-field">
              <label className="acc-label">Related Trips</label>
              <MultiSelectDropdown
                addLabel="Add a published trip…"
                emptyLabel="No related trips selected."
                onChange={(ids) => set("relatedTripIds", ids)}
                options={relatedTripOptions}
                selectedIds={data.relatedTripIds}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-notes">Internal Notes</label>
              <textarea className="acc-textarea" id="trip-notes" onChange={(e) => set("notes", e.target.value)} placeholder="Not shown to visitors" rows={3} value={data.notes} />
            </div>

            <div className="acc-row">
              <div className="acc-field">
              <label className="acc-label" htmlFor="trip-seo-title">SEO Title</label>
              <input className="acc-input" id="trip-seo-title" onChange={(e) => set("seoTitle", e.target.value)} placeholder="3 Days Masai Mara Fly-In Safari Package | Luxury Kenya Air Safari" type="text" value={data.seoTitle} />
              </div>
              <div className="acc-field">
                <label className="acc-label" htmlFor="trip-seo-keywords">Keywords</label>
                <input className="acc-input" id="trip-seo-keywords" onChange={(e) => set("seoKeywords", e.target.value)} type="text" value={data.seoKeywords} />
              </div>
            </div>
            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-seo-desc">SEO Description</label>
              <textarea className="acc-textarea" id="trip-seo-desc" onChange={(e) => set("seoDescription", e.target.value)} placeholder="Fly from Nairobi to the Masai Mara on a 3 days luxury fly-in safari package…" rows={3} value={data.seoDescription} />
            </div>
            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-trustindex">Trustindex Override</label>
              <textarea className="acc-textarea" id="trip-trustindex" onChange={(e) => set("trustindexEmbedOverride", e.target.value)} rows={3} value={data.trustindexEmbedOverride} />
            </div>

            <div className="acc-field acc-publish-row">
              <label className="acc-label acc-check-label">
                <input checked={data.featured} onChange={(e) => set("featured", e.target.checked)} type="checkbox" />
                <span>Feature this trip on the homepage and listing page</span>
              </label>
            </div>

            <div className="acc-review">
              <div className="acc-review__row"><span className="acc-review__label">Title</span><span className="acc-review__value">{data.title || <em>—</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Slug</span><span className="acc-review__value">/trips/{data.slug || <em>—</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Duration</span><span className="acc-review__value">{tripDuration.days ? `${tripDuration.days} days / ${tripDuration.nights} nights` : <em>Set in itinerary</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Availability</span><span className="acc-review__value">{AVAILABILITY_OPTIONS.find((o) => o.value === data.availability)?.label ?? data.availability}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Route</span><span className="acc-review__value">{data.routeLabel || (data.startLocation && data.endLocation ? `${data.startLocation} → ${data.endLocation}` : <em>—</em>)}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Package</span><span className="acc-review__value">{packages.find((p) => p.value === data.packageId)?.label ?? <em>None</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Destinations</span><span className="acc-review__value">{data.destinationIds.length || <em>None</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Itinerary</span><span className="acc-review__value">{data.itineraryMode === "linked" ? (itineraries.find((i) => i.value === data.itineraryId)?.label ?? <em>Not linked</em>) : `${data.itineraryDays.filter((d) => d.title.trim()).length} day(s)`}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Budget</span><span className="acc-review__value">{formatTripPrice({ currency: data.budgetCurrency, max: data.budgetMax ? Number(data.budgetMax) : undefined, min: data.budgetMin ? Number(data.budgetMin) : undefined, pricingBasis: data.pricingBasis })}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Gallery</span><span className="acc-review__value">{data.galleryImageIds.length} image(s)</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Featured</span><span className="acc-review__value">{data.featured ? "Yes" : "No"}</span></div>
            </div>

            <div className="acc-publish-note">
              <strong>Ready to go?</strong>
              <p>Use <em>Save Draft</em> to save without publishing, or <em>Publish</em> to make this trip live immediately.</p>
            </div>

            {success ? (
              <div className="acc-success">
                <Check size={16} strokeWidth={3} />
                {success === "published" ? "Published! Redirecting…" : "Saved as draft. Redirecting…"}
              </div>
            ) : null}
            {error ? <div className="acc-error"><AlertCircle size={16} />{error}</div> : null}
          </div>
        )}
      </div>

      <div className="acc-wizard__nav">
        <button className="acc-btn acc-btn--ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)} type="button">
          <ChevronLeft size={16} /> Back
        </button>
        <span className="acc-wizard__step-label">Step {step} of {STEPS.length}</span>
        {step < STEPS.length ? (
          <button className="acc-btn acc-btn--primary" disabled={!stepValid[step]} onClick={() => setStep((s) => s + 1)} type="button">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <div className="acc-wizard__final-actions">
            <button className="acc-btn acc-btn--save" disabled={savingAs !== null || !data.title.trim()} onClick={() => save("draft")} type="button">
              {savingAs === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button className="acc-btn acc-btn--publish" disabled={savingAs !== null || !data.title.trim()} onClick={() => save("published")} type="button">
              {savingAs === "published" ? "Publishing…" : "Publish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
