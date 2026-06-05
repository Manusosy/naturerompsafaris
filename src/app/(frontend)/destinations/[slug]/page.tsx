import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { getDestinationBySlug } from "@/lib/destination-content";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

const COUNTRY_LABELS: Record<string, string> = {
  kenya: "Kenya",
  tanzania: "Tanzania",
};

const COUNTRY_BADGE: Record<string, { label: string; cls: string }> = {
  kenya: { label: "Kenya", cls: "avail--available" },
  tanzania: { label: "Tanzania", cls: "avail--request" },
};

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254722714812";

function buildWhatsApp(name: string) {
  const msg = encodeURIComponent(
    `Hi Yvonne! 👋 I found ${name} on Nature Romp Safaris and I'd love to plan a safari there. Could you share itinerary ideas and rates? Thank you!`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function formatDestinationLocation(region: string, country: string) {
  const countryLabel = COUNTRY_LABELS[country] ?? "";
  return [region, countryLabel].filter(Boolean).join(", ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return {};

  return buildMetadata({
    title: `${destination.name} | Nature Romp Safaris`,
    description: destination.summary || `Explore ${destination.name} with Nature Romp Safaris.`,
    keywords: `${destination.name}, Kenya Tanzania safari destination`,
    path: `/destinations/${destination.slug}`,
    image: destination.imageUrl || "/assets/img/banner1.webp",
  });
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const countryBadge =
    COUNTRY_BADGE[destination.country] ?? { label: "East Africa", cls: "avail--request" };
  const locationLabel = formatDestinationLocation(destination.region, destination.country);
  const allImages = destination.galleryUrls;
  const waLink = buildWhatsApp(destination.name);
  const hasMapEmbed = /^https?:\/\//i.test(destination.mapEmbedUrl);
  const hasCoordinates = Boolean(destination.latitude && destination.longitude);
  const sanitizedContent = destination.content ? sanitizeHtml(destination.content) : "";

  return (
    <main className="accdet">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Destinations", url: "/destinations" },
          { name: destination.name, url: `/destinations/${destination.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="accdet__breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/destinations">Destinations</Link>
        <span>/</span>
        <span>{destination.name}</span>
      </nav>

      <section className="accdet__gallery">
        {allImages.length > 0 ? (
          <div
            className={`accdet__gallery-grid accdet__gallery-grid--${Math.min(allImages.length, 5)}`}
          >
            {allImages.slice(0, 5).map((url, index) => (
              <div className={`accdet__gallery-cell accdet__gallery-cell--${index}`} key={url}>
                <Image
                  alt={`${destination.name} — photo ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(max-width:768px) 100vw, 50vw"
                  src={url}
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
            {allImages.length > 5 ? (
              <div className="accdet__gallery-more">+{allImages.length - 5} more</div>
            ) : null}
          </div>
        ) : (
          <div className="accdet__gallery-placeholder">No photos available</div>
        )}
      </section>

      <div className="accdet__layout">
        <div className="accdet__main">
          <div className="accdet__meta">
            <span className="accdet__type">{countryBadge.label}</span>
            {destination.region ? (
              <span className={`accdet__avail ${countryBadge.cls}`}>{destination.region}</span>
            ) : (
              <span className={`accdet__avail ${countryBadge.cls}`}>Safari destination</span>
            )}
          </div>

          <h1 className="accdet__name">{destination.name}</h1>

          {locationLabel ? (
            <div className="accdet__location">
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {locationLabel}
            </div>
          ) : null}

          {destination.summary ? (
            <p className="accdet__avail-note">{destination.summary}</p>
          ) : null}

          {sanitizedContent ? (
            <div className="accdet__description">
              <h2>About this destination</h2>
              <div
                className="accdet__rich"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </div>
          ) : null}

          {hasMapEmbed || hasCoordinates ? (
            <div className="accdet__video">
              <h2>Map &amp; location</h2>
              {hasMapEmbed ? (
                <div className="accdet__video-wrap">
                  <iframe
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={destination.mapEmbedUrl}
                    title={`${destination.name} map`}
                  />
                </div>
              ) : (
                <p className="accdet__avail-note">
                  Coordinates: {destination.latitude}, {destination.longitude}
                </p>
              )}
            </div>
          ) : null}

          {destination.faqs.length > 0 ? (
            <div className="accdet__amenities">
              <h2>FAQs</h2>
              <ul className="accdet__faq-list">
                {destination.faqs.map((item) => (
                  <li key={item.question}>
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="accdet__sidebar">
          <div className="accdet__book-card">
            <div className="accdet__book-price">Plan a safari here</div>
            <div className={`accdet__book-avail ${countryBadge.cls}`}>{countryBadge.label}</div>
            {destination.summary ? (
              <p className="accdet__book-note">{destination.summary}</p>
            ) : null}

            <a className="accdet__wa-btn" href={waLink} rel="noopener noreferrer" target="_blank">
              <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Enquire via WhatsApp
            </a>

            <p className="accdet__book-disclaimer">
              No payment is taken here. Our team will help you build a safari route around this
              destination.
            </p>
          </div>

          <div className="accdet__back">
            <Link href="/destinations">← Back to all destinations</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
