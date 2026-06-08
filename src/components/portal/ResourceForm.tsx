"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Save, Send, X } from "lucide-react";

import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";
import { RichTextField } from "@/components/portal/RichTextField";
import { getValue, slugify } from "@/lib/portal/format";
import type { PortalField } from "@/lib/portal/modules";
import { getYouTubeVideoId } from "@/lib/youtube";

type LatLngLiteral = { lat: number; lng: number };
type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};
type LeafletLatLng = { lat: number; lng: number };
type LeafletMarker = {
  getLatLng: () => LeafletLatLng;
  on: (event: "dragend", callback: () => void) => void;
  setLatLng: (position: LeafletLatLng) => void;
};
type LeafletMap = {
  on: (event: "click", callback: (event: { latlng: LeafletLatLng }) => void) => void;
  setView: (center: [number, number], zoom: number) => LeafletMap;
};
type LeafletApi = {
  map: (element: HTMLElement | null) => LeafletMap;
  marker: (center: [number, number], options: { draggable: boolean }) => LeafletMarker & {
    addTo: (map: LeafletMap) => LeafletMarker;
  };
  tileLayer: (url: string, options: { attribution: string }) => { addTo: (map: LeafletMap) => void };
};
type PortalWindow = Window &
  typeof globalThis & {
    google?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: {
            center: LatLngLiteral;
            mapTypeControl?: boolean;
            streetViewControl?: boolean;
            zoom: number;
          },
        ) => {
          addListener: (event: "click", callback: (event: { latLng?: GoogleLatLng }) => void) => void;
        };
        Marker: new (
          options: { draggable?: boolean; map: unknown; position: LatLngLiteral },
        ) => {
          addListener: (event: "dragend", callback: () => void) => void;
          getPosition: () => GoogleLatLng | undefined;
          setPosition: (position: GoogleLatLng) => void;
        };
      };
    };
    L?: LeafletApi;
  };

/* ─── Nested-key setter ──────────────────────────────────────── */
function setNested(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    cursor[part] = cursor[part] && typeof cursor[part] === "object" ? cursor[part] : {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

/* ─── Value formatters ──────────────────────────────────────── */
function formatTextareaValue(fieldName: string, value: unknown) {
  if (typeof value === "string") return value;
  if ((fieldName === "daysJson" || fieldName === "itineraryDaysJson") && Array.isArray(value)) {
    return value
      .map((day) => {
        if (!day || typeof day !== "object") return "";
        const r = day as Record<string, unknown>;
        return [
          r.title ? String(r.title) : "",
          r.location ? `Location: ${r.location}` : "",
          r.meals ? `Meals: ${r.meals}` : "",
          r.accommodation ? `Accommodation: ${r.accommodation}` : "",
          r.description ? String(r.description) : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function formatListValue(value: unknown, itemName = "item") {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      const r = item as Record<string, unknown>;
      return String(r[itemName] ?? r.alt ?? r.title ?? r.name ?? "");
    })
    .filter(Boolean)
    .join("\n");
}

function formatQaValue(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const r = item as Record<string, unknown>;
      return [r.question, r.answer].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

/* ─── Parsers ───────────────────────────────────────────────── */
function parseList(value: string, itemName = "item") {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ [itemName]: s }));
}

function parseQaList(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const [question = "", ...rest] = e.split(/\r?\n/);
      return { question: question.replace(/^#+\s*/, "").trim(), answer: rest.join("\n").trim() };
    })
    .filter((i) => i.question && i.answer);
}

function relationInputValue(value: unknown) {
  if (value && typeof value === "object" && "id" in value)
    return String((value as { id?: string | number }).id);
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function relationInputValues(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(relationInputValue).filter(Boolean);
}

function payloadRelationshipId(value: unknown) {
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return value;
}

function getFormFieldValue(document: Record<string, unknown>, fieldName: string) {
  if (fieldName === "galleryImages") {
    const gallery = getValue(document, "gallery");
    if (!Array.isArray(gallery)) return [];
    return gallery.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>).image : undefined
    );
  }
  if (fieldName === "galleryAltText") return getValue(document, "gallery");
  if (fieldName === "galleryCaptions") return getValue(document, "gallery");
  if (fieldName === "includedItems") return getValue(document, "included");
  if (fieldName === "excludedItems") return getValue(document, "excluded");
  if (fieldName === "itineraryDaysJson") return getValue(document, "itineraryDays");
  if (fieldName === "faqsJson") return getValue(document, "faqs");
  if (fieldName === "directAnswersJson") return getValue(document, "directAnswers");
  return getValue(document, fieldName);
}

/* ─── Section grouping ──────────────────────────────────────── */
type FieldSection = {
  id: string;
  label: string;
  fields: PortalField[];
};

const MEDIA_NAMES = new Set([
  "heroImage", "image", "images", "imageCaption", "galleryImages", "galleryAltText", "galleryCaptions",
  "openGraphImage", "coverImage", "gallery", "backgroundVideoUrl", "slideIntervalSeconds",
]);

const CONTENT_NAMES = new Set([
  "summary", "excerpt", "content", "body", "overview", "description",
  "notes", "internalNotes", "message", "comments", "availabilityNote",
  "faqsJson", "directAnswersJson", "itineraryDaysJson", "daysJson",
  "includedItems", "excludedItems",
]);

const DATE_NAMES = new Set([
  "startDate", "endDate", "travelDays", "travelStartDate", "travelEndDate",
  "tourStartDate", "flexibleDates",
  "budget.currency", "budget.min", "budget.max", "budget.displayText", "budgetText",
  "budgetRange", "budgetPerPerson", "travellers", "adults", "children", "infants",
  "discount.enabled", "discount.label", "discount.amountText",
]);

const SEO_PREFIXES = ["seo.", "metaTitle", "metaDescription", "canonicalSlug", "canonicalUrl"];
const LOCATION_NAMES = new Set(["mapEmbedUrl", "latitude", "longitude"]);

function pickFieldsByName(fields: PortalField[], names: string[]) {
  return names
    .map((name) => fields.find((field) => field.name === name))
    .filter((field): field is PortalField => Boolean(field));
}

function groupDestinationFields(fields: PortalField[]): FieldSection[] {
  const orderedSections: Array<{ id: string; label: string; names: string[] }> = [
    {
      id: "destination-details",
      label: "Destination Details",
      names: ["name", "summary", "content", "faqsJson"],
    },
    {
      id: "gallery",
      label: "Media Gallery",
      names: ["galleryImages"],
    },
    {
      id: "publishing",
      label: "Publishing",
      names: ["country", "region"],
    },
    {
      id: "featured-image",
      label: "Featured Image",
      names: ["heroImage"],
    },
    {
      id: "map-location",
      label: "Map & Location",
      names: ["mapEmbedUrl", "latitude", "longitude"],
    },
    {
      id: "seo",
      label: "SEO & Metadata",
      names: ["seo.description", "seo.keywords", "seo.canonicalSlug"],
    },
  ];

  const used = new Set<string>();
  // Mark special-handled fields as used to avoid showing up as leftovers
  used.add("slug");
  used.add("seo.title");
  used.add("status");
  used.add("directAnswersJson");
  used.add("galleryAltText");
  used.add("galleryCaptions");

  const sections: FieldSection[] = orderedSections
    .map((section) => {
      const sectionFields = pickFieldsByName(fields, section.names);
      sectionFields.forEach((field) => used.add(field.name));
      return {
        id: section.id,
        label: section.label,
        fields: sectionFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  const leftovers = fields.filter((field) => !used.has(field.name));
  if (leftovers.length) {
    sections.push({ id: "additional", label: "Additional Details", fields: leftovers });
  }

  return sections.length ? sections : [{ id: "all", label: "Details", fields }];
}

function groupHomepageSlideFields(fields: PortalField[]): FieldSection[] {
  const orderedSections: Array<{ id: string; label: string; names: string[] }> = [
    {
      id: "general",
      label: "General Info",
      names: ["title", "destinationFocus", "ctaLabel", "ctaHref", "sortOrder", "status"],
    },
    {
      id: "content",
      label: "Content & Details",
      names: ["description"],
    },
    {
      id: "media",
      label: "Hero Media",
      names: ["images", "slideIntervalSeconds", "backgroundVideoUrl"],
    },
  ];

  const used = new Set<string>();
  const sections = orderedSections
    .map((section) => {
      const sectionFields = pickFieldsByName(fields, section.names);
      sectionFields.forEach((field) => used.add(field.name));
      return {
        id: section.id,
        label: section.label,
        fields: sectionFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  const leftovers = fields.filter((field) => !used.has(field.name));
  if (leftovers.length) {
    sections.push({ id: "additional", label: "Additional Details", fields: leftovers });
  }

  return sections.length ? sections : [{ id: "all", label: "Details", fields }];
}

function groupGalleryFields(fields: PortalField[]): FieldSection[] {
  const orderedSections: Array<{ id: string; label: string; names: string[] }> = [
    {
      id: "general",
      label: "General Info",
      names: ["title", "category", "alt", "featured", "sortOrder", "status"],
    },
    {
      id: "media",
      label: "Photos",
      names: ["images"],
    },
  ];

  const used = new Set<string>();
  const sections = orderedSections
    .map((section) => {
      const sectionFields = pickFieldsByName(fields, section.names);
      sectionFields.forEach((field) => used.add(field.name));
      return {
        id: section.id,
        label: section.label,
        fields: sectionFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  const leftovers = fields.filter((field) => !used.has(field.name));
  if (leftovers.length) {
    sections.push({ id: "additional", label: "Additional Details", fields: leftovers });
  }

  return sections.length ? sections : [{ id: "all", label: "Details", fields }];
}

function groupFields(fields: PortalField[], moduleSlug?: string): FieldSection[] {
  if (moduleSlug === "destinations") {
    return groupDestinationFields(fields);
  }
  if (moduleSlug === "homepage-slides") {
    return groupHomepageSlideFields(fields);
  }
  if (moduleSlug === "gallery") {
    return groupGalleryFields(fields);
  }

  const general: PortalField[] = [];
  const dates: PortalField[] = [];
  const content: PortalField[] = [];
  const media: PortalField[] = [];
  const location: PortalField[] = [];
  const seo: PortalField[] = [];

  for (const field of fields) {
    const n = field.name;
    const isSeo = SEO_PREFIXES.some((p) => n.startsWith(p)) || n === "keywords";
    if (isSeo) { seo.push(field); continue; }
    if (LOCATION_NAMES.has(n)) { location.push(field); continue; }
    if (MEDIA_NAMES.has(n)) { media.push(field); continue; }
    if (CONTENT_NAMES.has(n)) { content.push(field); continue; }
    if (DATE_NAMES.has(n)) { dates.push(field); continue; }
    general.push(field);
  }

  const sections: FieldSection[] = [];
  if (general.length) sections.push({ id: "general", label: "General Info", fields: general });
  if (dates.length) sections.push({ id: "dates", label: "Dates & Budget", fields: dates });
  if (content.length) sections.push({ id: "content", label: "Content & Details", fields: content });
  if (media.length) sections.push({ id: "media", label: "Media", fields: media });
  if (location.length) sections.push({ id: "location", label: "Map & Location", fields: location });
  if (seo.length) sections.push({ id: "seo", label: "SEO & Metadata", fields: seo });

  // If only 1 section or no natural grouping, flatten to single section
  if (sections.length <= 1) {
    return [{ id: "all", label: "Details", fields }];
  }
  return sections;
}

function splitSectionsForLayout(sections: FieldSection[], moduleSlug?: string) {
  const sidebarIds =
    moduleSlug === "destinations"
      ? new Set(["publishing", "featured-image", "seo"])
      : new Set(["publishing", "seo"]);
  const side = sections.filter((section) => sidebarIds.has(section.id));
  const main = sections.filter((section) => !sidebarIds.has(section.id));

  if (side.length === 0 && main.length > 2) {
    return {
      main: main.slice(0, Math.ceil(main.length * 0.65)),
      side: main.slice(Math.ceil(main.length * 0.65)),
    };
  }

  return { main, side };
}

/* ─── QA List Builder ───────────────────────────────────────────── */
function QaListField({
  field,
  initialValue,
}: {
  field: PortalField;
  initialValue: string;
}) {
  const initialItems = parseQaList(initialValue);
  const [items, setItems] = useState<{ question: string; answer: string }[]>(
    initialItems.length ? initialItems : [{ question: "", answer: "" }]
  );

  const addItem = () => setItems([...items, { question: "", answer: "" }]);

  const removeItem = (idx: number) => {
    if (items.length === 1) return setItems([{ question: "", answer: "" }]);
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, key: "question" | "answer", val: string) => {
    const newItems = [...items];
    newItems[idx][key] = val;
    setItems(newItems);
  };

  // Convert the items back to the text format expected by the parser
  const serializedValue = items
    .filter((i) => i.question.trim() || i.answer.trim())
    .map((i) => `${i.question.trim()}\n${i.answer.trim()}`)
    .join("\n\n");

  return (
    <div className="portal-field is-wide" style={{ marginBottom: "1rem", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--p-ink)", textTransform: "uppercase" }}>{field.label}</span>
        <button
          type="button"
          onClick={addItem}
          style={{ background: "var(--p-green-800)", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
        >
          + Add Q&A
        </button>
      </div>
      <small style={{ display: "block", marginBottom: 12 }}>Build your FAQ section interactively.</small>

      <input type="hidden" name={field.name} value={serializedValue} />

      <div style={{ display: "grid", gap: "16px" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ background: "var(--p-surface-2)", border: "1px solid var(--p-line)", borderRadius: "8px", padding: "12px", position: "relative" }}>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              style={{ position: "absolute", top: 8, right: 8, background: "transparent", border: "none", color: "var(--p-muted)", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
            <div style={{ marginBottom: "8px", paddingRight: "24px" }}>
              <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--p-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Question</span>
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateItem(idx, "question", e.target.value)}
                placeholder="e.g. When is the best time to visit?"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--p-line)", borderRadius: "4px", fontSize: "14px" }}
              />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--p-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Answer</span>
              <textarea
                value={item.answer}
                onChange={(e) => updateItem(idx, "answer", e.target.value)}
                placeholder="Provide a clear and helpful answer..."
                rows={3}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--p-line)", borderRadius: "4px", fontSize: "14px", resize: "vertical" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Map Selector ──────────────────────────────────────────────── */

function LocationPickerField({
  initialLat,
  initialLng,
  latFieldName,
  lngFieldName,
}: {
  initialLat: string;
  initialLng: string;
  latFieldName: string;
  lngFieldName: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [lat, setLat] = useState(initialLat || "");
  const [lng, setLng] = useState(initialLng || "");

  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const win = window as PortalWindow;

    if (apiKey) {
      // Load Google Maps dynamically
      // Check if google maps script is already loaded
      if (win.google && win.google.maps) {
        initGoogleMap();
      } else {
        const existingScript = document.getElementById("google-maps-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          script.onload = () => {
            initGoogleMap();
          };
          document.head.appendChild(script);
        } else {
          // Script is loading, check periodically
          const interval = setInterval(() => {
            if (win.google && win.google.maps) {
              clearInterval(interval);
              initGoogleMap();
            }
          }, 100);
        }
      }
    } else {
      // Fallback: Load Leaflet dynamically
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        const L = win.L;
        if (!L) return;
        const initialCenter: [number, number] = [
          parseFloat(initialLat) || -1.2921,
          parseFloat(initialLng) || 36.8219,
        ];
        const map = L.map(mapRef.current).setView(initialCenter, 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker(initialCenter, { draggable: true }).addTo(map);

        marker.on('dragend', function () {
          const position = marker.getLatLng();
          setLat(position.lat.toFixed(6));
          setLng(position.lng.toFixed(6));
        });

        map.on('click', function (e) {
          marker.setLatLng(e.latlng);
          setLat(e.latlng.lat.toFixed(6));
          setLng(e.latlng.lng.toFixed(6));
        });
      };
      document.head.appendChild(script);
    }

    function initGoogleMap() {
      const google = win.google;
      if (!google || !mapRef.current) return;
      const initialCenter = { lat: parseFloat(initialLat) || -1.2921, lng: parseFloat(initialLng) || 36.8219 };
      const map = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 6,
        mapTypeControl: true,
        streetViewControl: false,
      });
      const marker = new google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true,
      });

      marker.addListener('dragend', function () {
        const position = marker.getPosition();
        if (position) {
          setLat(position.lat().toFixed(6));
          setLng(position.lng().toFixed(6));
        }
      });

      map.addListener('click', function (e) {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          setLat(e.latLng.lat().toFixed(6));
          setLng(e.latLng.lng().toFixed(6));
        }
      });
    }

    return () => {
      // Cleanup
    };
  }, [initialLat, initialLng]);

  return (
    <div className="portal-field is-wide" style={{ marginBottom: "1rem", width: "100%" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <label className="portal-field" style={{ flex: 1 }}>
          <span style={{ textTransform: "uppercase" }}>Latitude</span>
          <input type="text" name={latFieldName} value={lat} onChange={(e) => setLat(e.target.value)} />
        </label>
        <label className="portal-field" style={{ flex: 1 }}>
          <span style={{ textTransform: "uppercase" }}>Longitude</span>
          <input type="text" name={lngFieldName} value={lng} onChange={(e) => setLng(e.target.value)} />
        </label>
      </div>
      <div ref={mapRef} style={{ height: "350px", borderRadius: "8px", zIndex: 0, marginTop: "10px" }} />
      <p style={{ fontSize: "12px", color: "var(--p-muted)", marginTop: "6px", textTransform: "none", fontWeight: "normal", letterSpacing: "normal" }}>
        Click on the map or drag the marker to set coordinates.
      </p>
    </div>
  );
}

/* ─── Field renderer ────────────────────────────────────────── */
function renderField(
  field: PortalField,
  document: Record<string, unknown>,
  mediaOptions: PortalMediaOption[],
  relationOptions: Record<string, Array<{ label: string; value: string }>>,
  slugState?: {
    slug: string;
    setSlug: (s: string) => void;
    isEditingSlug: boolean;
    setIsEditingSlug: (b: boolean) => void;
    isSlugEdited: boolean;
    setIsSlugEdited: (b: boolean) => void;
  }
) {
  const rawValue =
    field.name === "daysJson"
      ? getValue(document, "days")
      : getFormFieldValue(document, field.name);

  const inputValue =
    rawValue && typeof rawValue === "object" && "id" in rawValue
      ? String((rawValue as { id?: string | number }).id)
      : typeof rawValue === "string" || typeof rawValue === "number"
        ? String(rawValue)
        : "";

  if (field.name === "name") {
    return (
      <div className="portal-field is-wide" key={field.name}>
        <span>{field.label}</span>
        <input
          defaultValue={inputValue}
          name={field.name}
          type={field.type}
          onChange={(e) => {
            if (slugState && !slugState.isSlugEdited) {
              slugState.setSlug(slugify(e.target.value));
            }
          }}
        />
        {slugState && (
          <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--p-muted)", display: "flex", alignItems: "center", gap: "6px", textTransform: "none", letterSpacing: "normal" }}>
            <span style={{ fontWeight: "600", color: "var(--p-muted)" }}>Permalink:</span>
            <span style={{ color: "var(--p-muted)" }}>
              https://naturerompsafaris.com/destinations/
            </span>
            {slugState.isEditingSlug ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="text"
                  value={slugState.slug}
                  onChange={(e) => {
                    slugState.setSlug(slugify(e.target.value));
                    slugState.setIsSlugEdited(true);
                  }}
                  onBlur={() => slugState.setIsEditingSlug(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      slugState.setIsEditingSlug(false);
                    }
                  }}
                  autoFocus
                  style={{
                    padding: "2px 6px",
                    fontSize: "13px",
                    border: "1px solid var(--p-line)",
                    borderRadius: "4px",
                    background: "var(--p-surface-2)",
                    color: "var(--p-ink)",
                    width: "180px",
                    display: "inline-block",
                    height: "26px",
                    minHeight: "26px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => slugState.setIsEditingSlug(false)}
                  style={{
                    background: "var(--p-green-800)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "white",
                    height: "26px",
                    fontWeight: "600",
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "600", color: "var(--p-green-700)" }}>{slugState.slug || "(auto-generated)"}</span>
                <input type="hidden" name="slug" value={slugState.slug} />
                <button
                  type="button"
                  onClick={() => slugState.setIsEditingSlug(true)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--p-line)",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "var(--p-ink)",
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "content") {
    return (
      <label className="portal-field is-wide" key={field.name}>
        <span>{field.label} {field.required && <span style={{ color: "var(--p-error, #ef4444)" }}>*</span>}</span>
        {field.type === "content" ? (
          <small>Supports headings, paragraphs, links, and image references.</small>
        ) : null}
        {field.type === "content" ? (
          <RichTextField
            defaultValue={formatTextareaValue(field.name, rawValue)}
            media={mediaOptions}
            name={field.name}
          />
        ) : (
          <textarea
            defaultValue={formatTextareaValue(field.name, rawValue)}
            name={field.name}
            required={field.required}
            rows={field.rows ?? 5}
          />
        )}
      </label>
    );
  }

  if (field.type === "qa-list") {
    return <QaListField key={field.name} field={field} initialValue={formatQaValue(rawValue)} />;
  }

  if (field.type === "list") {
    const isHalf = field.name === "galleryAltText" || field.name === "galleryCaptions";
    return (
      <label className={`portal-field${isHalf ? "" : " is-wide"}`} key={field.name}>
        <span>{field.label} {field.required && <span style={{ color: "var(--p-error, #ef4444)" }}>*</span>}</span>
        <small>One item per line.</small>
        <textarea
          defaultValue={formatListValue(rawValue, field.itemName)}
          name={field.name}
          required={field.required}
          rows={field.rows ?? 6}
        />
      </label>
    );
  }

  if (field.type === "relationship") {
    const isHasMany = "hasMany" in field && field.hasMany;
    const selectedValues = relationInputValues(rawValue);
    if (field.relationTo === "media" && mediaOptions) {
      return (
        <div className="portal-field is-wide" key={field.name} style={{ marginBottom: "1rem" }}>
          <span style={{ display: "block", marginBottom: 8, fontWeight: 700, fontSize: 14, color: "var(--p-ink)" }}>
            {field.label} {field.required ? <span style={{ color: "var(--p-error, #ef4444)" }}>*</span> : null}
          </span>
          <MediaPickerField
            hasMany={isHasMany}
            initialValues={isHasMany ? selectedValues : inputValue ? [inputValue] : []}
            label={field.label}
            name={field.name}
            options={mediaOptions}
            required={field.required}
          />
        </div>
      );
    }
    const options = relationOptions[field.relationTo] ?? [];
    return (
      <label className="portal-field" key={field.name}>
        <span>{field.label} {field.required && <span style={{ color: "var(--p-error, #ef4444)" }}>*</span>}</span>
        <select
          defaultValue={field.hasMany ? selectedValues : inputValue || "__none"}
          multiple={field.hasMany}
          name={field.name}
          required={field.required}
          size={field.hasMany ? Math.min(8, Math.max(4, options.length)) : undefined}
        >
          {!field.hasMany ? <option value="__none">None</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="portal-field" key={field.name}>
        <span>{field.label} {field.required && <span style={{ color: "var(--p-error, #ef4444)" }}>*</span>}</span>
        <select
          defaultValue={typeof rawValue === "string" ? rawValue : field.options[0]?.value}
          name={field.name}
          required={field.required}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="portal-check" key={field.name}>
        <input defaultChecked={rawValue === true} name={field.name} type="checkbox" />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.name === "mapEmbedUrl") {
    return (
      <div className="portal-field is-wide" key={field.name} style={{ marginBottom: "1rem" }}>
        <span>{field.label}</span>
        <small>Paste Google Maps embed URL or src (https://www.google.com/maps/embed?...)</small>
        <input
          defaultValue={inputValue}
          name={field.name}
          required={field.required}
          type="url"
          style={{ marginBottom: "10px" }}
          onChange={(e) => {
            const iframe = window.document.getElementById("map-preview-iframe") as HTMLIFrameElement;
            if (iframe) {
              let url = e.target.value;
              if (url.includes("<iframe")) {
                const match = url.match(/src="([^"]+)"/);
                if (match) url = match[1];
                e.target.value = url;
              }
              iframe.src = url;
            }
          }}
        />
        {inputValue && (
          <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb", marginTop: "10px" }}>
            <iframe id="map-preview-iframe" src={inputValue} width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
      </div>
    );
  }

  if (field.name === "backgroundVideoUrl") {
    const videoId = getYouTubeVideoId(inputValue);
    return (
      <div className="portal-field is-wide" key={field.name}>
        <span>{field.label}</span>
        <small>Optional. When set, the video replaces the image gallery on the homepage hero.</small>
        <input
          defaultValue={inputValue}
          name={field.name}
          placeholder="https://www.youtube.com/watch?v=…"
          type="url"
        />
        {videoId ? (
          <div className="acc-youtube-preview" style={{ marginTop: 12 }}>
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Hero background video preview"
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (field.name === "slideIntervalSeconds") {
    return (
      <label className="portal-field is-wide" key={field.name}>
        <span>{field.label}</span>
        <small>How long each image shows before the next one (3–30 seconds). Also controls how long this slide stays active when multiple hero slides are published.</small>
        <input
          defaultValue={inputValue || "6"}
          max={30}
          min={3}
          name={field.name}
          step={1}
          type="number"
        />
      </label>
    );
  }

  if (field.name === "galleryAltText" || field.name === "galleryCaptions") return null;

  if (field.name === "longitude") return null;

  if (field.name === "latitude") {
    return <LocationPickerField
      key="location-picker"
      initialLat={inputValue}
      initialLng={getFormFieldValue(document, "longitude") as string}
      latFieldName="latitude"
      lngFieldName="longitude"
    />;
  }

  return (
    <label className="portal-field" key={field.name}>
      <span>{field.label} {field.required && <span style={{ color: "var(--p-error, #ef4444)" }}>*</span>}</span>
      <input
        defaultValue={inputValue}
        name={field.name}
        required={field.required}
        type={field.type}
      />
    </label>
  );
}

/* ─── Submit handler ────────────────────────────────────────── */
async function buildPayload(
  fields: PortalField[],
  formData: FormData,
  moduleSlug?: string
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  fields.forEach((field) => {
    const raw =
      field.type === "relationship" && field.hasMany
        ? formData.getAll(field.name).filter((v) => v !== "__none")
        : formData.get(field.name);
    let value: unknown = raw;

    if (field.type === "checkbox") value = raw === "on";
    if (field.type === "number") value = raw ? Number(raw) : undefined;
    if (field.name === "slug" && typeof value === "string") value = slugify(value);
    if (field.type === "relationship" && value === "__none") value = undefined;
    if (field.type === "relationship" && Array.isArray(value)) value = value.map(payloadRelationshipId);
    if (field.type === "relationship" && value !== undefined && !Array.isArray(value)) value = payloadRelationshipId(value);

    if (field.type === "list" && typeof value === "string") {
      const targetName =
        field.name === "includedItems" ? "included" : field.name === "excludedItems" ? "excluded" : field.name;
      if (field.name === "galleryAltText" || field.name === "galleryCaptions") return;
      setNested(data, targetName, parseList(value, field.itemName ?? "item"));
      return;
    }

    if (field.type === "qa-list" && typeof value === "string") {
      const targetName = field.name === "faqsJson" ? "faqs" : "directAnswers";
      setNested(data, targetName, parseQaList(value));
      return;
    }

    if (field.name === "galleryImages" && Array.isArray(value)) {
      const altLines = String(formData.get("galleryAltText") ?? "")
        .split(/\r?\n/)
        .map((s) => s.trim());
      const capLines = String(formData.get("galleryCaptions") ?? "")
        .split(/\r?\n/)
        .map((s) => s.trim());
      setNested(
        data,
        "gallery",
        value.map((image, i) => ({
          image,
          alt: altLines[i] || "Nature Romp Safaris gallery image",
          caption: capLines[i] || "",
        }))
      );
      return;
    }

    if (field.name === "itineraryDaysJson" && typeof value === "string") {
      const days = value
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((entry, idx) => {
          const lines = entry.split(/\r?\n/);
          const record: Record<string, unknown> = {
            day: idx + 1,
            description: entry.trim(),
            title: lines[0]?.replace(/^#+\s*/, "").trim() || `Day ${idx + 1}`,
          };
          lines.slice(1).forEach((line) => {
            const [key, ...rest] = line.split(":");
            const val = rest.join(":").trim();
            const k = key.trim().toLowerCase();
            if (["location", "meals", "accommodation"].includes(k) && val) record[k] = val;
          });
          return record;
        });
      setNested(data, "itineraryDays", days);
      return;
    }

    if (field.name === "daysJson" && typeof value === "string") {
      const days = value
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((entry, idx) => ({
          day: idx + 1,
          description: entry.trim(),
          title: entry.split(/\r?\n/)[0]?.replace(/^#+\s*/, "").trim() || `Day ${idx + 1}`,
        }));
      setNested(data, "days", days);
      return;
    }

    if (value !== "" && value !== undefined) setNested(data, field.name, value);
  });

  if (moduleSlug === "destinations") {
    const nameVal = formData.get("name");
    if (nameVal) {
      setNested(data, "seo.title", nameVal);
    }
  }

  return data;
}

/* ─── Component ─────────────────────────────────────────────── */
export function ResourceForm({
  collection,
  document,
  fields,
  globalSlug,
  moduleHref,
  moduleSlug,
  relationOptions = {},
  title,
  mediaOptions = [],
}: {
  collection?: string;
  document?: Record<string, unknown>;
  fields: PortalField[];
  globalSlug?: string;
  moduleHref: string;
  moduleSlug?: string;
  relationOptions?: Record<string, Array<{ label: string; value: string }>>;
  mediaOptions?: PortalMediaOption[];
  title: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");
  const [savedAnim, setSavedAnim] = useState(false);
  // useRef so the action is always current when onSubmit fires (state updates are async)
  const pendingAction = useRef<"draft" | "published">("draft");
  const formRef = useRef<HTMLFormElement>(null);

  const [slug, setSlug] = useState(() => (document?.slug ? String(document.slug) : ""));
  const [isSlugEdited, setIsSlugEdited] = useState(!!document?.slug);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  const sections = groupFields(fields, moduleSlug);
  const layout = splitSectionsForLayout(sections, moduleSlug);
  const isSingleSection = sections.length === 1;

  const statusField = fields.find((f) => f.name === "status");
  const hasDraftPublish = statusField && "options" in statusField && statusField.options?.some((o) => o.value === "published");

  // Fields required only on publish (not on save draft)
  const publishRequiredFields = fields.filter((f) => f.required && f.name !== "status");

  const slugState = moduleSlug === "destinations" ? {
    slug,
    setSlug,
    isEditingSlug,
    setIsEditingSlug,
    isSlugEdited,
    setIsSlugEdited,
  } : undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>, action: "draft" | "published") {
    e.preventDefault();
    setError("");
    setSaving(action);
    const formData = new FormData(e.currentTarget);

    // Only validate required fields when publishing, never when saving draft
    if (action === "published" && publishRequiredFields.length > 0) {
      const missing: string[] = [];
      for (const field of publishRequiredFields) {
        const val = formData.get(field.name);
        if (!val || String(val).trim() === "" || val === "__none") {
          missing.push(field.label);
        }
      }
      if (missing.length > 0) {
        setError(`Please fill in the following fields before publishing: ${missing.join(", ")}`);
        setSaving("idle");
        return;
      }
    }

    if (hasDraftPublish) {
      formData.set("status", action);
    }

    const data = await buildPayload(fields, formData, moduleSlug);

    const res = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection,
        data,
        globalSlug,
        id: document?.id ? String(document.id) : undefined,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payloadResult = await res.json().catch(() => null);

    setSaving("idle");
    if (!res.ok) {
      setError(payloadResult?.errors?.[0]?.message || payloadResult?.message || "Unable to save. Please try again.");
      return;
    }

    // On draft: show animation, redirect to edit page with record ID if new
    if (action === "draft") {
      setSavedAnim(true);
      setTimeout(() => setSavedAnim(false), 2500);
      const recordId = payloadResult?.result?.id;
      if (!document?.id && recordId) {
        router.push(`${moduleHref}/${recordId}`);
      } else {
        router.refresh();
      }
      return;
    }

    // On publish: redirect back to list
    router.push(moduleHref);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={(e) => submit(e, pendingAction.current)}>
      <div className="portal-form-layout">
        {/* Save bar */}
        <div className="portal-form-toolbar">
          <div className="portal-form-toolbar__copy">
            <h2>{title}</h2>
            <p>
              {hasDraftPublish ? "Save a draft at any time. Fill all required fields before publishing." : "Fill in the fields below and save when ready."}
            </p>
          </div>
          <div className="portal-form-toolbar__actions">
            {hasDraftPublish ? (
              <>
                <button
                  className="portal-button portal-button--secondary"
                  disabled={saving !== "idle"}
                  type="submit"
                  onClick={() => { pendingAction.current = "draft"; }}
                >
                  <Save size={16} style={{ marginRight: 6 }} />
                  {saving === "draft" ? "Saving…" : savedAnim ? "Saved! ✓" : "Save Draft"}
                </button>
                <button
                  className="portal-button"
                  disabled={saving !== "idle"}
                  type="submit"
                  onClick={() => { pendingAction.current = "published"; }}
                >
                  <Send size={16} style={{ marginRight: 6 }} />
                  {saving === "published" ? "Publishing…" : "Publish"}
                </button>
              </>
            ) : (
              <button className="portal-button" disabled={saving !== "idle"} type="submit">
                <Save size={16} style={{ marginRight: 6 }} />
                {saving !== "idle" ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        </div>

        {error ? <p className="portal-form__error">{error}</p> : null}

        <div className="portal-form-split">
          <div className="portal-form-main">
            {layout.main.map((section) => (
              <div className="portal-form-section" key={section.id}>
                {!isSingleSection ? (
                  <div className="portal-form-section__head">
                    <h3>{section.label}</h3>
                  </div>
                ) : null}
                <div
                  className={`portal-form-section__body${section.fields.every(
                    (f) =>
                      f.type === "textarea" ||
                      f.type === "content" ||
                      f.type === "list" ||
                      f.type === "qa-list"
                  )
                    ? " is-single"
                    : ""
                    }`}
                >
                  {section.fields.map((field) =>
                    renderField(field, document ?? {}, mediaOptions, relationOptions, slugState)
                  )}
                </div>
              </div>
            ))}
          </div>

          {layout.side.length ? (
            <aside className="portal-form-sidebar">
              {layout.side.map((section) => (
                <div className="portal-form-section" key={section.id}>
                  {!isSingleSection ? (
                    <div className="portal-form-section__head">
                      <h3>{section.label}</h3>
                    </div>
                  ) : null}
                  <div
                    className={`portal-form-section__body${section.fields.every(
                      (f) =>
                        f.type === "textarea" ||
                        f.type === "content" ||
                        f.type === "list" ||
                        f.type === "qa-list"
                    )
                      ? " is-single"
                      : ""
                      }`}
                  >
                    {section.fields.map((field) => {
                      if (field.name === "status" && hasDraftPublish) return null;
                      return renderField(field, document ?? {}, mediaOptions, relationOptions, slugState);
                    })}
                  </div>
                </div>
              ))}
            </aside>
          ) : null}
        </div>

        {/* Bottom save bar */}
        <div className="portal-form__actions">
          {hasDraftPublish ? (
            <>
              <button
                className="portal-button portal-button--secondary"
                disabled={saving !== "idle"}
                type="submit"
                onClick={() => { pendingAction.current = "draft"; }}
              >
                <Save size={16} style={{ marginRight: 6 }} />
                {saving === "draft" ? "Saving…" : savedAnim ? "Saved! ✓" : "Save Draft"}
              </button>
              <button
                className="portal-button"
                disabled={saving !== "idle"}
                type="submit"
                onClick={() => { pendingAction.current = "published"; }}
              >
                <Send size={16} style={{ marginRight: 6 }} />
                {saving === "published" ? "Publishing…" : "Publish"}
              </button>
            </>
          ) : (
            <button className="portal-button" disabled={saving !== "idle"} type="submit">
              <Save size={16} style={{ marginRight: 6 }} />
              {saving !== "idle" ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </div>
    </form >
  );
}
