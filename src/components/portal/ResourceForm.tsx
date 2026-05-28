"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RichTextField } from "@/components/portal/RichTextField";
import { getValue, slugify } from "@/lib/portal/format";
import type { PortalField } from "@/lib/portal/modules";

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
  "heroImage","image","galleryImages","galleryAltText","galleryCaptions",
  "openGraphImage","coverImage","gallery",
]);

const CONTENT_NAMES = new Set([
  "summary","excerpt","content","body","overview","description",
  "notes","internalNotes","message","comments","availabilityNote",
  "faqsJson","directAnswersJson","itineraryDaysJson","daysJson",
  "includedItems","excludedItems",
]);

const DATE_NAMES = new Set([
  "startDate","endDate","travelDays","travelStartDate","travelEndDate",
  "tourStartDate","flexibleDates",
  "budget.currency","budget.min","budget.max","budget.displayText","budgetText",
  "budgetRange","budgetPerPerson","travellers","adults","children","infants",
  "discount.enabled","discount.label","discount.amountText",
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
      names: ["name", "summary", "content", "faqsJson", "directAnswersJson"],
    },
    {
      id: "media",
      label: "Media",
      names: ["heroImage", "galleryImages", "galleryAltText", "galleryCaptions"],
    },
    {
      id: "publishing",
      label: "Publishing",
      names: ["slug", "status", "country", "region"],
    },
    {
      id: "map-location",
      label: "Map & Location",
      names: ["mapEmbedUrl", "latitude", "longitude"],
    },
    {
      id: "seo",
      label: "SEO & Metadata",
      names: ["seo.title", "seo.description", "seo.keywords", "seo.canonicalSlug"],
    },
  ];

  const used = new Set<string>();
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

function groupFields(fields: PortalField[], moduleSlug?: string): FieldSection[] {
  if (moduleSlug === "destinations") {
    return groupDestinationFields(fields);
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
  if (moduleSlug === "destinations") {
    const sidebarIds = new Set(["publishing", "map-location", "seo"]);
    return {
      main: sections.filter((section) => !sidebarIds.has(section.id)),
      side: sections.filter((section) => sidebarIds.has(section.id)),
    };
  }

  if (sections.length <= 2) return { main: sections, side: [] as FieldSection[] };
  return {
    main: sections.slice(0, Math.ceil(sections.length * 0.65)),
    side: sections.slice(Math.ceil(sections.length * 0.65)),
  };
}

/* ─── Field renderer ────────────────────────────────────────── */
function renderField(
  field: PortalField,
  document: Record<string, unknown>,
  mediaOptions: Array<{ alt: string; filename: string; id: string; url: string }>,
  relationOptions: Record<string, Array<{ label: string; value: string }>>,
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

  if (field.type === "textarea" || field.type === "content") {
    return (
      <label className="portal-field is-wide" key={field.name}>
        <span>{field.label}</span>
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

  if (field.type === "list" || field.type === "qa-list") {
    return (
      <label className="portal-field is-wide" key={field.name}>
        <span>{field.label}</span>
        <small>
          {field.type === "qa-list"
            ? "One block per Q&A: first line = question, remaining lines = answer. Separate blocks with a blank line."
            : "One item per line."}
        </small>
        <textarea
          defaultValue={
            field.type === "qa-list"
              ? formatQaValue(rawValue)
              : formatListValue(rawValue, field.itemName)
          }
          name={field.name}
          required={field.required}
          rows={field.rows ?? 6}
        />
      </label>
    );
  }

  if (field.type === "relationship") {
    const options = relationOptions[field.relationTo] ?? [];
    const selectedValues = relationInputValues(rawValue);
    return (
      <label className="portal-field" key={field.name}>
        <span>{field.label}</span>
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
        <span>{field.label}</span>
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

  return (
    <label className="portal-field" key={field.name}>
      <span>{field.label}</span>
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
  formData: FormData
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
  mediaOptions?: Array<{ alt: string; filename: string; id: string; url: string }>;
  title: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sections = groupFields(fields, moduleSlug);
  const layout = splitSectionsForLayout(sections, moduleSlug);
  const isSingleSection = sections.length === 1;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = await buildPayload(fields, formData);

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

    setSaving(false);
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.errors?.[0]?.message || payload?.message || "Unable to save. Please try again.");
      return;
    }

    router.push(moduleHref);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="portal-form-layout">
        {/* Save bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "14px 0",
            borderBottom: "1.5px solid var(--p-line)",
            marginBottom: 4,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--p-ink)" }}>{title}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--p-muted)" }}>
              Fill in the fields below and save when ready.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              className="portal-button portal-button--ghost"
              onClick={() => router.push(moduleHref)}
              type="button"
            >
              Cancel
            </button>
            <button className="portal-button" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save changes"}
            </button>
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
                  className={`portal-form-section__body${
                    section.fields.every(
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
                    renderField(field, document ?? {}, mediaOptions, relationOptions)
                  )}
                </div>
              </div>
            ))}
          </div>

          {layout.side.length ? (
            <aside className="portal-form-sidebar">
              <div className="portal-panel">
                <h3>Save</h3>
                <button className="portal-button" disabled={saving} type="submit">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  className="portal-button portal-button--secondary"
                  onClick={() => router.push(moduleHref)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
              {layout.side.map((section) => (
                <div className="portal-form-section" key={section.id}>
                  {!isSingleSection ? (
                    <div className="portal-form-section__head">
                      <h3>{section.label}</h3>
                    </div>
                  ) : null}
                  <div
                    className={`portal-form-section__body${
                      section.fields.every(
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
                      renderField(field, document ?? {}, mediaOptions, relationOptions)
                    )}
                  </div>
                </div>
              ))}
            </aside>
          ) : null}
        </div>

        {/* Bottom save bar */}
        {!layout.side.length ? (
          <div className="portal-form__actions">
            <button className="portal-button" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              className="portal-button portal-button--secondary"
              onClick={() => router.push(moduleHref)}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
