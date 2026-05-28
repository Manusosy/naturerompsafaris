"use client";

import { CalendarDays, ImagePlus, MapPin, Save, Send } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RichTextField } from "@/components/portal/RichTextField";
import { slugify } from "@/lib/portal/format";

type Option = { label: string; value: string };
type MediaOption = {
  alt: string;
  caption: string;
  filename: string;
  id: string;
  thumbUrl: string;
  url: string;
};

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

function galleryImageIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!item || typeof item !== "object") return "";
    return relationId((item as Record<string, unknown>).image);
  }).filter(Boolean);
}

function fieldValue(document: Record<string, unknown> | undefined, key: string) {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, document);
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function booleanValue(document: Record<string, unknown> | undefined, key: string) {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, document);
  return value === true;
}

function arrayItems(value: unknown, key: string) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (!item || typeof item !== "object") return "";
    return String((item as Record<string, unknown>)[key] ?? "");
  }).filter(Boolean).join("\n");
}

function itineraryText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.map((item, index) => {
    const day = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return [
      `Day ${String(day.day ?? index + 1)}: ${String(day.title ?? "")}`,
      day.location ? `Location: ${day.location}` : "",
      day.meals ? `Meals: ${day.meals}` : "",
      day.accommodation ? `Accommodation: ${day.accommodation}` : "",
      day.activities ? `Activities: ${day.activities}` : "",
      day.experienceNotes ? `Notes: ${day.experienceNotes}` : "",
      String(day.description ?? ""),
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

function titledBlocks(value: unknown, fields: string[] = ["description"]) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return [
      String(record.title ?? ""),
      ...fields.map((field) => record[field] ? `${field}: ${String(record[field])}` : ""),
    ].filter(Boolean).join("\n");
  }).filter(Boolean).join("\n\n");
}

function parseTitledBlocks(value: string, fields: string[] = ["description"]) {
  return value
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return null;
      const record: Record<string, string> = { title: lines[0].replace(/^Title:\s*/i, "") };
      const body: string[] = [];
      for (const line of lines.slice(1)) {
        const match = line.match(/^([a-zA-Z ]+):\s*(.+)$/);
        if (match) {
          const key = match[1].trim().replace(/\s+([a-z])/g, (_, letter: string) => letter.toUpperCase());
          record[key] = match[2];
        } else {
          body.push(line);
        }
      }
      if (body.length && fields.includes("description")) record.description = body.join("\n");
      return record.title ? record : null;
    })
    .filter(Boolean);
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ item }));
}

function parseItinerary(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((block, index) => {
      const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return null;
      const firstLine = lines[0].replace(/^Day\s+\d+\s*:\s*/i, "");
      const dayMatch = lines[0].match(/^Day\s+(\d+)/i);
      const details: Record<string, string> = {};
      const description: string[] = [];

      for (const line of lines.slice(1)) {
        const match = line.match(/^(Location|Meals|Accommodation|Activities|Notes):\s*(.+)$/i);
        if (match) {
          const key = match[1].toLowerCase() === "notes" ? "experienceNotes" : match[1].toLowerCase();
          details[key] = match[2];
        } else {
          description.push(line);
        }
      }

      return {
        accommodation: details.accommodation,
        day: dayMatch ? Number(dayMatch[1]) : index + 1,
        description: description.join("\n"),
        activities: details.activities,
        experienceNotes: details.experienceNotes,
        location: details.location,
        meals: details.meals,
        title: firstLine || `Day ${index + 1}`,
      };
    })
    .filter(Boolean);
}

function parseFaq(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((block) => {
      const [question = "", ...answer] = block.split(/\r?\n/);
      const cleanQuestion = question.replace(/^Q:\s*/i, "").trim();
      const cleanAnswer = answer.join("\n").replace(/^A:\s*/i, "").trim();
      return cleanQuestion && cleanAnswer ? { question: cleanQuestion, answer: cleanAnswer } : null;
    })
    .filter(Boolean);
}

export function TripBuilder({
  destinations,
  document,
  media,
  packages,
  tripOptions = [],
}: {
  destinations: Option[];
  document?: Record<string, unknown>;
  media: MediaOption[];
  packages: Option[];
  tripOptions?: Option[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(fieldValue(document, "title"));
  const [slug, setSlug] = useState(fieldValue(document, "slug"));
  const [selectedDestinations, setSelectedDestinations] = useState(relationIds(document?.destinations));
  const [heroSubtitle, setHeroSubtitle] = useState(fieldValue(document, "heroSubtitle"));
  const [location, setLocation] = useState(fieldValue(document, "location"));
  const [startLocation, setStartLocation] = useState(fieldValue(document, "startLocation"));
  const [endLocation, setEndLocation] = useState(fieldValue(document, "endLocation"));
  const [status, setStatus] = useState(fieldValue(document, "status") || "draft");
  const [availability, setAvailability] = useState(fieldValue(document, "availability") || "on-request");
  const [days, setDays] = useState(fieldValue(document, "days"));
  const [nights, setNights] = useState(fieldValue(document, "nights"));
  const [packageId, setPackageId] = useState(relationId(document?.package) || "__none");
  const [currency, setCurrency] = useState(fieldValue(document, "budget.currency") || "USD");
  const [budgetMin, setBudgetMin] = useState(fieldValue(document, "budget.min"));
  const [budgetMax, setBudgetMax] = useState(fieldValue(document, "budget.max"));
  const [budgetDisplay, setBudgetDisplay] = useState(fieldValue(document, "budget.displayText"));
  const [galleryImages, setGalleryImages] = useState(galleryImageIds(document?.gallery));
  const [galleryAlt, setGalleryAlt] = useState(arrayItems(document?.gallery, "alt"));
  const [galleryCaption, setGalleryCaption] = useState(arrayItems(document?.gallery, "caption"));
  const [highlights, setHighlights] = useState(titledBlocks(document?.highlights));
  const [destinationStopIds, setDestinationStopIds] = useState(
    Array.isArray(document?.destinationStops)
      ? (document?.destinationStops as unknown[]).map((item) => relationId((item as Record<string, unknown>)?.destination)).filter(Boolean)
      : [],
  );
  const [destinationStopNotes, setDestinationStopNotes] = useState(arrayItems(document?.destinationStops, "description"));
  const [priceSeasons, setPriceSeasons] = useState(titledBlocks(document?.priceSeasons, ["seasonLabel", "dateRange", "budgetText", "notes", "ctaLabel"]));
  const [overview, setOverview] = useState(fieldValue(document, "overview"));
  const [included, setIncluded] = useState(arrayItems(document?.included, "item"));
  const [excluded, setExcluded] = useState(arrayItems(document?.excluded, "item"));
  const [itinerary, setItinerary] = useState(itineraryText(document?.itineraryDays));
  const [mapEmbedUrl, setMapEmbedUrl] = useState(fieldValue(document, "mapEmbedUrl"));
  const [latitude, setLatitude] = useState(fieldValue(document, "latitude"));
  const [longitude, setLongitude] = useState(fieldValue(document, "longitude"));
  const [positiveImpact, setPositiveImpact] = useState(fieldValue(document, "positiveImpact"));
  const [whyBook, setWhyBook] = useState(arrayItems(document?.whyBook, "item"));
  const [relatedTrips, setRelatedTrips] = useState(relationIds(document?.relatedTrips));
  const [discountEnabled, setDiscountEnabled] = useState(booleanValue(document, "discount.enabled"));
  const [discountLabel, setDiscountLabel] = useState(fieldValue(document, "discount.label"));
  const [discountAmount, setDiscountAmount] = useState(fieldValue(document, "discount.amountText"));
  const [featured, setFeatured] = useState(document?.featured === true);
  const [faqs, setFaqs] = useState("");
  const [directAnswers, setDirectAnswers] = useState("");
  const [seoTitle, setSeoTitle] = useState(fieldValue(document, "seo.title"));
  const [seoDescription, setSeoDescription] = useState(fieldValue(document, "seo.description"));
  const [seoKeywords, setSeoKeywords] = useState(fieldValue(document, "seo.keywords"));
  const [canonicalSlug, setCanonicalSlug] = useState(fieldValue(document, "seo.canonicalSlug"));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"idle" | "draft" | "published">("idle");

  const selectedMedia = media.filter((item) => galleryImages.includes(item.id));

  async function save(nextStatus: "draft" | "published") {
    setError("");
    setSaving(nextStatus);
    const altLines = galleryAlt.split(/\r?\n/).map((item) => item.trim());
    const captionLines = galleryCaption.split(/\r?\n/).map((item) => item.trim());
    const stopNotes = destinationStopNotes.split(/\r?\n/).map((item) => item.trim());
    const destinationStops = destinationStopIds.map((destination, index) => {
      const option = destinations.find((item) => item.value === destination);
      return {
        destination,
        description: stopNotes[index] || "",
        title: option?.label || `Stop ${index + 1}`,
      };
    });
    const response = await fetch("/api/portal/records", {
      body: JSON.stringify({
        collection: "trips",
        data: {
          availability,
          budget: {
            currency,
            displayText: budgetDisplay,
            max: budgetMax ? Number(budgetMax) : undefined,
            min: budgetMin ? Number(budgetMin) : undefined,
          },
          days: days ? Number(days) : undefined,
          destinations: selectedDestinations,
          destinationStops,
          directAnswers: parseFaq(directAnswers),
          discount: {
            amountText: discountAmount,
            enabled: discountEnabled,
            label: discountLabel,
          },
          endLocation,
          excluded: parseLines(excluded),
          faqs: parseFaq(faqs),
          featured,
          gallery: galleryImages.map((image, index) => ({
            alt: altLines[index] || media.find((item) => item.id === image)?.alt || title,
            caption: captionLines[index] || "",
            image,
          })),
          heroSubtitle,
          highlights: parseTitledBlocks(highlights),
          included: parseLines(included),
          itineraryDays: parseItinerary(itinerary),
          latitude,
          location,
          longitude,
          mapEmbedUrl,
          nights: nights ? Number(nights) : undefined,
          overview,
          package: packageId === "__none" ? undefined : packageId,
          positiveImpact,
          priceSeasons: parseTitledBlocks(priceSeasons, ["seasonLabel", "dateRange", "budgetText", "notes", "ctaLabel"]),
          relatedTrips,
          seo: {
            canonicalSlug,
            description: seoDescription,
            keywords: seoKeywords,
            title: seoTitle,
          },
          slug: slugify(slug || title),
          startLocation,
          status: nextStatus,
          title,
          whyBook: parseLines(whyBook),
        },
        id: document?.id ? String(document.id) : undefined,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setSaving("idle");

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message || "Unable to save this trip.");
      return;
    }

    router.push("/admin/trips");
    router.refresh();
  }

  return (
    <div className="trip-builder">
      <div className="portal-breadcrumb">Dashboard / Trips / {document?.id ? "Edit Trip" : "New Trip"}</div>
      <div className="article-workspace__head">
        <h2>{document?.id ? "Edit Trip" : "New Trip"}</h2>
        <div className="article-workspace__actions">
          <button className="portal-button portal-button--secondary" disabled={saving !== "idle"} onClick={() => save("draft")} type="button">
            <Save size={18} /> {saving === "draft" ? "Saving..." : "Save Draft"}
          </button>
          <button className="portal-button" disabled={saving !== "idle"} onClick={() => save("published")} type="button">
            <Send size={18} /> {saving === "published" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="trip-builder__layout">
        <main className="trip-builder__main">
          <section className="portal-panel">
            <h3>Basics</h3>
            <div className="portal-form__grid">
              <label className="portal-field is-wide">
                <span>Trip title</span>
                <input onBlur={() => setSlug((value) => value || slugify(title))} onChange={(event) => setTitle(event.target.value)} value={title} />
              </label>
              <label className="portal-field is-wide">
                <span>Hero subtitle</span>
                <textarea onChange={(event) => setHeroSubtitle(event.target.value)} rows={3} value={heroSubtitle} />
              </label>
              <label className="portal-field">
                <span>Slug</span>
                <input onChange={(event) => setSlug(event.target.value)} value={slug} />
              </label>
              <label className="portal-field">
                <span>Location</span>
                <input onChange={(event) => setLocation(event.target.value)} value={location} />
              </label>
              <label className="portal-field">
                <span>Start location</span>
                <input onChange={(event) => setStartLocation(event.target.value)} value={startLocation} />
              </label>
              <label className="portal-field">
                <span>End location</span>
                <input onChange={(event) => setEndLocation(event.target.value)} value={endLocation} />
              </label>
              <label className="portal-field">
                <span>Status</span>
                <select onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="paused">Paused</option>
                  <option value="sold-out">Sold Out</option>
                </select>
              </label>
              <label className="portal-field">
                <span>Availability</span>
                <select onChange={(event) => setAvailability(event.target.value)} value={availability}>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="on-request">On Request</option>
                </select>
              </label>
              <label className="portal-field is-wide">
                <span>Destinations</span>
                <select multiple onChange={(event) => setSelectedDestinations(Array.from(event.target.selectedOptions).map((option) => option.value))} value={selectedDestinations}>
                  {destinations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="portal-panel">
            <h3>Highlights And Route</h3>
            <label className="portal-field">
              <span>Tour highlights</span>
              <textarea
                onChange={(event) => setHighlights(event.target.value)}
                placeholder={"Big cats and classic game drives\ndescription: Morning and afternoon game drives in prime wildlife areas.\n\nCultural visit\ndescription: Optional village or community experience."}
                rows={9}
                value={highlights}
              />
            </label>
            <div className="portal-form__grid">
              <label className="portal-field">
                <span>Destination stops</span>
                <select multiple onChange={(event) => setDestinationStopIds(Array.from(event.target.selectedOptions).map((option) => option.value))} value={destinationStopIds}>
                  {destinations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="portal-field">
                <span>Stop notes, one per selected destination</span>
                <textarea onChange={(event) => setDestinationStopNotes(event.target.value)} rows={7} value={destinationStopNotes} />
              </label>
            </div>
          </section>

          <section className="portal-panel">
            <h3>Budget And Duration</h3>
            <div className="portal-form__grid">
              <label className="portal-field">
                <span>Days</span>
                <input min="0" onChange={(event) => setDays(event.target.value)} type="number" value={days} />
              </label>
              <label className="portal-field">
                <span>Nights</span>
                <input min="0" onChange={(event) => setNights(event.target.value)} type="number" value={nights} />
              </label>
              <label className="portal-field">
                <span>Currency</span>
                <input onChange={(event) => setCurrency(event.target.value)} value={currency} />
              </label>
              <label className="portal-field">
                <span>Budget minimum</span>
                <input min="0" onChange={(event) => setBudgetMin(event.target.value)} type="number" value={budgetMin} />
              </label>
              <label className="portal-field">
                <span>Budget maximum</span>
                <input min="0" onChange={(event) => setBudgetMax(event.target.value)} type="number" value={budgetMax} />
              </label>
              <label className="portal-field">
                <span>Display text</span>
                <input onChange={(event) => setBudgetDisplay(event.target.value)} placeholder="From USD 1,200 to 2,500" value={budgetDisplay} />
              </label>
            </div>
            <label className="portal-field">
              <span>Prices and seasons</span>
              <textarea
                onChange={(event) => setPriceSeasons(event.target.value)}
                placeholder={"Mid range options\nseasonLabel: High season\ndateRange: July to October\nbudgetText: Quote based on group size\nnotes: Lodge availability changes quickly.\nctaLabel: Request Quote"}
                rows={10}
                value={priceSeasons}
              />
            </label>
          </section>

          <section className="portal-panel">
            <h3>Media Carousel</h3>
            <label className="portal-field">
              <span>Images</span>
              <select multiple onChange={(event) => setGalleryImages(Array.from(event.target.selectedOptions).map((option) => option.value))} value={galleryImages}>
                {media.map((item) => <option key={item.id} value={item.id}>{item.alt || item.filename}</option>)}
              </select>
            </label>
            <div className="trip-media-strip">
              {selectedMedia.length ? selectedMedia.map((item) => (
                <article key={item.id}>
                  {item.thumbUrl ? <Image alt={item.alt || "Trip image"} height={120} src={item.thumbUrl} width={180} /> : <ImagePlus size={28} />}
                  <span>{item.alt || item.filename}</span>
                </article>
              )) : <p>Select carousel images from Media Library.</p>}
            </div>
            <div className="portal-form__grid">
              <label className="portal-field">
                <span>Alt text, one per image</span>
                <textarea onChange={(event) => setGalleryAlt(event.target.value)} rows={5} value={galleryAlt} />
              </label>
              <label className="portal-field">
                <span>Captions, one per image</span>
                <textarea onChange={(event) => setGalleryCaption(event.target.value)} rows={5} value={galleryCaption} />
              </label>
            </div>
          </section>

          <section className="portal-panel">
            <h3>Trip Content</h3>
            <label className="portal-field">
              <span>Overview</span>
              <RichTextField defaultValue={overview} media={media} name="overview" onChange={setOverview} />
            </label>
            <div className="portal-form__grid">
              <label className="portal-field">
                <span>Included</span>
                <textarea onChange={(event) => setIncluded(event.target.value)} placeholder="One item per line" rows={7} value={included} />
              </label>
              <label className="portal-field">
                <span>Excluded</span>
                <textarea onChange={(event) => setExcluded(event.target.value)} placeholder="One item per line" rows={7} value={excluded} />
              </label>
            </div>
            <label className="portal-field">
              <span>Positive impact</span>
              <RichTextField defaultValue={positiveImpact} media={media} name="positiveImpact" onChange={setPositiveImpact} />
            </label>
            <label className="portal-field">
              <span>Why book / booking security</span>
              <textarea onChange={(event) => setWhyBook(event.target.value)} placeholder="One trust or booking reason per line" rows={5} value={whyBook} />
            </label>
          </section>

          <section className="portal-panel">
            <h3>Itinerary Builder</h3>
            <textarea
              className="trip-builder__itinerary"
              onChange={(event) => setItinerary(event.target.value)}
              placeholder={"Day 1: Nairobi to Masai Mara\nLocation: Masai Mara\nMeals: Lunch, Dinner\nAccommodation: Safari lodge\nDescribe the day plan here.\n\nDay 2: Game drives\nLocation: Masai Mara\nDescribe the day plan here."}
              rows={14}
              value={itinerary}
            />
          </section>

          <section className="portal-panel">
            <h3>SEO, AEO, GEO</h3>
            <div className="portal-form__grid">
              <label className="portal-field">
                <span>SEO title</span>
                <input onChange={(event) => setSeoTitle(event.target.value)} value={seoTitle} />
              </label>
              <label className="portal-field">
                <span>Canonical slug</span>
                <input onChange={(event) => setCanonicalSlug(event.target.value)} value={canonicalSlug} />
              </label>
              <label className="portal-field is-wide">
                <span>SEO description</span>
                <textarea onChange={(event) => setSeoDescription(event.target.value)} rows={3} value={seoDescription} />
              </label>
              <label className="portal-field is-wide">
                <span>Keywords</span>
                <input onChange={(event) => setSeoKeywords(event.target.value)} value={seoKeywords} />
              </label>
              <label className="portal-field">
                <span>FAQs</span>
                <textarea onChange={(event) => setFaqs(event.target.value)} placeholder={"Question?\nAnswer here."} rows={7} value={faqs} />
              </label>
              <label className="portal-field">
                <span>Direct answers</span>
                <textarea onChange={(event) => setDirectAnswers(event.target.value)} placeholder={"Best time to visit?\nJune to October..."} rows={7} value={directAnswers} />
              </label>
            </div>
          </section>
        </main>

        <aside className="trip-builder__side">
          <section className="portal-panel">
            <h3>Publish</h3>
            <label className="article-switch">
              <span>Featured</span>
              <input checked={featured} onChange={(event) => setFeatured(event.target.checked)} type="checkbox" />
            </label>
            <label className="article-switch">
              <span>Discount</span>
              <input checked={discountEnabled} onChange={(event) => setDiscountEnabled(event.target.checked)} type="checkbox" />
            </label>
            <label className="portal-field">
              <span>Discount label</span>
              <input onChange={(event) => setDiscountLabel(event.target.value)} value={discountLabel} />
            </label>
            <label className="portal-field">
              <span>Discount amount</span>
              <input onChange={(event) => setDiscountAmount(event.target.value)} value={discountAmount} />
            </label>
          </section>

          <section className="portal-panel">
            <h3><CalendarDays size={18} /> Package</h3>
            <select onChange={(event) => setPackageId(event.target.value)} value={packageId}>
              <option value="__none">No package</option>
              {packages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </section>

          <section className="portal-panel">
            <h3><MapPin size={18} /> Map</h3>
            <label className="portal-field">
              <span>Embed URL</span>
              <input onChange={(event) => setMapEmbedUrl(event.target.value)} value={mapEmbedUrl} />
            </label>
            <div className="portal-form__grid">
              <label className="portal-field">
                <span>Latitude</span>
                <input onChange={(event) => setLatitude(event.target.value)} value={latitude} />
              </label>
              <label className="portal-field">
                <span>Longitude</span>
                <input onChange={(event) => setLongitude(event.target.value)} value={longitude} />
              </label>
            </div>
          </section>

          <section className="portal-panel">
            <h3>Related Trips</h3>
            <select multiple onChange={(event) => setRelatedTrips(Array.from(event.target.selectedOptions).map((option) => option.value))} value={relatedTrips}>
              {tripOptions.filter((item) => item.value !== document?.id).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </section>
        </aside>
      </div>

      {error ? <p className="portal-form__error">{error}</p> : null}
    </div>
  );
}
