"use client";

import { CalendarDays, ChevronDown, MapPin, ShieldCheck, Sparkles, Star, Users, Check, X, Map } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

import { SafariQuoteForm } from "@/components/SafariQuoteForm";
import { TripRouteMap } from "@/components/TripRouteMap";

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
  location?: string;
  meals?: string;
  title?: string;
  image?: string;
};

type ReviewSettings = {
  heading?: string;
  manualReviews?: Array<{ date?: string; name?: string; quote?: string; rating?: number }>;
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
  dateRange?: string;
  notes?: string;
  seasonLabel?: string;
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
  heroSubtitle?: string;
  highlights?: Highlight[];
  id?: string;
  included?: string[];
  itineraryDays?: ItineraryDay[];
  location?: string;
  mapEmbedUrl?: string;
  nights?: number;
  overview?: string;
  positiveImpact?: string;
  priceSeasons?: PriceSeason[];
  relatedTrips?: RelatedTrip[];
  reviewSettings?: ReviewSettings;
  routeWaypoints?: Array<{ place: string; label?: string; notes?: string }>;
  slug: string;
  startLocation?: string;
  title: string;
  whyBook?: string[];
};

export function TripDetailExperience({ trip }: { trip: TripDetailData }) {
  const [activeImage, setActiveImage] = useState(0);
  const [openDay, setOpenDay] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const tabNavRef = useRef<HTMLElement>(null);
  const images = trip.gallery.length ? trip.gallery : [{ src: "/assets/img/banner1.webp", alt: trip.title }];
  
  const facts = [
    { icon: MapPin, label: trip.location || "Kenya" },
    { icon: CalendarDays, label: `${trip.days || "-"} days / ${trip.nights || "-"} nights` },
    { icon: Users, label: trip.budgetText || "Budget on request" },
  ];

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveImage((value) => (value + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "route", "itinerary", "prices", "inclusions"];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveTab(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    setActiveTab(target);
    const el = document.getElementById(target);
    const navOffset = tabNavRef.current?.offsetHeight || 0;
    if (el) {
      window.scrollTo({
        top: el.offsetTop - navOffset - 20,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="trip-detail premium-layout">
      {/* Hero Section */}
      <div className="trip-hero">
        {images.map((image, index) => (
          <Image
            alt={image.alt}
            className={index === activeImage ? "trip-hero__image is-active" : "trip-hero__image"}
            fill
            key={`${image.src}-${index}`}
            priority={index === 0}
            src={image.src}
            style={{ objectFit: "cover" }}
          />
        ))}
        <div className="trip-hero__shade" />
        <div className="container trip-hero__content">
          <nav className="trip-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/safari-packages">Safaris</Link>
            <span>/</span>
            <span>{trip.title}</span>
          </nav>
          <span className="trip-hero__tag">{trip.heroSubtitle || "Tailor-Made Safari"}</span>
          <h1>{trip.title}</h1>
          <div className="trip-route-badge">
            <Map size={16} /> 
            <span>
              {trip.startLocation || "Nairobi"} to {trip.endLocation || "Nairobi"}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation */}
      <nav className="trip-section-nav sticky" ref={tabNavRef} aria-label="Trip sections">
        <div className="container">
          <a href="#overview" className={activeTab === "overview" ? "active" : ""} onClick={(e) => handleTabClick(e, "overview")}>Overview</a>
          {trip.destinationStops?.length ? (
            <a href="#route" className={activeTab === "route" ? "active" : ""} onClick={(e) => handleTabClick(e, "route")}>Route</a>
          ) : null}
          <a href="#itinerary" className={activeTab === "itinerary" ? "active" : ""} onClick={(e) => handleTabClick(e, "itinerary")}>Itinerary</a>
          <a href="#prices" className={activeTab === "prices" ? "active" : ""} onClick={(e) => handleTabClick(e, "prices")}>Prices & Dates</a>
          <a href="#inclusions" className={activeTab === "inclusions" ? "active" : ""} onClick={(e) => handleTabClick(e, "inclusions")}>Inclusions</a>
        </div>
      </nav>

      <div className="container trip-layout">
        {/* Main Content Column */}
        <article className="trip-main">
          
          <div className="trip-facts-bar">
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <div key={fact.label} className="fact-item">
                  <Icon size={24} />
                  <span>{fact.label}</span>
                </div>
              );
            })}
          </div>

          <section className="trip-panel" id="overview">
            <h2>Trip Overview</h2>
            {trip.overview ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: trip.overview }} />
            ) : (
              <p>Experience an unforgettable journey carefully curated for the ultimate African safari adventure.</p>
            )}
            
            {trip.highlights?.length ? (
              <div className="highlights-box">
                <h3>Tour Highlights</h3>
                <ul>
                  {trip.highlights.map((item, index) => (
                    <li key={index}>
                      <Sparkles size={16} className="highlight-icon" />
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {trip.destinationStops?.length ? (
            <section className="trip-panel" id="route">
              <h2>Where You Will Go</h2>
              <div className="trip-destination-grid">
                {trip.destinationStops.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    {item.image ? (
                      <Image alt={item.alt || item.title || trip.title} height={170} src={item.image} width={280} />
                    ) : null}
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.slug ? <Link href={`/destinations/${item.slug}`}>View destination</Link> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {trip.itineraryDays?.length ? (
            <section className="trip-panel" id="itinerary">
              <h2>Day by Day Itinerary</h2>
              <div className="itinerary-timeline">
                {trip.itineraryDays.map((day, index) => {
                  return (
                    <div className="timeline-node" key={`${day.day}-${index}`}>
                      <div className="timeline-connector"></div>
                      <div className="timeline-marker">{day.day || index + 1}</div>
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <h3>{day.title || "Safari Day"}</h3>
                          {day.location && (
                            <div className="timeline-location">
                              <MapPin size={16} />
                              {day.location}
                            </div>
                          )}
                        </div>
                        <div className="timeline-card-body">
                          {day.description && <p>{day.description}</p>}
                        </div>
                        {(day.accommodation || day.meals || day.activities) && (
                          <div className="timeline-meta">
                            {day.accommodation && (
                              <div className="timeline-meta-item">
                                <strong>Stay:</strong> {day.accommodation}
                              </div>
                            )}
                            {day.meals && (
                              <div className="timeline-meta-item">
                                <strong>Meals:</strong> {day.meals}
                              </div>
                            )}
                            {day.activities && (
                              <div className="timeline-meta-item">
                                <strong>Activities:</strong> {day.activities}
                              </div>
                            )}
                          </div>
                        )}
                        {day.experienceNotes && (
                          <div className="timeline-meta" style={{ marginTop: '1rem', background: 'var(--soft)', padding: '1rem', borderRadius: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                              <strong><Sparkles size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Experience Notes:</strong> {day.experienceNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {trip.routeWaypoints && trip.routeWaypoints.length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                  <h2>Route Map</h2>
                  <TripRouteMap waypoints={trip.routeWaypoints} startLocation={trip.startLocation} endLocation={trip.endLocation} />
                </div>
              )}
            </section>
          ) : null}

          <section className="trip-panel" id="prices">
            <h2>Prices and Seasons</h2>
            <div className="premium-price-grid">
              {(trip.priceSeasons?.length ? trip.priceSeasons : [{ title: "Custom Quote", budgetText: trip.budgetText || "On Request", notes: "Pricing depends on travel dates and group size." }]).map((item, index) => (
                <div className="price-card" key={`${item.title}-${index}`}>
                  <div className="price-card-header">
                    <h3>{item.title}</h3>
                    {item.seasonLabel && <span className="season-badge">{item.seasonLabel}</span>}
                  </div>
                  <div className="price-card-body">
                    {item.dateRange && <p className="date-range">{item.dateRange}</p>}
                    {item.budgetText && <div className="price-amount">{item.budgetText}</div>}
                    {item.notes && <p className="price-notes">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="trip-panel" id="inclusions">
            <h2>What is Included and Excluded</h2>
            <div className="inclusions-layout">
              <div className="included-box">
                <h3 className="text-success"><Check size={20} /> Included</h3>
                <ul className="check-list">
                  {(trip.included?.length ? trip.included : ["Park fees", "Game drives", "Accommodation"]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="excluded-box">
                <h3 className="text-danger"><X size={20} /> Excluded</h3>
                <ul className="cross-list">
                  {(trip.excluded?.length ? trip.excluded : ["International flights", "Tips"]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {(trip.positiveImpact || trip.whyBook?.length) ? (
            <section className="trip-panel trip-impact">
              {trip.positiveImpact ? (
                <div>
                  <h2>Positive Impact Travel</h2>
                  <div className="rich-content" dangerouslySetInnerHTML={{ __html: trip.positiveImpact }} />
                </div>
              ) : null}
              {trip.whyBook?.length ? (
                <div>
                  <h2>Why Plan With Nature Romp Safaris</h2>
                  <ul>
                    {trip.whyBook.map((item) => (
                      <li key={item}><ShieldCheck size={17} /> {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

        </article>

        {/* Sidebar Column */}
        <aside className="trip-sidebar">
          <div className="sticky-sidebar">
            <section className="premium-quote-card">
              <div className="quote-header">
                <h3>Request a Quote</h3>
                <p>Get a free tailored quote within 24 hours.</p>
              </div>
              <div className="quote-body">
                <SafariQuoteForm compact destination={trip.location} sourceTrip={trip.id} subject={trip.title} />
              </div>
            </section>

            <section className="premium-review-card">
              <h3>{trip.reviewSettings?.heading || "We Are Highly Recommended"}</h3>
              {trip.reviewSettings?.trustindexEmbed ? (
                <div dangerouslySetInnerHTML={{ __html: trip.reviewSettings.trustindexEmbed }} />
              ) : (
                <>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, index) => <Star fill="#F59E0B" color="#F59E0B" key={index} size={20} />)}
                  </div>
                  <p>Verified Google review widget can be connected from the dashboard.</p>
                </>
              )}
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}
