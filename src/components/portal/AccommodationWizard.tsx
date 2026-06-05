"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus, X, AlertCircle } from "lucide-react";

import { slugify } from "@/lib/portal/format";
import { MediaPickerField, type PortalMediaOption } from "@/components/portal/MediaPickerField";

type WizardData = {
  country: string;
  name: string;
  slug: string;
  type: string;
  location: string;
  price: string;
  priceText: string;
  availability: string;
  availabilityNote: string;
  coverPhotoId: string;
  galleryPhotoIds: string[];
  youtubeUrl: string;
  description: string;
  amenities: string[];
};

const STEPS = [
  { id: 1, label: "Details", description: "Name, type & location" },
  { id: 2, label: "Media", description: "Photos & video" },
  { id: 3, label: "Pricing", description: "Cost & availability" },
  { id: 4, label: "Description", description: "Write-up & amenities" },
  { id: 5, label: "Publish", description: "Review & save" },
] as const;

const TYPE_OPTIONS = [
  { label: "Safari Lodge", value: "lodge" },
  { label: "Tented Camp", value: "camp" },
  { label: "Airbnb / Apartment", value: "airbnb" },
  { label: "Hotel", value: "hotel" },
  { label: "Boutique", value: "boutique" },
];

const COUNTRY_OPTIONS = [
  { label: "Kenya", value: "kenya" },
  { label: "Tanzania", value: "tanzania" },
];

const AVAILABILITY_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Limited Availability", value: "limited" },
  { label: "On Request", value: "on-request" },
  { label: "Unavailable", value: "unavailable" },
];

const AMENITY_SUGGESTIONS = [
  "WiFi", "Swimming Pool", "Air Conditioning", "En-Suite Bathroom", "Restaurant",
  "Bar / Lounge", "Guided Game Drives", "Bush Walks", "Laundry Service",
  "Airport Transfers", "Sundowner Drinks", "Spa & Wellness", "Kids Programme",
  "Campfire / Boma", "Solar Power", "Hot Water", "Mosquito Nets",
];

function getYouTubeEmbedId(url: string): string | null {
  if (!url) return null;
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match?.[1]) return match[1];
  }
  return null;
}

function toPayloadMediaId(id: string) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && String(numericId) === id ? numericId : id;
}

function buildFromDoc(doc: Record<string, unknown>): WizardData {
  const photos = Array.isArray(doc.photos) ? (doc.photos as Array<Record<string, unknown>>) : [];
  const coverPhoto = photos[0];
  const galleryPhotos = photos.slice(1);
  const rawAmenities = Array.isArray(doc.amenities)
    ? (doc.amenities as Array<Record<string, unknown>>).map((a) => String(a.amenity ?? "")).filter(Boolean)
    : [];

  return {
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    country: String(doc.country ?? "kenya"),
    type: String(doc.type ?? "lodge"),
    location: String(doc.location ?? ""),
    price: doc.price != null ? String(doc.price) : "",
    priceText: String(doc.priceText ?? ""),
    availability: String(doc.availability ?? "on-request"),
    availabilityNote: String(doc.availabilityNote ?? ""),
    coverPhotoId: coverPhoto ? String(coverPhoto.id ?? coverPhoto) : "",
    galleryPhotoIds: galleryPhotos.map((p) => String(p.id ?? p)).filter(Boolean),
    youtubeUrl: String(doc.youtubeUrl ?? ""),
    description: String(doc.description ?? ""),
    amenities: rawAmenities,
  };
}

export function AccommodationWizard({
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
    document ? buildFromDoc(document) : {
      name: "",
      slug: "",
      country: "kenya",
      type: "lodge",
      location: "",
      price: "",
      priceText: "",
      availability: "on-request",
      availabilityNote: "",
      coverPhotoId: "",
      galleryPhotoIds: [],
      youtubeUrl: "",
      description: "",
      amenities: [],
    }
  );
  const [newAmenity, setNewAmenity] = useState("");
  const [savingAs, setSavingAs] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"draft" | "published" | null>(null);

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function handleNameChange(val: string) {
    set("name", val);
    if (!isEdit || !data.slug) {
      set("slug", slugify(val));
    }
  }

  function addAmenity(val: string) {
    const trimmed = val.trim();
    if (!trimmed || data.amenities.includes(trimmed)) return;
    set("amenities", [...data.amenities, trimmed]);
    setNewAmenity("");
  }

  function removeAmenity(a: string) {
    set("amenities", data.amenities.filter((x) => x !== a));
  }

  function validateBeforeSave() {
    if (!data.name.trim()) return "Property name is required.";
    if (!data.location.trim()) return "Location is required.";
    const nextSlug = (data.slug || slugify(data.name)).trim();
    if (!nextSlug) return "URL slug is required.";
    if (data.price && !Number.isFinite(Number(data.price))) {
      return "Price must be a valid number.";
    }
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

    const allPhotoIds = [data.coverPhotoId, ...data.galleryPhotoIds].filter(Boolean);
    const finalSlug = data.slug || slugify(data.name);
    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      slug: finalSlug,
      country: data.country,
      type: data.type,
      location: data.location.trim(),
      price: data.price ? Number(data.price) : undefined,
      priceText: data.priceText.trim(),
      availability: data.availability,
      availabilityNote: data.availabilityNote.trim(),
      youtubeUrl: data.youtubeUrl.trim(),
      description: data.description.trim(),
      amenities: data.amenities.map((a) => ({ amenity: a })),
      status: targetStatus,
    };
    if (allPhotoIds.length > 0) {
      payload.photos = allPhotoIds.map(toPayloadMediaId);
    }

    const body: Record<string, unknown> = {
      collection: "accommodations",
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
      router.push("/admin/accommodations");
      router.refresh();
    }, 1800);
  }

  const youtubeId = getYouTubeEmbedId(data.youtubeUrl);

  const stepValid: Record<number, boolean> = {
    1: !!data.name.trim() && !!data.location.trim(),
    2: true,
    3: true,
    4: true,
    5: true,
  };

  return (
    <div className="acc-wizard">
      {/* Step Indicator */}
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

      {/* Step Content */}
      <div className="acc-wizard__body">
        {/* ─── Step 1: Details ─── */}
        {step === 1 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Basic Details</h2>
            <p className="acc-wizard__sub">Name, type and location of the property.</p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="acc-name">Property Name <span className="acc-req">*</span></label>
              <input
                className="acc-input"
                id="acc-name"
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Olare Motorogi Tented Camp"
                type="text"
                value={data.name}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label" htmlFor="acc-slug">URL Slug <span className="acc-req">*</span></label>
              <div className="acc-slug-wrap">
                <span className="acc-slug-prefix">/accommodations/</span>
                <input
                  className="acc-input acc-input--slug"
                  id="acc-slug"
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  placeholder="olare-motorogi-tented-camp"
                  type="text"
                  value={data.slug}
                />
              </div>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-type">Property Type</label>
                <select
                  className="acc-select"
                  id="acc-type"
                  onChange={(e) => set("type", e.target.value)}
                  value={data.type}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-country">Country <span className="acc-req">*</span></label>
                <select
                  className="acc-select"
                  id="acc-country"
                  onChange={(e) => set("country", e.target.value)}
                  value={data.country}
                >
                  {COUNTRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="acc-field">
                <label className="acc-label" htmlFor="acc-location">Location <span className="acc-req">*</span></label>
                <input
                  className="acc-input"
                  id="acc-location"
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Masai Mara, Kenya"
                  type="text"
                  value={data.location}
                />
              </div>
          </div>
        )}

        {/* ─── Step 2: Media ─── */}
        {step === 2 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Photos & Video</h2>
            <p className="acc-wizard__sub">Select a cover photo, add gallery images, and optionally link a YouTube video. You can upload new photos directly.</p>

            <div className="acc-media-section" style={{ marginBottom: 24 }}>
              <MediaPickerField
                hasMany={false}
                initialValues={data.coverPhotoId ? [data.coverPhotoId] : []}
                label="Cover Photo"
                onChange={(ids) => set("coverPhotoId", ids[0] ?? "")}
                options={media}
              />
            </div>

            <div className="acc-media-section" style={{ marginBottom: 24 }}>
              <MediaPickerField
                hasMany
                initialValues={data.galleryPhotoIds}
                label="Gallery Photos"
                onChange={(ids) => set("galleryPhotoIds", ids)}
                options={media}
              />
            </div>

            <div className="acc-field" style={{ marginTop: 8 }}>
              <label className="acc-label" htmlFor="acc-youtube">YouTube Video URL</label>
              <input
                className="acc-input"
                id="acc-youtube"
                onChange={(e) => set("youtubeUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                type="url"
                value={data.youtubeUrl}
              />
              {youtubeId && (
                <div className="acc-youtube-preview">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube preview"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 3: Pricing ─── */}
        {step === 3 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Pricing & Availability</h2>
            <p className="acc-wizard__sub">Set the starting price and current availability. Bookings are made via WhatsApp — no payment is taken on this platform.</p>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-price">Price Per Night (USD)</label>
                <div className="acc-price-wrap">
                  <span className="acc-price-prefix">$</span>
                  <input
                    className="acc-input acc-input--price"
                    id="acc-price"
                    min="0"
                    onChange={(e) => {
                      set("price", e.target.value);
                      if (e.target.value && !data.priceText) {
                        set("priceText", `From $${e.target.value} / night`);
                      }
                    }}
                    placeholder="250"
                    step="1"
                    type="number"
                    value={data.price}
                  />
                </div>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-price-text">Display Text</label>
                <input
                  className="acc-input"
                  id="acc-price-text"
                  onChange={(e) => set("priceText", e.target.value)}
                  placeholder="e.g. From $250 / night"
                  type="text"
                  value={data.priceText}
                />
                <span className="acc-hint">This text is shown on the public page as-is.</span>
              </div>
            </div>

            <div className="acc-row">
              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-avail">Availability</label>
                <select
                  className="acc-select"
                  id="acc-avail"
                  onChange={(e) => set("availability", e.target.value)}
                  value={data.availability}
                >
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-avail-note">Availability Note</label>
                <input
                  className="acc-input"
                  id="acc-avail-note"
                  onChange={(e) => set("availabilityNote", e.target.value)}
                  placeholder="e.g. Peak season: Dec – Mar"
                  type="text"
                  value={data.availabilityNote}
                />
              </div>
            </div>

            <div className="acc-whatsapp-note">
              <strong>Enquiries via WhatsApp</strong>
              <p>Guests will enquire about this accommodation directly via WhatsApp from the public page. No booking or payment is processed on this website.</p>
            </div>
          </div>
        )}

        {/* ─── Step 4: Description & Amenities ─── */}
        {step === 4 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Description & Amenities</h2>
            <p className="acc-wizard__sub">Describe the property and list its key amenities.</p>

            <div className="acc-field">
              <label className="acc-label" htmlFor="acc-desc">Description</label>
              <textarea
                className="acc-textarea"
                id="acc-desc"
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the property — its setting, style, wildlife, unique experiences…"
                rows={10}
                value={data.description}
              />
            </div>

            <div className="acc-field">
              <label className="acc-label">Amenities</label>
              <div className="acc-amenities-list">
                {data.amenities.map((a) => (
                  <span className="acc-amenity-tag" key={a}>
                    {a}
                    <button onClick={() => removeAmenity(a)} type="button"><X size={12} /></button>
                  </span>
                ))}
                {data.amenities.length === 0 && (
                  <span className="acc-amenities-empty">No amenities added yet.</span>
                )}
              </div>

              <div className="acc-amenity-add">
                <input
                  className="acc-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity(newAmenity);
                    }
                  }}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Type an amenity and press Enter…"
                  type="text"
                  value={newAmenity}
                />
                <button
                  className="acc-amenity-btn"
                  disabled={!newAmenity.trim()}
                  onClick={() => addAmenity(newAmenity)}
                  type="button"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              <div className="acc-amenity-suggestions">
                <span>Quick add:</span>
                {AMENITY_SUGGESTIONS.filter((s) => !data.amenities.includes(s)).map((s) => (
                  <button
                    className="acc-amenity-suggest"
                    key={s}
                    onClick={() => addAmenity(s)}
                    type="button"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 5: Publish ─── */}
        {step === 5 && (
          <div className="acc-wizard__panel">
            <h2 className="acc-wizard__heading">Review & Publish</h2>
            <p className="acc-wizard__sub">Everything looks good? Set the status and save.</p>

            <div className="acc-review">
              <div className="acc-review__row">
                <span className="acc-review__label">Name</span>
                <span className="acc-review__value">{data.name || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Slug</span>
                <span className="acc-review__value">/accommodations/{data.slug || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Type</span>
                <span className="acc-review__value">{TYPE_OPTIONS.find((o) => o.value === data.type)?.label ?? data.type}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Country</span>
                <span className="acc-review__value">{COUNTRY_OPTIONS.find((o) => o.value === data.country)?.label ?? data.country}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Location</span>
                <span className="acc-review__value">{data.location || <em>—</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Price</span>
                <span className="acc-review__value">{data.priceText || (data.price ? `$${data.price} / night` : <em>Not set</em>)}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Availability</span>
                <span className="acc-review__value">{AVAILABILITY_OPTIONS.find((o) => o.value === data.availability)?.label ?? data.availability}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Photos</span>
                <span className="acc-review__value">
                  {[data.coverPhotoId, ...data.galleryPhotoIds].filter(Boolean).length} photo(s) selected
                  {data.coverPhotoId ? "" : " (no cover set)"}
                </span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Video</span>
                <span className="acc-review__value">{youtubeId ? "YouTube video linked" : <em>None</em>}</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Amenities</span>
                <span className="acc-review__value">{data.amenities.length} amenity(ies)</span>
              </div>
              <div className="acc-review__row">
                <span className="acc-review__label">Description</span>
                <span className="acc-review__value">{data.description ? `${data.description.slice(0, 80)}…` : <em>None</em>}</span>
              </div>
            </div>

            <div className="acc-publish-note">
              <strong>Ready to go?</strong>
              <p>
                Use <em>Save Draft</em> to save without publishing, or <em>Publish</em> to make this
                property live on the public accommodations page immediately.
              </p>
            </div>

            {success && (
              <div className="acc-success">
                <Check size={16} strokeWidth={3} />
                {success === "published"
                  ? "Published! The property is now live on the website. Redirecting…"
                  : "Saved as draft. Redirecting to accommodations list…"}
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

      {/* Navigation Buttons */}
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
              disabled={savingAs !== null || !data.name.trim() || !data.location.trim()}
              onClick={() => save("draft")}
              type="button"
            >
              {savingAs === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              className="acc-btn acc-btn--publish"
              disabled={savingAs !== null || !data.name.trim() || !data.location.trim()}
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
