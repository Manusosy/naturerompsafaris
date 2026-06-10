"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { LocationSearchPicker } from "@/components/portal/LocationSearchPicker";
import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";
import { RichTextField } from "@/components/portal/RichTextField";
import { buildMapEmbedUrl } from "@/lib/portal/geocode";
import { slugify } from "@/lib/portal/format";

type QaItem = { question: string; answer: string };
type WizardData = {
  name: string;
  slug: string;
  country: string;
  region: string;
  heroImageId: string;
  galleryImageIds: string[];
  summary: string;
  content: string;
  mapEmbedUrl: string;
  mapSearchQuery: string;
  latitude: string;
  longitude: string;
  faqs: QaItem[];
  seoDescription: string;
  seoKeywords: string;
  seoCanonicalSlug: string;
};

const STEPS = [
  { id: 1, label: "Details", description: "Name, country & region" },
  { id: 2, label: "Media", description: "Hero & gallery" },
  { id: 3, label: "Content", description: "Summary & description" },
  { id: 4, label: "Map & FAQs", description: "Search location & questions" },
  { id: 5, label: "Publish", description: "SEO, review & save" },
] as const;

const COUNTRY_OPTIONS = [
  { label: "Kenya", value: "kenya" },
  { label: "Tanzania", value: "tanzania" },
];

const REGION_HINTS: Record<string, string[]> = {
  kenya: ["Masai Mara", "Amboseli", "Lake Nakuru", "Samburu", "Laikipia", "Tsavo", "Nairobi", "Mount Kenya"],
  tanzania: ["Serengeti", "Ngorongoro", "Tarangire", "Lake Manyara", "Kilimanjaro", "Zanzibar", "Arusha", "Selous"],
};

function relationId(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function toPayloadMediaId(id: string) {
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

function buildFromDoc(doc: Record<string, unknown>): WizardData {
  const gallery = Array.isArray(doc.gallery)
    ? (doc.gallery as Array<Record<string, unknown>>)
    : [];
  const seo =
    doc.seo && typeof doc.seo === "object"
      ? (doc.seo as Record<string, unknown>)
      : {};

  return {
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    country: String(doc.country ?? "kenya"),
    region: String(doc.region ?? ""),
    heroImageId: relationId(doc.heroImage),
    galleryImageIds: gallery
      .map((item) => relationId(item.image))
      .filter(Boolean),
    summary: String(doc.summary ?? ""),
    content: String(doc.content ?? ""),
    mapEmbedUrl: String(doc.mapEmbedUrl ?? ""),
    mapSearchQuery: String(doc.name ?? doc.region ?? ""),
    latitude: String(doc.latitude ?? ""),
    longitude: String(doc.longitude ?? ""),
    faqs: parseQaItems(doc.faqs),
    seoDescription: String(seo.description ?? ""),
    seoKeywords: String(seo.keywords ?? ""),
    seoCanonicalSlug: String(seo.canonicalSlug ?? doc.slug ?? ""),
  };
}

function QaEditor({
  addLabel,
  emptyLabel,
  items,
  onChange,
  title,
}: {
  addLabel: string;
  emptyLabel: string;
  items: QaItem[];
  onChange: (items: QaItem[]) => void;
  title: string;
}) {
  function updateItem(index: number, key: keyof QaItem, value: string) {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  }

  function addItem() {
    onChange([...items, { question: "", answer: "" }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      onChange([{ question: "", answer: "" }]);
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  }

  const filledCount = items.filter((i) => i.question.trim() && i.answer.trim()).length;

  return (
    <div className="acc-field">
      <div className="acc-faq-head">
        <label className="acc-label">{title}</label>
        <button className="acc-amenity-btn" onClick={addItem} type="button">
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <span className="acc-hint">{filledCount} complete Q&amp;A pair(s).</span>
      <div className="acc-faq-list">
        {items.map((item, index) => (
          <div className="acc-faq-item" key={index}>
            <button
              aria-label="Remove Q&A"
              className="acc-faq-remove"
              onClick={() => removeItem(index)}
              type="button"
            >
              <X size={14} />
            </button>
            <div className="acc-field">
              <label className="acc-label">Question</label>
              <input
                className="acc-input"
                onChange={(e) => updateItem(index, "question", e.target.value)}
                placeholder="e.g. When is the best time to visit?"
                type="text"
                value={item.question}
              />
            </div>
            <div className="acc-field">
              <label className="acc-label">Answer</label>
              <textarea
                className="acc-textarea"
                onChange={(e) => updateItem(index, "answer", e.target.value)}
                placeholder="Provide a clear and helpful answer…"
                rows={3}
                value={item.answer}
              />
            </div>
          </div>
        ))}
        {items.every((i) => !i.question.trim() && !i.answer.trim()) && (
          <span className="acc-amenities-empty">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

export function DestinationWizard({
  document,
  media,
}: {
  document?: Record<string, unknown>;
  media: PortalMediaOption[];
}) {
  const router = useRouter();
  const isEdit = !!document?.id;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(() =>
    document
      ? buildFromDoc(document)
      : {
          name: "",
          slug: "",
          country: "kenya",
          region: "",
          heroImageId: "",
          galleryImageIds: [],
          summary: "",
          content: "",
          mapEmbedUrl: "",
          mapSearchQuery: "",
          latitude: "",
          longitude: "",
          faqs: [{ question: "", answer: "" }],
          seoDescription: "",
          seoKeywords: "",
          seoCanonicalSlug: "",
        },
  );
  const [savingAs, setSavingAs] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"draft" | "published" | null>(null);

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function handleNameChange(val: string) {
    set("name", val);
    if (!isEdit || !data.slug) {
      const nextSlug = slugify(val);
      set("slug", nextSlug);
      if (!data.seoCanonicalSlug) set("seoCanonicalSlug", nextSlug);
    }
  }

  function validateBeforeSave() {
    if (!data.name.trim()) return "Destination name is required.";
    const nextSlug = (data.slug || slugify(data.name)).trim();
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

    const finalSlug = data.slug || slugify(data.name);
    const lat = data.latitude.trim();
    const lng = data.longitude.trim();
    const mapUrl =
      normalizeMapEmbedUrl(data.mapEmbedUrl) ||
      (lat && lng ? buildMapEmbedUrl(lat, lng, data.mapSearchQuery || data.name) : "");
    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      slug: finalSlug,
      country: data.country,
      region: data.region.trim(),
      summary: data.summary.trim(),
      content: data.content.trim(),
      mapEmbedUrl: mapUrl,
      latitude: lat,
      longitude: lng,
      faqs: data.faqs.filter((i) => i.question.trim() && i.answer.trim()),
      status: targetStatus,
      seo: {
        title: data.name.trim(),
        description: data.seoDescription.trim(),
        keywords: data.seoKeywords.trim(),
        canonicalSlug: (data.seoCanonicalSlug || finalSlug).trim(),
      },
    };

    if (data.heroImageId) payload.heroImage = toPayloadMediaId(data.heroImageId);
    if (data.galleryImageIds.length) {
      payload.gallery = data.galleryImageIds.map((id) => {
        const asset = media.find((item) => item.id === id);
        return {
          image: toPayloadMediaId(id),
          alt: asset?.alt?.trim() || data.name.trim() || "Nature Romp Safaris gallery image",
          caption: asset?.caption?.trim() || "",
        };
      });
    }

    const body: Record<string, unknown> = {
      collection: "destinations",
      data: payload,
    };
    if (isEdit) body.id = String(document!.id);

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
      router.push("/admin/destinations");
      router.refresh();
    }, 1800);
  }

  const mapPreviewUrl =
    normalizeMapEmbedUrl(data.mapEmbedUrl) ||
    (data.latitude && data.longitude
      ? buildMapEmbedUrl(data.latitude, data.longitude, data.mapSearchQuery || data.name)
      : "");
  const regionHints = REGION_HINTS[data.country] ?? [];

  const stepValid: Record<number, boolean> = {
    1: !!data.name.trim(),
    2: true,
    3: true,
    4: true,
    5: true,
  };

  return (
    <div className="acc-wizard">
      <div className="acc-wizard__steps">
        {STEPS.map((s) => (
          <button
            className={[
              "acc-wizard__step",
              step === s.id ? "is-active" : "",
              step > s.id ? "is-done" : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
            <h2 className="acc-wizard__heading">Destination Details</h2>
            <p className="acc-wizard__sub">
              Name, URL, country and region. Use the official park or place name guests will recognise.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="dest-name">
                Destination Name <span className="acc-req">*</span>
              </label>
              <input
                className="acc-input"
                id="dest-name"
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Masai Mara National Reserve"
                type="text"
                value={data.name}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="dest-slug">
                URL Slug <span className="acc-req">*</span>
              </label>
              <div className="acc-slug-wrap">
                <span className="acc-slug-prefix">/destinations/</span>
                <input
                  className="acc-input acc-input--slug"
                  id="dest-slug"
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder="masai-mara-national-reserve"
                  type="text"
                  value={data.slug}
                />
              </div>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="dest-country">Country</label>
                <select
                  className="acc-select"
                  id="dest-country"
                  onChange={(e) => set("country", e.target.value)}
                  value={data.country}
                >
                  {COUNTRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="dest-region">Region / Circuit</label>
                <input
                  className="acc-input"
                  id="dest-region"
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="e.g. Rift Valley, Northern Circuit"
                  type="text"
                  value={data.region}
                />
              </div>
            </div>

            {regionHints.length > 0 && (
              <div className="acc-amenity-suggestions">
                <span>Quick add:</span>
                {regionHints
                  .filter((hint) => !data.region.includes(hint))
                  .map((hint) => (
                    <button
                      className="acc-amenity-suggest"
                      key={hint}
                      onClick={() => set("region", data.region ? `${data.region}, ${hint}` : hint)}
                      type="button"
                    >
                      + {hint}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Photos & Gallery</h2>
            <p className="acc-wizard__sub">
              Hero image for the destination page header, plus optional gallery images.
            </p>

            <div className="acc-media-section" style={{ marginBottom: 24 }}>
              <MediaPickerField
                hasMany={false}
                initialValues={data.heroImageId ? [data.heroImageId] : []}
                label="Hero Image"
                onChange={(ids) => set("heroImageId", ids[0] ?? "")}
                options={media}
              />
            </div>

            <div className="acc-media-section">
              <MediaPickerField
                hasMany
                initialValues={data.galleryImageIds}
                label="Gallery Images"
                onChange={(ids) => set("galleryImageIds", ids)}
                options={media}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Summary & Description</h2>
            <p className="acc-wizard__sub">
              A short summary for cards and listings, plus the full destination write-up for the public page.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="dest-summary">Summary</label>
              <textarea
                className="acc-textarea"
                id="dest-summary"
                onChange={(e) => set("summary", e.target.value)}
                placeholder="A brief, compelling summary of the destination…"
                rows={4}
                value={data.summary}
              />
              <span className="acc-hint">Shown on destination cards and in search previews.</span>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="dest-content">Full Description</label>
              <RichTextField
                defaultValue={data.content}
                key={document?.id ? String(document.id) : "new-dest"}
                media={media}
                name="content"
                onChange={(val) => set("content", val)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Map & FAQs</h2>
            <p className="acc-wizard__sub">
              Search for the park or place — the map updates automatically. FAQs appear on the destination detail page.
            </p>

            <LocationSearchPicker
              country={data.country}
              hint={`Search within ${COUNTRY_OPTIONS.find((o) => o.value === data.country)?.label ?? "East Africa"} or type the full place name.`}
              latitude={data.latitude}
              locationQuery={data.mapSearchQuery}
              longitude={data.longitude}
              onLatitudeChange={(val) => set("latitude", val)}
              onLocationQueryChange={(val) => set("mapSearchQuery", val)}
              onLongitudeChange={(val) => set("longitude", val)}
            />

            {mapPreviewUrl ? (
              <div className="acc-field">
                <label className="acc-label">Map preview</label>
                <div className="acc-youtube-preview">
                  <iframe
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapPreviewUrl}
                    title="Map preview"
                  />
                </div>
              </div>
            ) : null}

            <QaEditor
              addLabel="Add FAQ"
              emptyLabel="No FAQs added yet."
              items={data.faqs}
              onChange={(items) => set("faqs", items)}
              title="Frequently Asked Questions"
            />
          </div>
        )}

        {step === 5 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">SEO & Publish</h2>
            <p className="acc-wizard__sub">Search metadata, final review, then save or publish.</p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="dest-seo-desc">Meta Description</label>
              <textarea
                className="acc-textarea"
                id="dest-seo-desc"
                onChange={(e) => set("seoDescription", e.target.value)}
                placeholder="155–160 characters recommended for search results…"
                rows={3}
                value={data.seoDescription}
              />
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="dest-seo-keywords">Keywords</label>
                <input
                  className="acc-input"
                  id="dest-seo-keywords"
                  onChange={(e) => set("seoKeywords", e.target.value)}
                  placeholder="Comma-separated keywords"
                  type="text"
                  value={data.seoKeywords}
                />
              </div>
              <div className="acc-field">
                <label className="acc-label" htmlFor="dest-seo-canonical">Canonical Slug</label>
                <input
                  className="acc-input"
                  id="dest-seo-canonical"
                  onChange={(e) => set("seoCanonicalSlug", slugify(e.target.value))}
                  placeholder={data.slug || "destination-slug"}
                  type="text"
                  value={data.seoCanonicalSlug}
                />
              </div>
            </div>

            <div className="acc-review">
              <div className="acc-review__row">
                <span className="acc-review__label">Name</span>
                <span className="acc-review__value">{data.name || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Slug</span>
                <span className="acc-review__value">/destinations/{data.slug || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Country</span>
                <span className="acc-review__value">
                  {COUNTRY_OPTIONS.find((o) => o.value === data.country)?.label ?? data.country}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Region</span>
                <span className="acc-review__value">{data.region || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Hero Image</span>
                <span className="acc-review__value">{data.heroImageId ? "Selected" : <em>None</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Gallery</span>
                <span className="acc-review__value">{data.galleryImageIds.length} image(s)</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Summary</span>
                <span className="acc-review__value">
                  {data.summary ? `${data.summary.slice(0, 80)}…` : <em>None</em>}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Location</span>
                <span className="acc-review__value">{data.mapSearchQuery || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Map</span>
                <span className="acc-review__value">{mapPreviewUrl ? "Ready" : <em>Not set</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">FAQs</span>
                <span className="acc-review__value">
                  {data.faqs.filter((i) => i.question.trim() && i.answer.trim()).length} question(s)
                </span>
              </div>
            </div>

            <div className="acc-publish-note">
              <strong>Ready to go?</strong>
              <p>
                Use <em>Save Draft</em> to save without publishing, or <em>Publish</em> to make this
                destination live on the public destinations page immediately.
              </p>
            </div>

            {success && (
              <div className="acc-success">
                <Check size={16} strokeWidth={3} />
                {success === "published"
                  ? "Published! The destination is now live. Redirecting…"
                  : "Saved as draft. Redirecting to destinations list…"}
              </div>
            )}

            {error && (
              <div className="acc-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="acc-wizard__nav">
        <button
          className="acc-btn acc-btn--ghost"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          type="button"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <span className="acc-wizard__step-label">
          Step {step} of {STEPS.length}
        </span>
        {step < STEPS.length ? (
          <button
            className="acc-btn acc-btn--primary"
            disabled={!stepValid[step]}
            onClick={() => setStep((s) => s + 1)}
            type="button"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <div className="acc-wizard__final-actions">
            <button
              className="acc-btn acc-btn--save"
              disabled={savingAs !== null || !data.name.trim()}
              onClick={() => save("draft")}
              type="button"
            >
              {savingAs === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              className="acc-btn acc-btn--publish"
              disabled={savingAs !== null || !data.name.trim()}
              onClick={() => save("published")}
              type="button"
            >
              {savingAs === "published" ? "Publishing…" : "Publish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
