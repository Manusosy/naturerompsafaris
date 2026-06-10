import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { DetailGallerySlider } from "@/components/DetailGallerySlider";
import { getAccommodationBySlug } from "@/lib/accommodation-content";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  lodge: "Safari Lodge",
  camp: "Tented Camp",
  airbnb: "Airbnb / Apartment",
  hotel: "Hotel",
  boutique: "Boutique",
};

const AVAILABILITY_LABELS: Record<string, { label: string; cls: string }> = {
  available: { label: "Available", cls: "avail--available" },
  limited: { label: "Limited Availability", cls: "avail--limited" },
  "on-request": { label: "Available On Request", cls: "avail--request" },
  unavailable: { label: "Currently Unavailable", cls: "avail--unavailable" },
};

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254722714812";

function buildWhatsApp(name: string) {
  const msg = encodeURIComponent(
    `Hi Yvonne! 👋 I found ${name} on Nature Romp Safaris and I'm interested in staying there. Could you please let me know about availability and rates? Thank you!`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function getYouTubeEmbedId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return match?.[1] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getAccommodationBySlug(slug);
  if (!item) return {};
  return {
    title: `${item.name} | Nature Romp Safaris`,
    description: item.description
      ? `${item.description.slice(0, 155)}…`
      : `${item.name} — ${TYPE_LABELS[item.type] ?? item.type} in ${item.location}`,
  };
}

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getAccommodationBySlug(slug);
  if (!item) notFound();

  const avail = AVAILABILITY_LABELS[item.availability] ?? AVAILABILITY_LABELS["on-request"];
  const youtubeId = item.youtubeUrl ? getYouTubeEmbedId(item.youtubeUrl) : null;
  const allImages = [item.imageUrl, ...item.galleryUrls].filter(Boolean);
  const waLink = buildWhatsApp(item.name);

  return (
    <main className="accdet">
      {/* Breadcrumb */}
      <nav className="accdet__breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/accommodations">Accommodations</Link>
        <span>/</span>
        <span>{item.name}</span>
      </nav>

      {/* Hero Gallery */}
      <section className="accdet__gallery">
        <DetailGallerySlider
          className="accdet__gallery-slider"
          images={allImages.map((url, index) => ({
            alt: `${item.name} — photo ${index + 1}`,
            src: url,
          }))}
        />
        {allImages.length > 0 ? (
          <div className={`accdet__gallery-grid accdet__gallery-grid--${Math.min(allImages.length, 5)}`}>
            {allImages.slice(0, 5).map((url, i) => (
              <div className={`accdet__gallery-cell accdet__gallery-cell--${i}`} key={url}>
                <Image
                  alt={`${item.name} — photo ${i + 1}`}
                  fill
                  priority={i === 0}
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
        {/* Main Content */}
        <div className="accdet__main">
          <div className="accdet__meta">
            <span className="accdet__type">{TYPE_LABELS[item.type] ?? item.type}</span>
            <span className={`accdet__avail ${avail.cls}`}>{avail.label}</span>
          </div>

          <h1 className="accdet__name">{item.name}</h1>

          <div className="accdet__location">
            <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {item.location}
          </div>

          {item.availabilityNote ? (
            <p className="accdet__avail-text">{item.availabilityNote}</p>
          ) : null}

          {item.description && (
            <div className="accdet__description">
              <h2>About this property</h2>
              {item.description.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* YouTube Video */}
          {youtubeId && (
            <div className="accdet__video">
              <h2>Video Tour</h2>
              <div className="accdet__video-wrap">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={`${item.name} video tour`}
                />
              </div>
            </div>
          )}

          {/* Amenities */}
          {item.amenities.length > 0 && (
            <div className="accdet__amenities">
              <h2>Amenities</h2>
              <ul className="accdet__amenities-list">
                {item.amenities.map((a) => (
                  <li key={a}>
                    <svg fill="none" height="16" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="16"><polyline points="20 6 9 17 4 12"/></svg>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="accdet__sidebar">
          <div className="accdet__book-card">
            <div className="accdet__book-price">
              {item.priceText || (item.price ? `From $${item.price} / night` : "Price on request")}
            </div>

            <div className={`accdet__book-avail ${avail.cls}`}>
              {avail.label}
            </div>

            {item.availabilityNote ? (
              <p className="accdet__book-text">{item.availabilityNote}</p>
            ) : null}

            <a
              className="accdet__wa-btn"
              href={waLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Enquire via WhatsApp
            </a>

            <p className="accdet__book-disclaimer">
              No payment is taken here. Our team will respond with availability and rates via WhatsApp.
            </p>
          </div>

          <div className="accdet__back">
            <Link href="/accommodations">← Back to all properties</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
