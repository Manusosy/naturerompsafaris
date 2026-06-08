"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  ArrowRight,
  CircleX,
  Crown,
  Gem,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { TripInquiryForm, type TripInquiryPrefill } from "@/components/TripInquiryForm";
import { WhatsappIcon } from "@/components/SocialBrandIcons";
import { TripRouteMap } from "@/components/TripRouteMap";
import { TRIP_PRICE_INQUIRY_LABEL } from "@/lib/trip-pricing";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { TIER_MATRIX_CLASS } from "@/lib/trip-labels";
import {
  buildTierPriceMatrices,
  formatMatrixPrice,
  hasMatrixPricing,
  type PriceSeasonRow,
} from "@/lib/trip-pricing-table";

type TripImage = {
  alt: string;
  caption?: string;
  src: string;
};

type ItineraryDay = {
  accommodation?: string;
  activities?: string;
  day?: number;
  description?: string;
  experienceNotes?: string;
  image?: string;
  location?: string;
  meals?: string;
  title?: string;
};

type ReviewSettings = {
  bookingSecurityHeading?: string;
  bookingSecurityItems?: string[];
  bookingSecurityText?: string;
  heading?: string;
  partnerLogos?: TripImage[];
  trustindexEmbed?: string;
};

type Highlight = {
  alt?: string;
  description?: string;
  image?: string;
  title?: string;
};

type DestinationStop = Highlight & {
  slug?: string;
};

type PriceSeason = PriceSeasonRow;

type OptionalExperience = {
  description?: string;
  priceNote?: string;
  title?: string;
};

type AccommodationOption = {
  name?: string;
  note?: string;
};

type RelatedTrip = {
  budgetText?: string;
  image?: string;
  slug?: string;
  title?: string;
};

export type TripDetailData = {
  accommodationOptions?: AccommodationOption[];
  accommodationSummary?: string;
  availability?: string;
  bestFor?: string[];
  bestTimeToVisit?: string;
  budgetText?: string;
  days?: number;
  departurePoint?: string;
  destinationStops?: DestinationStop[];
  directAnswers?: Array<{ answer?: string; question?: string }>;
  endLocation?: string;
  excluded?: string[];
  faqs?: Array<{ answer?: string; question?: string }>;
  gallery: TripImage[];
  heroEyebrow?: string;
  heroImage?: TripImage;
  heroSubtitle?: string;
  highlights?: Highlight[];
  id?: string;
  included?: string[];
  itineraryDays?: ItineraryDay[];
  location?: string;
  mapEmbedUrl?: string;
  nights?: number;
  optionalExperiences?: OptionalExperience[];
  overview?: string;
  linkedPackage?: { slug: string; title: string };
  packageTier?: string;
  positiveImpact?: string;
  priceSeasons?: PriceSeason[];
  quoteIntro?: string;
  relatedTrips?: RelatedTrip[];
  reviewSettings?: ReviewSettings;
  routeLabel?: string;
  routeWaypoints?: Array<{ label?: string; notes?: string; place: string }>;
  slug: string;
  startLocation?: string;
  title: string;
  trustindexEmbedOverride?: string;
  whyBook?: string[];
};

const baseSectionLinks = [
  { id: "overview", label: "Overview" },
  { id: "where", label: "Where you'll go" },
  { id: "itinerary", label: "Itinerary" },
  { id: "prices", label: "Prices" },
  { id: "included", label: "Included" },
  { id: "faqs", label: "FAQs" },
  { id: "quote", label: "Inquiry" },
];

const tierLabels: Record<string, string> = {
  budget: "Budget",
  "mid-range": "Mid Range",
  luxury: "Luxury",
  "high-end": "High End",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flash-trip__section-title">
      <span>{children}</span>
    </h2>
  );
}

function TierIcon({ tier }: { tier: string }) {
  if (tier === "luxury") return <Crown aria-hidden size={20} />;
  if (tier === "high-end") return <Gem aria-hidden size={20} />;
  if (tier === "budget") return <Wallet aria-hidden size={20} />;
  return <Sparkles aria-hidden size={20} />;
}

function priceText(item: PriceSeason) {
  if (item.displayText) return item.displayText;
  if (item.budgetText) return item.budgetText;
  if (item.min && item.max) return `${item.currency || "USD"} ${item.min.toLocaleString()} - ${item.max.toLocaleString()}`;
  if (item.min) return `From ${item.currency || "USD"} ${item.min.toLocaleString()}`;
  return "On request";
}

function scrollToQuote() {
  document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalizeBreadcrumbLabel(value: string) {
  return value.toLowerCase().replace(/[\s\-_]+/g, " ").trim();
}

export function TripDetailExperience({
  trip,
  whatsappHref,
}: {
  trip: TripDetailData;
  whatsappHref?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedDay, setExpandedDay] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [inquiryPrefill, setInquiryPrefill] = useState<TripInquiryPrefill | undefined>();
  const [selectedInquiryKey, setSelectedInquiryKey] = useState<string | null>(null);
  const images = trip.gallery.length ? trip.gallery : [{ src: "/assets/img/banner1.webp", alt: trip.title }];
  const heroImage = trip.heroImage?.src ? trip.heroImage : images[activeImage] || images[0];
  const routeText = trip.routeLabel || [trip.startLocation, trip.endLocation].filter(Boolean).join(" to ");
  const durationText = trip.days || trip.nights ? `${trip.days || "-"} days / ${trip.nights || "-"} nights` : "Custom duration";
  const sectionLinks = useMemo(
    () => baseSectionLinks.filter((section) => section.id !== "faqs" || Boolean(trip.faqs?.length)),
    [trip.faqs?.length],
  );
  const priceMatrices = useMemo(() => {
    if (trip.priceSeasons?.length && hasMatrixPricing(trip.priceSeasons)) {
      return buildTierPriceMatrices(trip.priceSeasons);
    }
    return [];
  }, [trip.priceSeasons]);

  const flatPriceGroups = useMemo(() => {
    const source = trip.priceSeasons?.length
      ? trip.priceSeasons
      : [{ title: "Custom Quote", tier: trip.packageTier || "budget", displayText: trip.budgetText || "On request", notes: "Pricing depends on travel dates, party size, and accommodation preference." }];
    return source.reduce<Record<string, PriceSeason[]>>((groups, item) => {
      const key = item.tier || trip.packageTier || "budget";
      groups[key] = [...(groups[key] || []), item];
      return groups;
    }, {});
  }, [trip.budgetText, trip.packageTier, trip.priceSeasons]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveImage((value) => (value + 1) % images.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    const handleScroll = () => {
      const navOffset = navRef.current?.offsetHeight || 0;
      const current = sectionLinks.findLast((section) => {
        const element = document.getElementById(section.id);
        return element ? element.getBoundingClientRect().top <= navOffset + 120 : false;
      });
      if (current) setActiveSection(current.id);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionLinks]);

  function handleNav(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    setActiveSection(id);
    const navOffset = navRef.current?.offsetHeight || 0;
    const element = document.getElementById(id);
    if (!element) return;
    window.scrollTo({ top: element.offsetTop - navOffset - 24, behavior: "smooth" });
  }

  function pricingInquiryKey(context: TripInquiryPrefill) {
    return `${context.tier || ""}::${context.season || ""}`;
  }

  function inquireFromPricing(context: TripInquiryPrefill) {
    setInquiryPrefill(context);
    setSelectedInquiryKey(pricingInquiryKey(context));
    scrollToQuote();
  }

  const routeStops = [
    trip.startLocation,
    ...(trip.routeWaypoints?.map((stop) => stop.place) || []),
    trip.endLocation,
  ].filter(Boolean).filter((stop, index, list) => list.indexOf(stop) === index);
  const displayRouteStops = routeStops.length ? routeStops : routeText ? [routeText] : [];
  const linkableDestinations =
    trip.destinationStops?.filter((item) => item.slug) ?? [];
  const showPackageCrumb =
    Boolean(trip.linkedPackage) &&
    normalizeBreadcrumbLabel(trip.linkedPackage?.title ?? "") !== normalizeBreadcrumbLabel(trip.title);
  const includedItems = trip.included?.length
    ? trip.included
    : ["Safari planning and local support", "Quoted ground services"];
  const excludedItems = trip.excluded?.length
    ? trip.excluded
    : ["International flights", "Visa fees and personal expenses"];

  return (
    <section className="flash-trip">
      <header className="flash-trip__hero">
        <Image
          alt={heroImage.alt || trip.title}
          className="flash-trip__hero-image"
          fill
          priority
          src={heroImage.src}
          style={{ objectFit: "cover" }}
        />
        <div className="flash-trip__hero-overlay" />
        <div className="container flash-trip__hero-content">
          <nav className="flash-trip__breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <Link href="/safari-packages">Safari Tours</Link>
            {showPackageCrumb && trip.linkedPackage ? (
              <>
                <ChevronRight size={14} />
                <Link href={`/safari-packages/${trip.linkedPackage.slug}`}>{trip.linkedPackage.title}</Link>
              </>
            ) : null}
            <ChevronRight size={14} />
            <span>{trip.title}</span>
          </nav>
          <p className="flash-trip__eyebrow">{trip.heroEyebrow || "Nature Romp Safaris"}</p>
          <h1>{trip.title}</h1>
          {trip.heroSubtitle ? <p className="flash-trip__subtitle">{trip.heroSubtitle}</p> : null}
          <div className="flash-trip__facts">
            <span><MapPin size={16} /> {routeText || trip.location || "Kenya and Tanzania"}</span>
            <span><CalendarDays size={16} /> {durationText}</span>
            <span><Users size={16} /> {trip.budgetText || TRIP_PRICE_INQUIRY_LABEL}</span>
          </div>
        </div>
      </header>

      <nav className="flash-trip__section-nav" ref={navRef} aria-label="Trip sections">
        <div className="container">
          {sectionLinks.map((section) => (
            <a
              className={activeSection === section.id ? "is-active" : ""}
              href={`#${section.id}`}
              key={section.id}
              onClick={(event) => handleNav(event, section.id)}
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="container flash-trip__layout">
        <main className="flash-trip__main">
          <section className="flash-trip__gallery" aria-label="Trip image gallery">
            <div className="flash-trip__gallery-main">
              <Image
                alt={images[activeImage]?.alt || trip.title}
                fill
                src={images[activeImage]?.src || "/assets/img/banner1.webp"}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="flash-trip__thumbs">
              {images.slice(0, 8).map((image, index) => (
                <button
                  aria-label={`Show image ${index + 1}`}
                  className={activeImage === index ? "is-active" : ""}
                  key={`${image.src}-${index}`}
                  onClick={() => setActiveImage(index)}
                  type="button"
                >
                  <Image alt={image.alt || trip.title} fill src={image.src} style={{ objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </section>

          <section className="flash-trip__section" id="overview">
            <SectionTitle>Overview</SectionTitle>
            {trip.overview ? (
              <div className="flash-trip__rich-content rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(trip.overview) }} />
            ) : (
              <p>This safari is arranged around your dates, pace, accommodation style, and preferred route.</p>
            )}
            {trip.bestFor?.length ? (
              <div className="flash-trip__meta-block">
                <h3>Best for</h3>
                <ul>
                  {trip.bestFor.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {trip.bestTimeToVisit ? (
              <div className="flash-trip__meta-block">
                <h3>Best time to visit</h3>
                <p>{trip.bestTimeToVisit}</p>
              </div>
            ) : null}
          </section>

          <section className="flash-trip__section flash-trip__section--route" id="where">
            <div className="flash-trip__section-heading">
              <SectionTitle>Where you&apos;ll go</SectionTitle>
              {linkableDestinations.length ? (
                <div className="flash-trip__section-heading__actions">
                  {linkableDestinations.map((item, index) => (
                    <Link
                      className="flash-trip__route-link"
                      href={`/destinations/${item.slug}`}
                      key={`${item.slug}-${index}`}
                    >
                      <span className="flash-trip__route-link__label">
                        {linkableDestinations.length === 1 ? "View destination" : `View ${item.title}`}
                      </span>
                      <ArrowRight aria-hidden className="flash-trip__route-link__icon" size={14} />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            {displayRouteStops.length ? (
              <div className="flash-trip__route-bar">
                {displayRouteStops.map((stop, index) => (
                  <span className="flash-trip__route-stop" key={`${stop}-${index}`}>
                    {index > 0 ? <ChevronRight aria-hidden className="flash-trip__route-arrow" size={14} /> : null}
                    <MapPin aria-hidden size={14} />
                    {stop}
                  </span>
                ))}
              </div>
            ) : null}
            {(trip.mapEmbedUrl || trip.routeWaypoints?.length || trip.startLocation || trip.endLocation) ? (
              <div className="flash-trip__map">
                {trip.mapEmbedUrl ? (
                  <iframe
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={trip.mapEmbedUrl}
                    title={`${trip.title} route map`}
                  />
                ) : (
                  <TripRouteMap waypoints={trip.routeWaypoints || []} startLocation={trip.startLocation} endLocation={trip.endLocation} />
                )}
              </div>
            ) : null}
          </section>

          <section className="flash-trip__section" id="itinerary">
            <SectionTitle>Itinerary</SectionTitle>
            {trip.itineraryDays?.length ? (
              <div className="flash-trip__itinerary">
                {trip.itineraryDays.map((day, index) => {
                  const isOpen = expandedDay === index;
                  const dayNumber = day.day || index + 1;
                  return (
                    <article className={isOpen ? "flash-trip__itinerary-day is-open" : "flash-trip__itinerary-day"} key={`${day.day}-${index}`}>
                      <button
                        aria-expanded={isOpen}
                        className="flash-trip__itinerary-toggle"
                        onClick={() => setExpandedDay(isOpen ? -1 : index)}
                        type="button"
                      >
                        <span className="flash-trip__itinerary-badge">Day {dayNumber}</span>
                        <span className="flash-trip__itinerary-title">{day.title || `Day ${dayNumber}`}</span>
                        {day.location ? <span className="flash-trip__itinerary-location">{day.location}</span> : null}
                        <ChevronDown aria-hidden className="flash-trip__itinerary-chevron" size={18} />
                      </button>
                      {isOpen ? (
                        <div className="flash-trip__itinerary-body">
                          {day.image ? (
                            <Image alt={day.title || trip.title} className="flash-trip__itinerary-image" height={200} src={day.image} width={320} />
                          ) : null}
                          {day.description ? <p>{day.description}</p> : null}
                          {(day.meals || day.accommodation || day.activities) ? (
                            <dl className="flash-trip__itinerary-meta">
                              {day.meals ? <><dt>Meals</dt><dd>{day.meals}</dd></> : null}
                              {day.accommodation ? <><dt>Stay</dt><dd>{day.accommodation}</dd></> : null}
                              {day.activities ? <><dt>Activities</dt><dd>{day.activities}</dd></> : null}
                            </dl>
                          ) : null}
                          {day.experienceNotes ? <p className="flash-trip__note">{day.experienceNotes}</p> : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p>The day-by-day route will be prepared once itinerary details are added for this trip.</p>
            )}
            {(trip.accommodationSummary || trip.accommodationOptions?.length) ? (
              <div className="flash-trip__accommodation">
                <h3>Accommodation</h3>
                {trip.accommodationSummary ? <p>{trip.accommodationSummary}</p> : null}
                {trip.accommodationOptions?.length ? (
                  <ul>
                    {trip.accommodationOptions.map((item) => (
                      <li key={`${item.name}-${item.note || ""}`}>
                        <strong>{item.name}</strong>
                        {item.note ? <span>{item.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="flash-trip__section" id="prices">
            <SectionTitle>Prices and Seasons</SectionTitle>
            <div className="flash-trip__price-table">
              {priceMatrices.length ? priceMatrices.map((matrix) => (
                <div
                  className={`flash-trip__matrix ${TIER_MATRIX_CLASS[matrix.tier] || ""}`}
                  key={`${matrix.tier}-${matrix.packageLabel}`}
                >
                  <div className="flash-trip__matrix-head">
                    <TierIcon tier={matrix.tier} />
                    <div>
                      <strong>{matrix.packageLabel}</strong>
                      <span>{tierLabels[matrix.tier] || matrix.tier}</span>
                    </div>
                  </div>
                  <div className="flash-trip__matrix-scroll">
                    <table className="flash-trip__matrix-table">
                      <thead>
                        <tr>
                          <th>Season</th>
                          {matrix.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                          <th aria-label="Inquire" />
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.rows.map((row, index) => (
                          <tr key={`${row.seasonLabel}-${index}`}>
                            <td>
                              <strong>{row.seasonLabel}</strong>
                              {row.notes ? <span>{row.notes}</span> : null}
                            </td>
                            {matrix.columns.map((column) => (
                              <td key={column}>
                                {formatMatrixPrice(matrix.currency, row.prices[column] ? Number(row.prices[column]) : undefined)}
                              </td>
                            ))}
                            <td className="flash-trip__matrix-action">
                              <button
                                className={
                                  selectedInquiryKey === pricingInquiryKey({
                                    season: row.seasonLabel,
                                    tier: matrix.packageLabel,
                                  })
                                    ? "is-selected"
                                    : undefined
                                }
                                onClick={() =>
                                  inquireFromPricing({
                                    season: row.seasonLabel,
                                    tier: matrix.packageLabel,
                                  })
                                }
                                type="button"
                              >
                                {row.ctaLabel}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )) : Object.entries(flatPriceGroups).map(([tier, rows]) => (
                <div className={`flash-trip__matrix ${TIER_MATRIX_CLASS[tier] || ""}`} key={tier}>
                  <div className="flash-trip__matrix-head">
                    <TierIcon tier={tier} />
                    <div>
                      <strong>{tierLabels[tier] || tier}</strong>
                      <span>Seasonal rates</span>
                    </div>
                  </div>
                  <div className="flash-trip__matrix-scroll">
                    <table className="flash-trip__matrix-table">
                      <thead>
                        <tr>
                          <th>Season</th>
                          <th>Quote Range</th>
                          <th aria-label="Inquire" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((item, index) => (
                          <tr key={`${item.title}-${index}`}>
                            <td>
                              <strong>{item.title || item.seasonLabel || "Custom season"}</strong>
                              {item.notes ? <span>{item.notes}</span> : null}
                            </td>
                            <td>{priceText(item)}</td>
                            <td className="flash-trip__matrix-action">
                              <button
                                className={
                                  selectedInquiryKey === pricingInquiryKey({
                                    season: item.title || item.seasonLabel,
                                    tier: tierLabels[tier] || tier,
                                  })
                                    ? "is-selected"
                                    : undefined
                                }
                                onClick={() =>
                                  inquireFromPricing({
                                    season: item.title || item.seasonLabel,
                                    tier: tierLabels[tier] || tier,
                                  })
                                }
                                type="button"
                              >
                                {item.ctaLabel || "Inquire"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flash-trip__section" id="included">
            <SectionTitle>What&apos;s Included</SectionTitle>
            <div className="flash-trip__inclusions">
              <article className="flash-trip__inclusion-panel flash-trip__inclusion-panel--included">
                <header className="flash-trip__inclusion-panel__head">
                  <h3>Included</h3>
                </header>
                <ul>
                  {includedItems.map((item) => (
                    <li key={item}>
                      <span aria-hidden className="flash-trip__inclusion-marker flash-trip__inclusion-marker--included">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="flash-trip__inclusion-panel flash-trip__inclusion-panel--excluded">
                <header className="flash-trip__inclusion-panel__head">
                  <h3>Excluded</h3>
                </header>
                <ul>
                  {excludedItems.map((item) => (
                    <li key={item}>
                      <CircleX aria-hidden className="flash-trip__inclusion-marker" size={17} strokeWidth={1.75} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
            {trip.optionalExperiences?.length ? (
              <div className="flash-trip__optional-panel">
                <h3 className="flash-trip__subsection-title">Optional add-on experiences</h3>
                <p className="flash-trip__subsection-intro">
                  Enhance your safari with these optional activities. Mention any add-ons in your inquiry.
                </p>
                <div className="flash-trip__optional-grid">
                  {trip.optionalExperiences.map((item) => (
                    <article key={item.title}>
                      <h4>{item.title}</h4>
                      {item.description ? <p>{item.description}</p> : null}
                      {item.priceNote ? <p className="flash-trip__optional-price">{item.priceNote}</p> : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {trip.faqs?.length ? (
            <section className="flash-trip__section" id="faqs">
              <SectionTitle>Frequently Asked Questions</SectionTitle>
              <div className="flash-trip__faq">
                {trip.faqs.map((item, index) => {
                  const isOpen = expandedFaq === index;
                  return (
                    <article className={isOpen ? "flash-trip__faq-item is-open" : "flash-trip__faq-item"} key={item.question}>
                      <button
                        aria-expanded={isOpen}
                        className="flash-trip__faq-toggle"
                        onClick={() => setExpandedFaq(isOpen ? null : index)}
                        type="button"
                      >
                        <span>{item.question}</span>
                        <ChevronDown aria-hidden className="flash-trip__faq-chevron" size={18} />
                      </button>
                      {isOpen ? (
                        <div className="flash-trip__faq-answer">
                          <p>{item.answer}</p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {(trip.positiveImpact || trip.whyBook?.length) ? (
            <section className="flash-trip__section flash-trip__trust">
              {trip.positiveImpact ? (
                <div>
                  <SectionTitle>Positive Impact Travel</SectionTitle>
                  <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(trip.positiveImpact) }} />
                </div>
              ) : null}
              {trip.whyBook?.length ? (
                <div>
                  <SectionTitle>Why Choose This Safari</SectionTitle>
                  <ul>
                    {trip.whyBook.map((item) => (
                      <li key={item}><ShieldCheck size={16} /> {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {trip.relatedTrips?.length ? (
            <section className="flash-trip__section">
              <SectionTitle>Similar Tours</SectionTitle>
              <div className="flash-trip__related">
                {trip.relatedTrips.map((item) => (
                  <Link href={`/trips/${item.slug}`} key={item.slug}>
                    {item.image ? <Image alt={item.title || "Related trip"} height={130} src={item.image} width={220} /> : null}
                    <strong>{item.title}</strong>
                    {item.budgetText ? <span>{item.budgetText}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="flash-trip__sidebar" id="quote">
          <section className="flash-trip__quote-card">
            <p className="flash-trip__quote-kicker">Trip inquiry</p>
            <TripInquiryForm
              context={{
                duration: durationText,
                priceText: trip.budgetText,
                route: routeText || trip.location,
                slug: trip.slug,
                title: trip.title,
              }}
              destination={trip.location}
              selectedOffer={inquiryPrefill}
              sourceTrip={trip.id}
            />
          </section>
          {whatsappHref ? (
            <section className="flash-trip__help-card">
              <p className="flash-trip__help-copy">Prefer WhatsApp? Chat with our safari planners for quick answers.</p>
              <a className="book-btn header-cta flash-trip__help-cta" href={whatsappHref} rel="noopener noreferrer" target="_blank">
                <span className="header-cta__label">Help Me Plan</span>
                <WhatsappIcon aria-hidden className="header-cta__icon" height={18} width={18} />
              </a>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
