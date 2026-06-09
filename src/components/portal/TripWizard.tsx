"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronLeft, ChevronRight, ExternalLink, Plus, X } from "lucide-react";

import { TripRoutePlanner } from "@/components/portal/TripRoutePlanner";
import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";
import { RichTextField } from "@/components/portal/RichTextField";
import { slugify } from "@/lib/portal/format";
import type { WizardLinkOption } from "@/lib/portal/data";
import {
  formatExperienceLabel,
  mergeExperienceTypes,
  splitExperienceTypes,
  suggestTripHeroEyebrow,
  TRIP_EXPERIENCE_FILTER_OPTIONS,
  TRIP_EXPERIENCE_PRESET_VALUES,
  TRIP_TIER_FILTER_OPTIONS,
} from "@/lib/trip-labels";
import { buildTripBudgetPayload, formatTripPrice, TRIP_PRICE_INQUIRY_HINT, type TripPricingBasis } from "@/lib/trip-pricing";
import {
  budgetRangeFromPackages,
  DEFAULT_PARTY_COLUMNS,
  defaultPackageLabel,
  emptyPricingPackage,
  emptyPricingPackageRow,
  isCurrentSeasonRow,
  packagesToPriceSeasons,
  priceSeasonsToPackages,
  type PricingPackage,
} from "@/lib/trip-pricing-table";

type QaItem = { question: string; answer: string };
type ItineraryDay = {
  day: number;
  description: string;
  imageId: string;
  title: string;
};
type RouteWaypoint = { label: string; notes: string; place: string };
type Highlight = { alt: string; description: string; imageId: string; title: string };
type OptionalExperience = { description: string; priceNote: string; title: string };

type WizardData = {
  title: string;
  slug: string;
  heroEyebrow: string;
  heroSubtitle: string;
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
  highlights: Highlight[];
  itineraryMode: "inline" | "linked";
  itineraryId: string;
  itineraryDays: ItineraryDay[];
  pricingBasis: TripPricingBasis;
  priceText: string;
  pricingPackages: PricingPackage[];
  included: string[];
  excluded: string[];
  optionalExperiences: OptionalExperience[];
  overview: string;
  faqs: QaItem[];
  discountEnabled: boolean;
  discountLabel: string;
  discountAmount: string;
  mapEmbedUrl: string;
  relatedTripIds: string[];
  notes: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  featured: boolean;
};

const STEPS = [
  { id: 1, label: "Basics", description: "Title & links" },
  { id: 2, label: "Media", description: "Hero & gallery" },
  { id: 3, label: "Itinerary", description: "Day 1, 2, 3…" },
  { id: 4, label: "Route", description: "From → To on map" },
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
    day,
    description: "",
    imageId: "",
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

function routeLabelFromEndpoints(start: string, end: string) {
  const startShort = start.split(",")[0]?.trim();
  const endShort = end.split(",")[0]?.trim();
  if (!startShort || !endShort) return "";
  return `${startShort} to ${endShort}`;
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
    departurePoint: String(doc.departurePoint ?? ""),
    location: String(doc.location ?? ""),
    routeLabel: String(doc.routeLabel ?? ""),
    startLocation: String(doc.startLocation ?? ""),
    endLocation: String(doc.endLocation ?? ""),
    packageId: relationId(doc.package),
    packageTier: String(doc.packageTier ?? "mid-range"),
    experienceTypes: mergeExperienceTypes(doc.experienceTypes, doc.customExperienceTypes),
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
          description: String(item.description ?? ""),
          imageId: relationId(item.image),
        }))
      : [emptyItineraryDay(1)],
    pricingBasis:
      budget.pricingBasis === "per-person-sharing" ? "per-person-sharing" : "per-person",
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
    overview: String(doc.overview ?? ""),
    faqs: parseQaItems(doc.faqs),
    discountEnabled: discount.enabled === true,
    discountLabel: String(discount.label ?? ""),
    discountAmount: String(discount.amountText ?? ""),
    mapEmbedUrl: String(doc.mapEmbedUrl ?? ""),
    relatedTripIds: relationIds(doc.relatedTrips),
    notes: String(doc.notes ?? ""),
    seoTitle: String(seo.title ?? doc.title ?? ""),
    seoDescription: String(seo.description ?? ""),
    seoKeywords: String(seo.keywords ?? ""),
    featured: doc.featured === true,
  };
}

function ExperienceTypesEditor({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [customDraft, setCustomDraft] = useState("");
  const presetValues = new Set<string>(TRIP_EXPERIENCE_PRESET_VALUES);
  const customSelected = selected.filter((value) => !presetValues.has(value));

  function togglePreset(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value],
    );
  }

  function addCustom() {
    const slug = slugify(customDraft);
    if (!slug || selected.includes(slug)) return;
    onChange([...selected, slug]);
    setCustomDraft("");
  }

  return (
    <div className="acc-experience-editor">
      <div className="acc-amenity-suggestions acc-experience-editor__presets">
        {TRIP_EXPERIENCE_FILTER_OPTIONS.filter((option) => option.value !== "__all").map((option) => (
          <button
            className={`acc-amenity-suggest${selected.includes(option.value) ? " is-on" : ""}`}
            key={option.value}
            onClick={() => togglePreset(option.value)}
            type="button"
          >
            {selected.includes(option.value) ? "✓ " : "+ "}{option.label}
          </button>
        ))}
      </div>

      {customSelected.length ? (
        <div className="acc-amenities-list acc-experience-editor__custom">
          {customSelected.map((value) => (
            <span className="acc-amenity-tag acc-amenity-tag--custom" key={value}>
              {formatExperienceLabel(value)}
              <button aria-label={`Remove ${formatExperienceLabel(value)}`} onClick={() => onChange(selected.filter((entry) => entry !== value))} type="button">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="acc-amenity-add acc-experience-editor__add">
        <input
          className="acc-input"
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add custom experience, e.g. Photography Safari"
          type="text"
          value={customDraft}
        />
        <button className="acc-amenity-btn" disabled={!customDraft.trim()} onClick={addCustom} type="button">
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  );
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
  const [expandedIndex, setExpandedIndex] = useState(0);

  function updateItem(index: number, key: keyof QaItem, value: string) {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  }

  function addItem() {
    const next = [...items, { question: "", answer: "" }];
    onChange(next);
    setExpandedIndex(next.length - 1);
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length ? next : [{ question: "", answer: "" }]);
    setExpandedIndex((current) => {
      if (current === index) return Math.max(0, index - 1);
      if (current != null && current > index) return current - 1;
      return current;
    });
  }

  return (
    <div className="acc-field acc-field--accordion">
      <div className="acc-faq-head">
        <label className="acc-label">{title}</label>
        <button className="acc-amenity-btn" onClick={addItem} type="button">
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <div className="acc-accordion-list">
        {items.map((item, index) => {
          const isOpen = expandedIndex === index;
          const summary = item.question.trim() || "New question";
          return (
            <div className={`acc-accordion-item${isOpen ? " is-open" : ""}`} key={index}>
              <div className="acc-accordion-item__head">
                <button
                  aria-expanded={isOpen}
                  className="acc-accordion-item__toggle"
                  onClick={() => setExpandedIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <ChevronRight aria-hidden size={16} />
                  <span className="acc-accordion-item__label">FAQ {index + 1}</span>
                  {!isOpen ? <span className="acc-accordion-item__summary">{summary}</span> : null}
                </button>
                <button
                  aria-label="Remove FAQ"
                  className="acc-accordion-item__remove"
                  onClick={() => removeItem(index)}
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
              {isOpen ? (
                <div className="acc-accordion-item__body">
                  <div className="acc-field">
                    <label className="acc-label">Question</label>
                    <input
                      className="acc-input"
                      onChange={(e) => updateItem(index, "question", e.target.value)}
                      placeholder="e.g. What is included in the price?"
                      type="text"
                      value={item.question}
                    />
                  </div>
                  <div className="acc-field">
                    <label className="acc-label">Answer</label>
                    <textarea
                      className="acc-textarea"
                      onChange={(e) => updateItem(index, "answer", e.target.value)}
                      placeholder="Short, helpful answer for visitors"
                      rows={3}
                      value={item.answer}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
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

  const [step, setStep] = useState(1);
  const [savedTripId, setSavedTripId] = useState(() => (document?.id ? String(document.id) : ""));
  const [data, setData] = useState<WizardData>(() =>
    document
      ? buildFromDoc(document)
      : {
          title: "",
          slug: "",
          heroEyebrow: "",
          heroSubtitle: "",
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
          routeWaypoints: [],
          highlights: [],
          itineraryMode: "inline",
          itineraryId: "",
          itineraryDays: [emptyItineraryDay(1)],
          pricingBasis: "per-person",
          priceText: "",
          pricingPackages: [],
          included: [],
          excluded: [],
          optionalExperiences: [],
          overview: "",
          faqs: [{ question: "", answer: "" }],
          discountEnabled: false,
          discountLabel: "",
          discountAmount: "",
          mapEmbedUrl: "",
          relatedTripIds: [],
          notes: "",
          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
          featured: false,
        },
  );
  const [savingAs, setSavingAs] = useState<"draft" | "published" | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"draft" | "published" | null>(null);
  const [expandedItineraryIndex, setExpandedItineraryIndex] = useState(0);

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

  function addItineraryDay() {
    const nextDay = data.itineraryDays.reduce((max, d) => Math.max(max, d.day), 0) + 1;
    set("itineraryDays", [...data.itineraryDays, emptyItineraryDay(nextDay)]);
    setExpandedItineraryIndex(data.itineraryDays.length);
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
      setExpandedItineraryIndex(0);
      return;
    }
    set("itineraryDays", data.itineraryDays.filter((_, i) => i !== index));
    setExpandedItineraryIndex((current) => {
      if (current === index) return Math.max(0, index - 1);
      if (current > index) return current - 1;
      return current;
    });
  }

  function updateRouteEndpoint(field: "start" | "end", value: string) {
    setData((d) => {
      const startLocation = field === "start" ? value : d.startLocation;
      const endLocation = field === "end" ? value : d.endLocation;
      const autoLabel = routeLabelFromEndpoints(startLocation, endLocation);
      return {
        ...d,
        startLocation,
        endLocation,
        routeLabel: autoLabel || d.routeLabel,
      };
    });
  }

  function validateBeforeSave() {
    if (!data.title.trim()) return "Trip title is required.";
    const nextSlug = (data.slug || slugify(data.title)).trim();
    if (!nextSlug) return "URL slug is required.";
    return "";
  }

  function buildSavePayload(targetStatus: "draft" | "published") {
    const finalSlug = data.slug || slugify(data.title);
    const mapUrl = normalizeMapEmbedUrl(data.mapEmbedUrl);
    const linkedItinerary = itineraries.find((it) => it.value === data.itineraryId);
    const { days, nights } = computeTripDuration(data.itineraryMode, data.itineraryDays, linkedItinerary);
    const budgetRange = budgetRangeFromPackages(data.pricingPackages);
    const budgetPayload = buildTripBudgetPayload({
      currency: "USD",
      max: budgetRange.max,
      min: budgetRange.min,
      pricingBasis: data.pricingBasis,
    });

    const experienceSplit = splitExperienceTypes(data.experienceTypes);

    const payload: Record<string, unknown> = {
      title: data.title.trim(),
      slug: finalSlug,
      heroEyebrow: data.heroEyebrow.trim(),
      heroSubtitle: data.heroSubtitle.trim(),
      departurePoint: data.departurePoint.trim(),
      heroVideoUrl: data.heroVideoUrl.trim(),
      days: days || undefined,
      nights: nights || undefined,
      location: data.location.trim(),
      startLocation: data.startLocation.trim(),
      endLocation: data.endLocation.trim(),
      routeLabel: data.routeLabel.trim() || routeLabelFromEndpoints(data.startLocation, data.endLocation),
      packageTier: data.packageTier,
      experienceTypes: experienceSplit.preset,
      customExperienceTypes: experienceSplit.custom.length ? JSON.stringify(experienceSplit.custom) : "",
      availability: data.availability,
      overview: data.overview.trim(),
      mapEmbedUrl: mapUrl,
      notes: data.notes.trim(),
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
      included: data.included.map((item) => ({ item })),
      excluded: data.excluded.map((item) => ({ item })),
    };

    const optionalExperiences = data.optionalExperiences
      .filter((item) => item.title.trim())
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        priceNote: item.priceNote.trim(),
      }));
    if (optionalExperiences.length) payload.optionalExperiences = optionalExperiences;

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
        .map((d, index) => ({
          day: index + 1,
          title: d.title.trim(),
          description: d.description.trim(),
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

    return payload;
  }

  async function persistDraft(options: {
    redirect?: boolean;
    status?: "draft" | "published";
  } = {}): Promise<boolean> {
    const { redirect = false, status = "draft" } = options;
    const validationMessage = validateBeforeSave();
    if (validationMessage) {
      if (redirect) {
        setError(validationMessage);
        setSuccess(null);
      }
      return false;
    }

    if (redirect) {
      setSavingAs(status);
      setError("");
      setSuccess(null);
    } else {
      setAutosaving(true);
      setError("");
    }

    const payload = buildSavePayload(status);
    const body: Record<string, unknown> = { collection: "trips", data: payload };
    if (savedTripId) body.id = savedTripId;

    try {
      const res = await fetch("/api/portal/records", {
        body: JSON.stringify(body),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError((json as Record<string, string>).message ?? "Failed to save. Please try again.");
        return false;
      }

      const json = (await res.json()) as { result?: { id?: string | number } };
      const newId = json.result?.id;
      if (newId != null && !savedTripId) {
        const id = String(newId);
        setSavedTripId(id);
        window.history.replaceState(null, "", `/admin/trips/${id}`);
      }

      setDraftSaved(true);

      if (redirect) {
        setSuccess(status);
        setTimeout(() => {
          router.push("/admin/trips");
          router.refresh();
        }, 1800);
      }

      return true;
    } finally {
      setSavingAs(null);
      setAutosaving(false);
    }
  }

  async function save(targetStatus: "draft" | "published") {
    await persistDraft({ redirect: true, status: targetStatus });
  }

  async function goToStep(nextStep: number) {
    if (nextStep !== step && data.title.trim()) {
      await persistDraft();
    }
    setStep(nextStep);
  }

  async function handleNextStep() {
    if (!stepValid[step]) return;
    await goToStep(step + 1);
  }

  const mapPreviewUrl = normalizeMapEmbedUrl(data.mapEmbedUrl);
  const relatedTripOptions = trips.filter((t) => t.value !== savedTripId);
  const linkedItinerary = itineraries.find((it) => it.value === data.itineraryId);
  const tripDuration = computeTripDuration(data.itineraryMode, data.itineraryDays, linkedItinerary);
  const pricingBudget = useMemo(() => budgetRangeFromPackages(data.pricingPackages), [data.pricingPackages]);

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
            onClick={() => step > s.id && void goToStep(s.id)}
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

            <div className="acc-basics-grid">
              <div className="acc-field acc-basics-grid__title">
                <label className="acc-label" htmlFor="trip-title">Trip Title <span className="acc-req">*</span></label>
                <input className="acc-input" id="trip-title" onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. 3 Days Masai Mara Fly-In Safari Package" type="text" value={data.title} />
              </div>

              <div className="acc-field acc-basics-grid__slug">
                <label className="acc-label" htmlFor="trip-slug">URL Slug <span className="acc-req">*</span></label>
                <div className="acc-slug-wrap">
                  <span className="acc-slug-prefix">/trips/</span>
                  <input className="acc-input acc-input--slug" id="trip-slug" onChange={(e) => set("slug", slugify(e.target.value))} placeholder="3-days-masai-mara-fly-in-safari" type="text" value={data.slug} />
                </div>
              </div>

              <div className="acc-basics-grid__filters">
                <div className="acc-field">
                  <label className="acc-label" htmlFor="trip-tier">Listing Tier Badge</label>
                  <select className="acc-select" id="trip-tier" onChange={(e) => set("packageTier", e.target.value)} value={data.packageTier}>
                    {TRIP_TIER_FILTER_OPTIONS.filter((option) => option.value !== "__all").map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <span className="acc-hint">
                    Shown on trip cards as Budget, Mid Range, Luxury, or High End Safari. Experience types are for filters only.
                  </span>
                </div>
                <div className="acc-field">
                  <label className="acc-label">Experience Types</label>
                  <ExperienceTypesEditor
                    onChange={(values) => set("experienceTypes", values)}
                    selected={data.experienceTypes}
                  />
                </div>
              </div>

              <div className="acc-field acc-basics-grid__hero">
                <label className="acc-label" htmlFor="trip-eyebrow">Hero Category Line</label>
                <div className="acc-inline-actions">
                  <input className="acc-input" id="trip-eyebrow" onChange={(e) => set("heroEyebrow", e.target.value)} placeholder="Small label above the title, e.g. Luxury Fly-In Safari" type="text" value={data.heroEyebrow} />
                  <button
                    className="acc-amenity-btn"
                    onClick={() => set("heroEyebrow", suggestTripHeroEyebrow({
                      experienceTypes: data.experienceTypes,
                      packageTier: data.packageTier,
                    }))}
                    type="button"
                  >
                    Suggest
                  </button>
                </div>
              </div>

              <div className="acc-field acc-basics-grid__location">
                <label className="acc-label" htmlFor="trip-location">Primary Destination</label>
                <input className="acc-input" id="trip-location" onChange={(e) => set("location", e.target.value)} placeholder="e.g. Masai Mara, Kenya" type="text" value={data.location} />
              </div>

              <div className="acc-field acc-basics-grid__departure">
                <label className="acc-label" htmlFor="trip-departure">Departure / Flight Point</label>
                <input className="acc-input" id="trip-departure" onChange={(e) => set("departurePoint", e.target.value)} placeholder="e.g. Wilson Airport" type="text" value={data.departurePoint} />
              </div>

              <div className="acc-field acc-basics-grid__package">
                <label className="acc-label" htmlFor="trip-package">Safari Package (catalog)</label>
                <select
                  className="acc-select"
                  id="trip-package"
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const linked = packages.find((pkg) => pkg.value === nextId);
                    setData((current) => ({
                      ...current,
                      packageId: nextId,
                      packageTier: linked?.packageTier || current.packageTier,
                      destinationIds: linked?.destinationIds?.length
                        ? [...new Set([...current.destinationIds, ...linked.destinationIds])]
                        : current.destinationIds,
                    }));
                  }}
                  value={data.packageId}
                >
                  <option value="">Standalone trip — no catalog package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.value} value={pkg.value}>{pkg.label}{pkg.meta ? ` — ${pkg.meta}` : ""}</option>
                  ))}
                </select>
                {data.packageId ? (
                  <a className="acc-inline-link" href={packages.find((p) => p.value === data.packageId)?.href} rel="noreferrer" target="_blank">
                    Preview catalog package <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>

              <div className="acc-field acc-basics-grid__destinations">
                <label className="acc-label">Destinations Visited</label>
                <MultiSelectDropdown
                  addLabel="Add destination…"
                  emptyLabel="No destinations selected."
                  onChange={(ids) => set("destinationIds", ids)}
                  options={destinations}
                  selectedIds={data.destinationIds}
                />
              </div>
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
            <p className="acc-wizard__sub">Day-by-day plan. Length is calculated from the number of days you add.</p>

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
                <div className="acc-accordion-list">
                  {data.itineraryDays.map((day, index) => {
                    const isOpen = expandedItineraryIndex === index;
                    const summary = day.title.trim() || "Untitled day";
                    return (
                      <div className={`acc-accordion-item acc-itinerary-day${isOpen ? " is-open" : ""}`} key={index}>
                        <div className="acc-accordion-item__head">
                          <button
                            aria-expanded={isOpen}
                            className="acc-accordion-item__toggle"
                            onClick={() => setExpandedItineraryIndex(isOpen ? -1 : index)}
                            type="button"
                          >
                            <ChevronRight aria-hidden size={16} />
                            <span className="acc-accordion-item__label">Day {index + 1}</span>
                            {!isOpen ? <span className="acc-accordion-item__summary">{summary}</span> : null}
                          </button>
                          <button
                            aria-label="Remove day"
                            className="acc-accordion-item__remove"
                            onClick={() => removeItineraryDay(index)}
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {isOpen ? (
                          <div className="acc-accordion-item__body">
                            <div className="acc-field">
                              <label className="acc-label">Title <span className="acc-req">*</span></label>
                              <input
                                className="acc-input"
                                onChange={(e) => updateItineraryDay(index, { day: index + 1, title: e.target.value })}
                                placeholder="Arrival & afternoon game drive"
                                type="text"
                                value={day.title}
                              />
                            </div>
                            <div className="acc-field">
                              <label className="acc-label">Description <span className="acc-req">*</span></label>
                              <textarea
                                className="acc-textarea"
                                onChange={(e) => updateItineraryDay(index, { description: e.target.value })}
                                placeholder="What happens on this day?"
                                rows={4}
                                value={day.description}
                              />
                            </div>
                            <MediaPickerField
                              hasMany={false}
                              initialValues={day.imageId ? [day.imageId] : []}
                              label="Day Image (optional)"
                              onChange={(ids) => updateItineraryDay(index, { imageId: ids[0] ?? "" })}
                              options={media}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Route & Map</h2>
            <p className="acc-wizard__sub">
              Choose where the trip starts and ends. The map draws the driving route automatically — like navigating from point A to point B.
            </p>

            <TripRoutePlanner
              endLocation={data.endLocation}
              onEndChange={(value) => updateRouteEndpoint("end", value)}
              onStartChange={(value) => updateRouteEndpoint("start", value)}
              startLocation={data.startLocation}
            />

            {data.startLocation.trim() && data.endLocation.trim() ? (
              <p className="acc-hint" style={{ marginTop: 12 }}>
                Route label on the public page:{" "}
                <strong>{data.routeLabel || routeLabelFromEndpoints(data.startLocation, data.endLocation)}</strong>
              </p>
            ) : null}
          </div>
        )}

        {step === 5 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Pricing & Inclusions</h2>
            <p className="acc-wizard__sub">
              Add seasonal pricing tables, then list what is included and excluded on this trip. All amounts are in USD.
            </p>

            <div className="acc-field acc-field--compact">
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
              <div className="acc-faq-head">
                <label className="acc-label">Accommodation Price Tables</label>
                <button
                  className="acc-amenity-btn"
                  onClick={() => set("pricingPackages", [...data.pricingPackages, emptyPricingPackage(data.packageTier || "luxury")])}
                  type="button"
                >
                  <Plus size={14} /> Add price table
                </button>
              </div>
              <span className="acc-hint">
                Each table is one accommodation level on this trip page (e.g. Budget camps vs Luxury lodges) — not a Safari Package catalog entry.
                Add season date ranges (e.g. &quot;June to August&quot;) so the public price line follows the current season.
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
                                currency: "USD",
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
                          <label className="acc-label">Accommodation Style</label>
                          <input
                            className="acc-input"
                            onChange={(e) => {
                              const next = [...data.pricingPackages];
                              next[pkgIndex] = { ...next[pkgIndex], packageLabel: e.target.value };
                              set("pricingPackages", next);
                            }}
                            placeholder="e.g. Luxury lodges"
                            type="text"
                            value={pkg.packageLabel}
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
                            {DEFAULT_PARTY_COLUMNS.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                            <th aria-label="Actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {pkg.rows.map((row, rowIndex) => (
                            <tr
                              className={isCurrentSeasonRow(row) ? "is-current-season" : undefined}
                              key={`${pkg.id}-${rowIndex}`}
                            >
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
                              {DEFAULT_PARTY_COLUMNS.map((column) => (
                                <td key={column}>
                                  <div className="acc-money-input">
                                    <span className="acc-money-input__currency">USD</span>
                                    <input
                                      className="acc-input acc-money-input__field"
                                      min="0"
                                      onChange={(e) => {
                                        const next = [...data.pricingPackages];
                                        const rows = [...next[pkgIndex].rows];
                                        rows[rowIndex] = {
                                          ...rows[rowIndex],
                                          prices: { ...rows[rowIndex].prices, [column]: e.target.value },
                                        };
                                        next[pkgIndex] = { ...next[pkgIndex], rows, currency: "USD" };
                                        set("pricingPackages", next);
                                      }}
                                      placeholder="0"
                                      type="number"
                                      value={row.prices[column] || ""}
                                    />
                                  </div>
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
                          currency: "USD",
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

            <div className="acc-field acc-pricing-summary">
              {pricingBudget.min !== undefined ? (
                <>
                  <p className="acc-pricing-summary__line">
                    {formatTripPrice({
                      currency: "USD",
                      max: pricingBudget.max,
                      min: pricingBudget.min,
                      pricingBasis: data.pricingBasis,
                    })}
                  </p>
                  <p className="acc-hint">
                    {pricingBudget.usesSeason && pricingBudget.seasonLabel ? (
                      <>
                        Based on the current season ({pricingBudget.seasonLabel}) — USD {pricingBudget.min.toLocaleString("en-US")} (lowest tier) to USD {pricingBudget.max?.toLocaleString("en-US")} (highest tier).
                      </>
                    ) : (
                      <>
                        Auto-calculated from pricing tables — USD {pricingBudget.min.toLocaleString("en-US")} (lowest tier) to USD {pricingBudget.max?.toLocaleString("en-US")} (highest tier). Use season labels like Jan–Mar for automatic seasonal pricing.
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="acc-pricing-summary__line acc-pricing-summary__line--quote">{TRIP_PRICE_INQUIRY_HINT}</p>
              )}
            </div>

            <div className="acc-inclusions-row">
              <TagListEditor items={data.included} onChange={(items) => set("included", items)} placeholder="e.g. Park fees, domestic flights…" title="Included" />
              <TagListEditor items={data.excluded} onChange={(items) => set("excluded", items)} placeholder="e.g. International flights, visa fees…" title="Excluded" />
            </div>

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
              Write the trip overview, key highlights, and visitor FAQs for the public trip page.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="trip-overview">Trip Content</label>
              <span className="acc-hint">
                Write the full trip description here. Use heading styles (H2, H3) in the editor for subsections such as &quot;Day-by-day highlights&quot; or &quot;What to expect&quot; — do not add separate summary fields for those.
              </span>
              <RichTextField
                defaultValue={data.overview}
                key={savedTripId || "new-trip"}
                media={media}
                name="overview"
                onChange={(value) => set("overview", value)}
              />
            </div>

            <div className="acc-field">
              <div className="acc-faq-head">
                <label className="acc-label">Trip Highlights</label>
                <button className="acc-amenity-btn" onClick={() => set("highlights", [...data.highlights, { title: "", description: "", imageId: "", alt: "" }])} type="button"><Plus size={14} /> Add Highlight</button>
              </div>
              <span className="acc-hint">One bullet per highlight. Title is required; an optional detail line can expand on it.</span>
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

            <QaEditor addLabel="Add FAQ" items={data.faqs} onChange={(items) => set("faqs", items)} title="Frequently Asked Questions" />
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
              <div className="acc-review__row"><span className="acc-review__label">Catalog package</span><span className="acc-review__value">{packages.find((p) => p.value === data.packageId)?.label ?? <em>Standalone trip</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Price tables</span><span className="acc-review__value">{data.pricingPackages.length || <em>None</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Destinations</span><span className="acc-review__value">{data.destinationIds.length || <em>None</em>}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Itinerary</span><span className="acc-review__value">{data.itineraryMode === "linked" ? (itineraries.find((i) => i.value === data.itineraryId)?.label ?? <em>Not linked</em>) : `${data.itineraryDays.filter((d) => d.title.trim()).length} day(s)`}</span></div>
              <div className="acc-review__row"><span className="acc-review__label">Budget</span><span className="acc-review__value">{formatTripPrice({ currency: "USD", max: pricingBudget.max, min: pricingBudget.min, pricingBasis: data.pricingBasis })}</span></div>
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

      {error ? (
        <div className="acc-wizard__error">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <div className="acc-wizard__nav">
        <button className="acc-btn acc-btn--ghost" disabled={step === 1 || autosaving} onClick={() => void goToStep(step - 1)} type="button">
          <ChevronLeft size={16} /> Back
        </button>
        <span className="acc-wizard__step-label">
          Step {step} of {STEPS.length}
          {autosaving ? <span className="acc-wizard__autosave"> · Saving draft…</span> : null}
          {!autosaving && draftSaved ? <span className="acc-wizard__autosave acc-wizard__autosave--saved"> · Draft saved</span> : null}
        </span>
        {step < STEPS.length ? (
          <button className="acc-btn acc-btn--primary" disabled={!stepValid[step] || autosaving || savingAs !== null} onClick={() => void handleNextStep()} type="button">
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
