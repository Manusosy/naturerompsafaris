"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { slugify } from "@/lib/portal/format";
import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";

type RelationOption = { label: string; value: string };
type QaItem = { question: string; answer: string };

type WizardData = {
  title: string;
  slug: string;
  category: string;
  packageTier: string;
  duration: string;
  imageId: string;
  priceText: string;
  bestTime: string;
  destinationIds: string[];
  destinationsText: string;
  content: string;
  excerpt: string;
  faqs: QaItem[];
  accommodationIds: string[];
};

const STEPS = [
  { id: 1, label: "Basics", description: "Title, market & style" },
  { id: 2, label: "Hero", description: "Cover image" },
  { id: 3, label: "Quick facts", description: "Duration, route & price" },
  { id: 4, label: "Page content", description: "Overview & FAQs" },
  { id: 5, label: "Publish", description: "Review & save" },
] as const;



const TIER_OPTIONS = [
  { label: "Budget", value: "budget" },
  { label: "Mid Range", value: "mid-range" },
  { label: "Luxury", value: "luxury" },
  { label: "High End", value: "high-end" },
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

function parseQaItems(value: unknown): QaItem[] {
  if (!Array.isArray(value)) return [{ question: "", answer: "" }];
  const items = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      return {
        question: String(item.question ?? ""),
        answer: String(item.answer ?? ""),
      };
    })
    .filter((item): item is QaItem => !!item && (!!item.question || !!item.answer));
  return items.length ? items : [{ question: "", answer: "" }];
}

function toPayloadMediaId(id: string) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && String(numericId) === id ? numericId : id;
}

function buildDestinationsText(ids: string[], destinations: RelationOption[], current: string) {
  if (current.trim()) return current;
  return ids
    .map((id) => destinations.find((d) => d.value === id)?.label)
    .filter(Boolean)
    .join(" · ");
}

function buildFromDoc(doc: Record<string, unknown>): WizardData {
  return {
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    category: String(doc.category ?? ""),
    packageTier: String(doc.packageTier ?? "mid-range"),
    duration: String(doc.duration ?? ""),
    imageId: relationId(doc.image),
    priceText: String(doc.priceText ?? ""),
    bestTime: String(doc.bestTime ?? ""),
    destinationIds: relationIds(doc.destinations),
    destinationsText: String(doc.destinationsText ?? ""),
    content: String(doc.content ?? ""),
    excerpt: String(doc.excerpt ?? ""),
    faqs: parseQaItems(doc.faqs),
    accommodationIds: relationIds(doc.accommodations),
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
                      placeholder="Write a clear answer for visitors…"
                      rows={4}
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

export function PackageWizard({
  accommodations,
  destinations,
  document,
  media,
}: {
  accommodations: RelationOption[];
  destinations: RelationOption[];
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
          title: "",
          slug: "",
          category: "",
          packageTier: "mid-range",
          duration: "",
          imageId: "",
          priceText: "",
          bestTime: "",
          destinationIds: [],
          destinationsText: "",
          content: "",
          excerpt: "",
          faqs: [{ question: "", answer: "" }],
          accommodationIds: [],
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
    }
  }

  function toggleDestination(id: string) {
    const next = data.destinationIds.includes(id)
      ? data.destinationIds.filter((x) => x !== id)
      : [...data.destinationIds, id];
    setData((d) => ({
      ...d,
      destinationIds: next,
      destinationsText: buildDestinationsText(next, destinations, d.destinationsText),
    }));
  }

  function removeDestination(id: string) {
    const next = data.destinationIds.filter((x) => x !== id);
    setData((d) => ({
      ...d,
      destinationIds: next,
      destinationsText: buildDestinationsText(next, destinations, ""),
    }));
  }

  function toggleAccommodation(id: string) {
    const next = data.accommodationIds.includes(id)
      ? data.accommodationIds.filter((x) => x !== id)
      : [...data.accommodationIds, id];
    set("accommodationIds", next);
  }

  function removeAccommodation(id: string) {
    set("accommodationIds", data.accommodationIds.filter((x) => x !== id));
  }

  function validateBeforeSave() {
    if (!data.title.trim()) return "Package title is required.";
    if (!data.category) return "Market / destination is required.";
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
    const payload: Record<string, unknown> = {
      title: data.title.trim(),
      slug: finalSlug,
      category: data.category,
      packageTier: data.packageTier,
      duration: data.duration.trim(),
      priceText: data.priceText.trim(),
      bestTime: data.bestTime.trim(),
      destinationsText: data.destinationsText.trim(),
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
      faqs: data.faqs.filter((item) => item.question.trim() && item.answer.trim()),
      status: targetStatus,
    };

    if (data.imageId) payload.image = toPayloadMediaId(data.imageId);
    if (data.destinationIds.length) {
      payload.destinations = data.destinationIds.map(toPayloadMediaId);
    } else {
      payload.destinations = [];
    }
    if (data.accommodationIds.length) {
      payload.accommodations = data.accommodationIds.map(toPayloadMediaId);
    } else {
      payload.accommodations = [];
    }

    const body: Record<string, unknown> = {
      collection: "packages",
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
      router.push("/admin/packages");
      router.refresh();
    }, 1800);
  }

  const stepValid: Record<number, boolean> = {
    1: !!data.title.trim() && !!data.category,
    2: true,
    3: true,
    4: true,
    5: true,
  };

  const selectedDestinationLabels = data.destinationIds
    .map((id) => destinations.find((d) => d.value === id)?.label)
    .filter(Boolean);

  const selectedAccommodationLabels = data.accommodationIds
    .map((id) => accommodations.find((a) => a.value === id)?.label)
    .filter(Boolean);

  const faqCount = data.faqs.filter((item) => item.question.trim() && item.answer.trim()).length;

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
            <h2 className="acc-wizard__heading">Package basics</h2>
            <p className="acc-wizard__sub">
              These fields power the hero badge, title, and style row on the public package page.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-title">
                Package Title <span className="acc-req">*</span>
              </label>
              <input
                className="acc-input"
                id="pkg-title"
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. 7-Day Masai Mara & Serengeti Safari"
                type="text"
                value={data.title}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-slug">
                URL Slug <span className="acc-req">*</span>
              </label>
              <div className="acc-slug-wrap">
                <span className="acc-slug-prefix">/safari-packages/</span>
                <input
                  className="acc-input acc-input--slug"
                  id="pkg-slug"
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder="7-day-masai-mara-serengeti-safari"
                  type="text"
                  value={data.slug}
                />
              </div>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-category">
                  Market / Destination <span className="acc-req">*</span>
                </label>
                <select
                  className="acc-select"
                  id="pkg-category"
                  onChange={(e) => set("category", e.target.value)}
                  value={data.category}
                >
                  <option value="">— Select destination —</option>
                  {destinations.map((o) => (
                    <option key={o.value} value={o.label}>{o.label}</option>
                  ))}
                </select>
                <span className="acc-hint">Shown as the category badge above the package title.</span>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-tier">Style / Tier</label>
                <select
                  className="acc-select"
                  id="pkg-tier"
                  onChange={(e) => set("packageTier", e.target.value)}
                  value={data.packageTier}
                >
                  {TIER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="acc-hint">Appears in the quick facts strip as “Style”.</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Hero image</h2>
            <p className="acc-wizard__sub">
              The cover photo used in the package page hero and mobile gallery.
            </p>

            <MediaPickerField
              hasMany={false}
              initialValues={data.imageId ? [data.imageId] : []}
              label="Cover Image"
              onChange={(ids) => set("imageId", ids[0] ?? "")}
              options={media}
            />
          </div>
        )}

        {step === 3 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Quick facts</h2>
            <p className="acc-wizard__sub">
              These populate the facts strip on the package page. Duration, route, and live pricing also come from linked tours when available.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-duration">Duration (fallback)</label>
              <input
                className="acc-input"
                id="pkg-duration"
                onChange={(e) => set("duration", e.target.value)}
                placeholder="e.g. 7 Days / 6 Nights"
                type="text"
                value={data.duration}
              />
              <span className="acc-hint">Leave blank to use duration from linked published tours.</span>
            </div>

            <div className="acc-field">
              <label className="acc-label">Destinations</label>
              <div className="acc-amenities-list">
                {data.destinationIds.map((id) => {
                  const label = destinations.find((d) => d.value === id)?.label ?? id;
                  return (
                    <span className="acc-amenity-tag" key={id}>
                      {label}
                      <button onClick={() => removeDestination(id)} type="button">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                {data.destinationIds.length === 0 && (
                  <span className="acc-amenities-empty">No destinations selected yet.</span>
                )}
              </div>
              {destinations.length > 0 ? (
                <div className="acc-amenity-suggestions">
                  <span>Add:</span>
                  {destinations
                    .filter((d) => !data.destinationIds.includes(d.value))
                    .map((d) => (
                      <button
                        className="acc-amenity-suggest"
                        key={d.value}
                        onClick={() => toggleDestination(d.value)}
                        type="button"
                      >
                        + {d.label}
                      </button>
                    ))}
                </div>
              ) : (
                <span className="acc-hint">Create destination pages first under Destinations in the admin menu.</span>
              )}
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-dest-text">Destinations label</label>
              <input
                className="acc-input"
                id="pkg-dest-text"
                onChange={(e) => set("destinationsText", e.target.value)}
                placeholder="e.g. Masai Mara · Serengeti · Ngorongoro"
                type="text"
                value={data.destinationsText}
              />
              <span className="acc-hint">Shown in the facts strip. Auto-filled from selections above when empty.</span>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-best-time">Best time to travel</label>
                <input
                  className="acc-input"
                  id="pkg-best-time"
                  onChange={(e) => set("bestTime", e.target.value)}
                  placeholder="e.g. July – October (Wildebeest Migration)"
                  type="text"
                  value={data.bestTime}
                />
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-price">Starting price (fallback)</label>
                <input
                  className="acc-input"
                  id="pkg-price"
                  onChange={(e) => set("priceText", e.target.value)}
                  placeholder="e.g. From USD 2,400 per person"
                  type="text"
                  value={data.priceText}
                />
                <span className="acc-hint">Used only when no linked published tour supplies live pricing.</span>
              </div>
            </div>

            <div className="acc-whatsapp-note">
              <strong>Linked tours &amp; route</strong>
              <p>
                The hero route pill and “Safaris Under this Package” section come from tours linked in the Trip wizard.
                Open a tour, choose this package under Package, then publish the tour.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Page content</h2>
            <p className="acc-wizard__sub">
              Overview copy, visitor FAQs, and optional lodge picks shown on the public package page.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-content">Safari overview</label>
              <textarea
                className="acc-textarea"
                id="pkg-content"
                onChange={(e) => set("content", e.target.value)}
                placeholder="Main overview text for the package page. Use “Tour Highlights” to split paragraphs if needed."
                rows={10}
                value={data.content}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-excerpt">Overview fallback</label>
              <textarea
                className="acc-textarea"
                id="pkg-excerpt"
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Optional shorter text used only when the main overview above is empty."
                rows={3}
                value={data.excerpt}
              />
            </div>

            <QaEditor
              addLabel="Add FAQ"
              items={data.faqs}
              onChange={(items) => set("faqs", items)}
              title="Frequently Asked Questions"
            />

            <div className="acc-field">
              <label className="acc-label">Featured stays (optional)</label>
              <div className="acc-amenities-list">
                {data.accommodationIds.map((id) => {
                  const label = accommodations.find((a) => a.value === id)?.label ?? id;
                  return (
                    <span className="acc-amenity-tag" key={id}>
                      {label}
                      <button onClick={() => removeAccommodation(id)} type="button">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                {data.accommodationIds.length === 0 && (
                  <span className="acc-amenities-empty">No stays linked yet.</span>
                )}
              </div>
              {accommodations.length > 0 ? (
                <div className="acc-amenity-suggestions">
                  <span>Add:</span>
                  {accommodations
                    .filter((a) => !data.accommodationIds.includes(a.value))
                    .map((a) => (
                      <button
                        className="acc-amenity-suggest"
                        key={a.value}
                        onClick={() => toggleAccommodation(a.value)}
                        type="button"
                      >
                        + {a.label}
                      </button>
                    ))}
                </div>
              ) : (
                <span className="acc-hint">Create accommodation pages first if you want to highlight lodges here.</span>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Review &amp; publish</h2>
            <p className="acc-wizard__sub">Check the summary, then save or publish the package page.</p>

            <div className="acc-review">
              <div className="acc-review__row">
                <span className="acc-review__label">Title</span>
                <span className="acc-review__value">{data.title || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Slug</span>
                <span className="acc-review__value">/safari-packages/{data.slug || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Market</span>
                <span className="acc-review__value">
                  {data.category || <em>—</em>}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Style</span>
                <span className="acc-review__value">
                  {TIER_OPTIONS.find((o) => o.value === data.packageTier)?.label ?? data.packageTier}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Duration</span>
                <span className="acc-review__value">{data.duration || <em>From linked tours</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Price</span>
                <span className="acc-review__value">{data.priceText || <em>From linked tours</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Best time</span>
                <span className="acc-review__value">{data.bestTime || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Cover image</span>
                <span className="acc-review__value">{data.imageId ? "Selected" : <em>None</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Destinations</span>
                <span className="acc-review__value">
                  {selectedDestinationLabels.length
                    ? selectedDestinationLabels.join(" · ")
                    : data.destinationsText || <em>None</em>}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Overview</span>
                <span className="acc-review__value">
                  {data.content ? `${data.content.slice(0, 80)}…` : data.excerpt ? `${data.excerpt.slice(0, 80)}…` : <em>None</em>}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">FAQs</span>
                <span className="acc-review__value">{faqCount ? `${faqCount} question(s)` : <em>None</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Featured stays</span>
                <span className="acc-review__value">
                  {selectedAccommodationLabels.length
                    ? selectedAccommodationLabels.join(" · ")
                    : <em>None</em>}
                </span>
              </div>
            </div>

            <div className="acc-publish-note">
              <strong>Ready to go?</strong>
              <p>
                Use <em>Save Draft</em> to save without publishing, or <em>Publish</em> to make this
                package live on the public site immediately.
              </p>
            </div>

            {success && (
              <div className="acc-success">
                <Check size={16} strokeWidth={3} />
                {success === "published"
                  ? "Published! The package is now live. Redirecting…"
                  : "Saved as draft. Redirecting to packages list…"}
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
              disabled={savingAs !== null || !data.title.trim()}
              onClick={() => save("draft")}
              type="button"
            >
              {savingAs === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              className="acc-btn acc-btn--publish"
              disabled={savingAs !== null || !data.title.trim()}
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
