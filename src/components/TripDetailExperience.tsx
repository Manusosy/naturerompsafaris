"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { SafariQuoteForm } from "@/components/SafariQuoteForm";
import { TripRouteMap } from "@/components/TripRouteMap";
import { sanitizeHtml } from "@/lib/sanitize-html";

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

type PriceSeason = {
  budgetText?: string;
  ctaLabel?: string;
  currency?: string;
  dateRange?: string;
  displayText?: string;
  max?: number;
  min?: number;
  notes?: string;
  seasonLabel?: string;
  tier?: "budget" | "mid-range" | "luxury" | "high-end" | string;
  title?: string;
};

type RelatedTrip = {
  budgetText?: string;
  image?: string;
  slug?: string;
  title?: string;
};

export type TripDetailData = {
  availability?: string;
  budgetText?: string;
  days?: number;
  destinationStops?: DestinationStop[];
  directAnswers?: Array<{ answer?: string; question?: string }>;
  endLocation?: string;
  excluded?: string[];
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
  overview?: string;
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

const sectionLinks = [
  { id: "overview", label: "Overview" },
  { id: "where", label: "Where you'll go" },
  { id: "itinerary", label: "Itinerary" },
  { id: "prices", label: "Prices" },
  { id: "included", label: "Included" },
  { id: "reviews", label: "Reviews" },
  { id: "quote", label: "Quote" },
];

const tierLabels: Record<string, string> = {
  budget: "Budget",
  "mid-range": "Mid Range",
  luxury: "Luxury",
  "high-end": "High End",
};

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

export function TripDetailExperience({ trip }: { trip: TripDetailData }) {
  const navRef = useRef<HTMLElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const images = trip.gallery.length ? trip.gallery : [{ src: "/assets/img/banner1.webp", alt: trip.title }];
  const heroImage = trip.heroImage?.src ? trip.heroImage : images[activeImage] || images[0];
  const routeText = trip.routeLabel || [trip.startLocation, trip.endLocation].filter(Boolean).join(" to ");
  const durationText = trip.days || trip.nights ? `${trip.days || "-"} days / ${trip.nights || "-"} nights` : "Custom duration";
  const trustindexEmbed = trip.trustindexEmbedOverride || trip.reviewSettings?.trustindexEmbed || "";

  const priceGroups = useMemo(() => {
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
  }, []);

  function handleNav(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    setActiveSection(id);
    const navOffset = navRef.current?.offsetHeight || 0;
    const element = document.getElementById(id);
    if (!element) return;
    window.scrollTo({ top: element.offsetTop - navOffset - 24, behavior: "smooth" });
  }

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
            <ChevronRight size={14} />
            <span>{trip.title}</span>
          </nav>
          <p className="flash-trip__eyebrow">{trip.heroEyebrow || "Nature Romp Safaris"}</p>
          <h1>{trip.title}</h1>
          {trip.heroSubtitle ? <p className="flash-trip__subtitle">{trip.heroSubtitle}</p> : null}
          <div className="flash-trip__facts">
            <span><MapPin size={16} /> {routeText || trip.location || "Kenya and Tanzania"}</span>
            <span><CalendarDays size={16} /> {durationText}</span>
            <span><Users size={16} /> {trip.budgetText || "Quote on request"}</span>
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

          <section className="flash-trip__panel" id="overview">
            <h2>Overview</h2>
            {trip.overview ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(trip.overview) }} />
            ) : (
              <p>This safari is arranged around your dates, pace, accommodation style, and preferred route.</p>
            )}
            {trip.highlights?.length ? (
              <div className="flash-trip__highlights">
                {trip.highlights.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <Sparkles size={18} />
                    <div>
                      <h3>{item.title}</h3>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="flash-trip__panel" id="where">
            <h2>Where you&apos;ll go</h2>
            {trip.destinationStops?.length ? (
              <div className="flash-trip__destinations">
                {trip.destinationStops.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    {item.image ? (
                      <Image alt={item.alt || item.title || trip.title} height={150} src={item.image} width={230} />
                    ) : null}
                    <div>
                      <h3>{item.title}</h3>
                      {item.description ? <p>{item.description}</p> : null}
                      {item.slug ? <Link href={`/destinations/${item.slug}`}>View destination</Link> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>{trip.location || "Destinations for this safari will be confirmed in the custom quote."}</p>
            )}
            {(trip.mapEmbedUrl || trip.routeWaypoints?.length) ? (
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

          <section className="flash-trip__panel" id="itinerary">
            <h2>Itinerary</h2>
            {trip.itineraryDays?.length ? (
              <div className="flash-trip__timeline">
                {trip.itineraryDays.map((day, index) => (
                  <article key={`${day.day}-${index}`} className="flash-trip__day">
                    <div className="flash-trip__day-index">Day {day.day || index + 1}</div>
                    {day.image ? <Image alt={day.title || trip.title} height={116} src={day.image} width={170} /> : null}
                    <div>
                      <h3>{day.title || "Safari day"}</h3>
                      {day.location ? <p className="flash-trip__day-location"><MapPin size={14} /> {day.location}</p> : null}
                      {day.description ? <p>{day.description}</p> : null}
                      <dl>
                        {day.meals ? <><dt>Meals</dt><dd>{day.meals}</dd></> : null}
                        {day.accommodation ? <><dt>Stay</dt><dd>{day.accommodation}</dd></> : null}
                        {day.activities ? <><dt>Activities</dt><dd>{day.activities}</dd></> : null}
                      </dl>
                      {day.experienceNotes ? <p className="flash-trip__note">{day.experienceNotes}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>The day-by-day route will be prepared once the admin adds itinerary details for this trip.</p>
            )}
          </section>

          <section className="flash-trip__panel" id="prices">
            <h2>Prices and Seasons</h2>
            <div className="flash-trip__price-table">
              {Object.entries(priceGroups).map(([tier, rows]) => (
                <div className="flash-trip__price-group" key={tier}>
                  <h3>{tierLabels[tier] || tier}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Season</th>
                        <th>Dates</th>
                        <th>Quote Range</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item, index) => (
                        <tr key={`${item.title}-${index}`}>
                          <td>
                            <strong>{item.title || item.seasonLabel || "Custom season"}</strong>
                            {item.notes ? <span>{item.notes}</span> : null}
                          </td>
                          <td>{item.dateRange || "Flexible dates"}</td>
                          <td>{priceText(item)}</td>
                          <td>
                            <button onClick={scrollToQuote} type="button">{item.ctaLabel || "Request Quote"}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          <section className="flash-trip__panel" id="included">
            <h2>What&apos;s Included</h2>
            <div className="flash-trip__included-grid">
              <div>
                <h3><Check size={18} /> Included</h3>
                <ul>
                  {(trip.included?.length ? trip.included : ["Safari planning and local support", "Quoted ground services"]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3><X size={18} /> Excluded</h3>
                <ul>
                  {(trip.excluded?.length ? trip.excluded : ["International flights", "Visa fees and personal expenses"]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {(trip.positiveImpact || trip.whyBook?.length) ? (
            <section className="flash-trip__panel flash-trip__trust">
              {trip.positiveImpact ? (
                <div>
                  <h2>Positive Impact Travel</h2>
                  <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(trip.positiveImpact) }} />
                </div>
              ) : null}
              {trip.whyBook?.length ? (
                <div>
                  <h2>Why Book With Nature Romp Safaris</h2>
                  <ul>
                    {trip.whyBook.map((item) => (
                      <li key={item}><ShieldCheck size={16} /> {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="flash-trip__panel" id="reviews">
            <h2>{trip.reviewSettings?.heading || "Reviews"}</h2>
            {trustindexEmbed ? (
              <div dangerouslySetInnerHTML={{ __html: trustindexEmbed }} />
            ) : (
              <div className="flash-trip__review-fallback">
                <div>{Array.from({ length: 5 }).map((_, index) => <Star fill="#f5b301" color="#f5b301" key={index} size={18} />)}</div>
                <p>Verified Trustindex or Google reviews can be connected from the dashboard.</p>
              </div>
            )}
          </section>

          {trip.relatedTrips?.length ? (
            <section className="flash-trip__panel">
              <h2>Similar Tours</h2>
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

          <section className="flash-trip__panel flash-trip__security">
            <h2>{trip.reviewSettings?.bookingSecurityHeading || "Our Partners and Booking Security"}</h2>
            {trip.reviewSettings?.bookingSecurityText ? <p>{trip.reviewSettings.bookingSecurityText}</p> : null}
            {trip.reviewSettings?.bookingSecurityItems?.length ? (
              <ul>
                {trip.reviewSettings.bookingSecurityItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            {trip.reviewSettings?.partnerLogos?.length ? (
              <div className="flash-trip__partners">
                {trip.reviewSettings.partnerLogos.map((item, index) => (
                  <Image alt={item.alt} height={42} key={`${item.src}-${index}`} src={item.src} width={90} />
                ))}
              </div>
            ) : null}
          </section>
        </main>

        <aside className="flash-trip__sidebar" id="quote">
          <section className="flash-trip__quote-card">
            <h2>Request a Quote</h2>
            <p>{trip.quoteIntro || "Tell us your dates, group size, and travel style. The team will prepare a tailored safari quote."}</p>
            <SafariQuoteForm compact destination={trip.location} sourceTrip={trip.id} subject={trip.title} />
          </section>
          <section className="flash-trip__mini-card">
            <h3>Route</h3>
            <p>{routeText || trip.location || "Flexible safari route"}</p>
            <button onClick={scrollToQuote} type="button">Plan this trip</button>
          </section>
        </aside>
      </div>
    </section>
  );
}
