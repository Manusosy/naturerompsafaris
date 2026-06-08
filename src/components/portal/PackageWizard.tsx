"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import { slugify } from "@/lib/portal/format";
import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";

type RelationOption = { label: string; value: string };

type WizardData = {
  title: string;
  slug: string;
  category: string;
  packageGroup: string;
  packageTier: string;
  duration: string;
  imageId: string;
  priceText: string;
  bestTime: string;
  discountEnabled: boolean;
  discountLabel: string;
  discountAmount: string;
  destinationIds: string[];
  destinationsText: string;
  itineraryId: string;
  excerpt: string;
  content: string;
  featured: boolean;
};

const STEPS = [
  { id: 1, label: "Details", description: "Title, market & type" },
  { id: 2, label: "Cover", description: "Hero image" },
  { id: 3, label: "Pricing", description: "Price & best time" },
  { id: 4, label: "Route", description: "Destinations & content" },
  { id: 5, label: "Publish", description: "Review & save" },
] as const;

const CATEGORY_OPTIONS = [
  { label: "Kenya Safaris", value: "Kenya Safaris" },
  { label: "Tanzania Safaris", value: "Tanzania Safaris" },
  { label: "Zanzibar Holidays", value: "Zanzibar Holidays" },
  { label: "Kenya & Tanzania Combined", value: "Kenya Tanzania Combined Safaris" },
  { label: "Kenya Adventure", value: "Kenya Adventure Safaris" },
  { label: "Tanzania Adventure", value: "Tanzania Adventure Safaris" },
];

const PACKAGE_GROUP_OPTIONS = [
  { label: "Economy Private Safaris", value: "economy-private" },
  { label: "Group Joining Safaris", value: "group-joining" },
  { label: "Kenya Lodge Safaris", value: "kenya-lodge" },
  { label: "Kenya Fly In Safaris", value: "kenya-fly-in" },
  { label: "Tanzania Lodge Safaris", value: "tanzania-lodge" },
  { label: "Tanzania Budget Camping Safaris", value: "tanzania-budget-camping" },
  { label: "Kenya & Tanzania Lodge Safaris", value: "combined-lodge" },
  { label: "Combined Private Economy Safaris", value: "combined-private-economy" },
  { label: "Combined Group Joining Safaris", value: "combined-group-joining" },
  { label: "Combined Lodge Safari", value: "combined-lodge-safari" },
  { label: "Combined Budget Safari", value: "combined-budget" },
  { label: "Mount Kenya Climbing", value: "mount-kenya-climbing" },
  { label: "Mount Kilimanjaro Climbing", value: "kilimanjaro-climbing" },
  { label: "Nairobi Excursion", value: "nairobi-excursion" },
  { label: "Day Trips", value: "day-trips" },
  { label: "Beach Extension", value: "beach-extension" },
  { label: "4x4 Safaris", value: "4x4-safaris" },
  { label: "Short Safaris", value: "short-safaris" },
];

const GROUPS_BY_CATEGORY: Record<string, string[]> = {
  "Kenya Safaris": [
    "economy-private", "group-joining", "kenya-lodge", "kenya-fly-in", "beach-extension",
    "4x4-safaris", "short-safaris", "mount-kenya-climbing", "nairobi-excursion", "day-trips",
  ],
  "Tanzania Safaris": [
    "tanzania-lodge", "tanzania-budget-camping", "kilimanjaro-climbing", "beach-extension",
    "short-safaris", "day-trips", "economy-private", "group-joining",
  ],
  "Zanzibar Holidays": ["beach-extension"],
  "Kenya Tanzania Combined Safaris": [
    "combined-lodge", "combined-private-economy", "combined-group-joining",
    "combined-lodge-safari", "combined-budget",
  ],
  "Kenya Adventure Safaris": [
    "mount-kenya-climbing", "nairobi-excursion", "day-trips", "4x4-safaris", "short-safaris",
  ],
  "Tanzania Adventure Safaris": ["kilimanjaro-climbing", "day-trips", "4x4-safaris"],
};

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
  const discount =
    doc.discount && typeof doc.discount === "object"
      ? (doc.discount as Record<string, unknown>)
      : {};

  return {
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    category: String(doc.category ?? "Kenya Safaris"),
    packageGroup: String(doc.packageGroup ?? "economy-private"),
    packageTier: String(doc.packageTier ?? "mid-range"),
    duration: String(doc.duration ?? ""),
    imageId: relationId(doc.image),
    priceText: String(doc.priceText ?? ""),
    bestTime: String(doc.bestTime ?? ""),
    discountEnabled: discount.enabled === true,
    discountLabel: String(discount.label ?? ""),
    discountAmount: String(discount.amountText ?? ""),
    destinationIds: relationIds(doc.destinations),
    destinationsText: String(doc.destinationsText ?? ""),
    itineraryId: relationId(doc.itinerary),
    excerpt: String(doc.excerpt ?? ""),
    content: String(doc.content ?? ""),
    featured: doc.featured === true,
  };
}

export function PackageWizard({
  destinations,
  document,
  itineraries,
  media,
}: {
  destinations: RelationOption[];
  document?: Record<string, unknown>;
  itineraries: RelationOption[];
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
          category: "Kenya Safaris",
          packageGroup: "economy-private",
          packageTier: "mid-range",
          duration: "",
          imageId: "",
          priceText: "",
          bestTime: "",
          discountEnabled: false,
          discountLabel: "",
          discountAmount: "",
          destinationIds: [],
          destinationsText: "",
          itineraryId: "",
          excerpt: "",
          content: "",
          featured: false,
        },
  );
  const [savingAs, setSavingAs] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"draft" | "published" | null>(null);

  const groupOptions = useMemo(() => {
    const allowed = GROUPS_BY_CATEGORY[data.category] ?? [];
    return PACKAGE_GROUP_OPTIONS.filter((o) => allowed.includes(o.value));
  }, [data.category]);

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function handleTitleChange(val: string) {
    set("title", val);
    if (!isEdit || !data.slug) {
      set("slug", slugify(val));
    }
  }

  function handleCategoryChange(category: string) {
    const allowed = GROUPS_BY_CATEGORY[category] ?? [];
    const nextGroup = allowed.includes(data.packageGroup) ? data.packageGroup : (allowed[0] ?? "economy-private");
    setData((d) => ({ ...d, category, packageGroup: nextGroup }));
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
      packageGroup: data.packageGroup,
      packageTier: data.packageTier,
      duration: data.duration.trim(),
      priceText: data.priceText.trim(),
      bestTime: data.bestTime.trim(),
      destinationsText: data.destinationsText.trim(),
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
      featured: data.featured,
      status: targetStatus,
      discount: {
        enabled: data.discountEnabled,
        label: data.discountLabel.trim(),
        amountText: data.discountAmount.trim(),
      },
    };

    if (data.imageId) payload.image = toPayloadMediaId(data.imageId);
    if (data.destinationIds.length) {
      payload.destinations = data.destinationIds.map(toPayloadMediaId);
    }
    if (data.itineraryId) payload.itinerary = toPayloadMediaId(data.itineraryId);

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
            <h2 className="acc-wizard__heading">Package Details</h2>
            <p className="acc-wizard__sub">
              Title, URL, market, safari type and duration. Start with where the package is sold and what kind of trip it is.
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  value={data.category}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="acc-hint">Kenya, Tanzania, Zanzibar, or a combined route.</span>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-tier">Package Tier</label>
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
              </div>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-group">Safari Type</label>
                <select
                  className="acc-select"
                  id="pkg-group"
                  onChange={(e) => set("packageGroup", e.target.value)}
                  value={data.packageGroup}
                >
                  {groupOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="pkg-duration">Duration (fallback)</label>
                <input
                  className="acc-input"
                  id="pkg-duration"
                  onChange={(e) => set("duration", e.target.value)}
                  placeholder="e.g. 7 Days / 6 Nights — auto-filled from linked trips when empty"
                  type="text"
                  value={data.duration}
                />
                <span className="acc-hint">Leave blank to use duration from linked published trips.</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Cover Image</h2>
            <p className="acc-wizard__sub">
              The hero image shown on package cards and the detail page header.
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
            <h2 className="acc-wizard__heading">Pricing & Timing</h2>
            <p className="acc-wizard__sub">
              Optional fallback text for listing cards. When published trips are linked to this package, their live pricing and duration appear automatically on the public site.
            </p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-price">Starting Price Text (fallback)</label>
              <input
                className="acc-input"
                id="pkg-price"
                onChange={(e) => set("priceText", e.target.value)}
                placeholder="e.g. From USD 2,400 per person — used only when no linked trip exists"
                type="text"
                value={data.priceText}
              />
              <span className="acc-hint">Shown on cards only when no published trip is linked to this package.</span>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-best-time">Best Time to Travel</label>
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
              <label className="acc-label acc-check-label">
                <input
                  checked={data.discountEnabled}
                  onChange={(e) => set("discountEnabled", e.target.checked)}
                  type="checkbox"
                />
                <span>Show promotional discount on listing card</span>
              </label>
            </div>

            {data.discountEnabled && (
              <div className="acc-row">
                <div className="acc-field">
                  <label className="acc-label" htmlFor="pkg-discount-label">Discount Label</label>
                  <input
                    className="acc-input"
                    id="pkg-discount-label"
                    onChange={(e) => set("discountLabel", e.target.value)}
                    placeholder="e.g. Early Bird Offer"
                    type="text"
                    value={data.discountLabel}
                  />
                </div>
                <div className="acc-field">
                  <label className="acc-label" htmlFor="pkg-discount-amount">Discount Amount</label>
                  <input
                    className="acc-input"
                    id="pkg-discount-amount"
                    onChange={(e) => set("discountAmount", e.target.value)}
                    placeholder="e.g. 10% off"
                    type="text"
                    value={data.discountAmount}
                  />
                </div>
              </div>
            )}

            <div className="acc-whatsapp-note">
              <strong>Enquiries via WhatsApp</strong>
              <p>Guests enquire about packages directly via WhatsApp. No booking or payment is processed on this website.</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Route & Description</h2>
            <p className="acc-wizard__sub">
              Link the parks and regions visited, then write the card summary and full package description.
            </p>

            <div className="acc-field">
              <label className="acc-label">Destinations Visited</label>
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
              <label className="acc-label" htmlFor="pkg-dest-text">Destinations Label (cards)</label>
              <input
                className="acc-input"
                id="pkg-dest-text"
                onChange={(e) => set("destinationsText", e.target.value)}
                placeholder="e.g. Masai Mara · Serengeti · Ngorongoro"
                type="text"
                value={data.destinationsText}
              />
              <span className="acc-hint">Short label shown on package cards. Auto-filled from selections above.</span>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-itinerary">Linked Itinerary</label>
              <select
                className="acc-select"
                id="pkg-itinerary"
                onChange={(e) => set("itineraryId", e.target.value)}
                value={data.itineraryId}
              >
                <option value="">— None —</option>
                {itineraries.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-excerpt">Card Summary</label>
              <textarea
                className="acc-textarea"
                id="pkg-excerpt"
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="A short compelling summary for listing cards and search results…"
                rows={4}
                value={data.excerpt}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="pkg-content">Full Description</label>
              <textarea
                className="acc-textarea"
                id="pkg-content"
                onChange={(e) => set("content", e.target.value)}
                placeholder="Full package description for the detail page. Supports basic markdown."
                rows={10}
                value={data.content}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Review & Publish</h2>
            <p className="acc-wizard__sub">Check the summary, set visibility, then save.</p>

            <div className="acc-field acc-publish-row">
              <label className="acc-label acc-check-label">
                <input
                  checked={data.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  type="checkbox"
                />
                <span>Feature this package on the homepage and listing page</span>
              </label>
            </div>

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
                  {CATEGORY_OPTIONS.find((o) => o.value === data.category)?.label ?? data.category}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Safari Type</span>
                <span className="acc-review__value">
                  {PACKAGE_GROUP_OPTIONS.find((o) => o.value === data.packageGroup)?.label ?? data.packageGroup}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Tier</span>
                <span className="acc-review__value">
                  {TIER_OPTIONS.find((o) => o.value === data.packageTier)?.label ?? data.packageTier}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Duration</span>
                <span className="acc-review__value">{data.duration || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Price</span>
                <span className="acc-review__value">{data.priceText || <em>Not set</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Best Time</span>
                <span className="acc-review__value">{data.bestTime || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Cover Image</span>
                <span className="acc-review__value">{data.imageId ? "Selected" : <em>None</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Destinations</span>
                <span className="acc-review__value">
                  {selectedDestinationLabels.length
                    ? selectedDestinationLabels.join(" · ")
                    : <em>None</em>}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Featured</span>
                <span className="acc-review__value">{data.featured ? "Yes" : "No"}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Summary</span>
                <span className="acc-review__value">
                  {data.excerpt ? `${data.excerpt.slice(0, 80)}…` : <em>None</em>}
                </span>
              </div>
            </div>

            <div className="acc-publish-note">
              <strong>Ready to go?</strong>
              <p>
                Use <em>Save Draft</em> to save without publishing, or <em>Publish</em> to make this
                package live on the public safari packages page immediately.
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
