import configPromise from "@payload-config";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { DestinationGallerySlider } from "@/components/DestinationGallerySlider";
import { normalizeMediaUrl } from "@/lib/cms-media";
import { sanitizeHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

function mediaUrl(value: unknown) {
  if (value && typeof value === "object" && "url" in value) {
    return normalizeMediaUrl(String((value as { url?: unknown }).url ?? ""));
  }
  return "";
}

async function getDestination(slug: string) {
  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "destinations" as never,
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: "published" } },
        ],
      } as never,
    });
    return (result.docs[0] ?? null) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const destination = await getDestination(slug);
    if (!destination) return {};
    const seo = destination.seo && typeof destination.seo === "object" ? destination.seo as Record<string, unknown> : {};
    return buildMetadata({
      title: String(seo.title || destination.name || "Safari Destination"),
      description: String(seo.description || destination.summary || "Explore Kenya and Tanzania safari destinations with Nature Romp Safaris."),
      keywords: String(seo.keywords || "Kenya safari destination, Tanzania safari destination"),
      path: `/destinations/${destination.slug}`,
      image: mediaUrl(seo.openGraphImage) || mediaUrl(destination.heroImage) || "/assets/img/banner1.webp",
    });
  } catch {
    return {};
  }
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const gallery = Array.isArray(destination.gallery) ? destination.gallery as Array<Record<string, unknown>> : [];
  const faqs = Array.isArray(destination.faqs) ? destination.faqs as Array<Record<string, unknown>> : [];
  const mapEmbedUrl = typeof destination.mapEmbedUrl === "string" ? destination.mapEmbedUrl : "";
  const latitude = typeof destination.latitude === "string" ? destination.latitude : "";
  const longitude = typeof destination.longitude === "string" ? destination.longitude : "";
  const hasMapEmbed = /^https?:\/\//i.test(mapEmbedUrl);
  const hasCoordinates = Boolean(latitude && longitude);

  return (
    <main>
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Destinations", url: "/destinations" },
        { name: String(destination.name), url: `/destinations/${destination.slug}` },
      ])} />
      <PageHero title={String(destination.name)} />
      <section className="content-page destination-detail">
        <div className="container">
          {mediaUrl(destination.heroImage) ? (
            <Image alt={String(destination.name)} className="destination-detail__hero" height={540} src={mediaUrl(destination.heroImage)} width={1140} />
          ) : null}
          <div className="destination-detail__intro">
            <p>{String(destination.summary || "")}</p>
            {destination.content ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(destination.content)) }} /> : null}
          </div>
          {gallery.length ? (
            <div style={{ margin: "40px 0" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1c3d15", marginBottom: "20px" }}>Media Gallery</h2>
              <DestinationGallerySlider gallery={gallery} destinationName={String(destination.name)} />
            </div>
          ) : null}
          {hasMapEmbed || hasCoordinates ? (
            <section className="trip-panel">
              <h2>Map & Location</h2>
              {hasMapEmbed ? (
                <iframe
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapEmbedUrl}
                  style={{ border: 0, width: "100%", minHeight: 360, borderRadius: 12 }}
                  title={`${String(destination.name)} map`}
                />
              ) : null}
              {!hasMapEmbed && hasCoordinates ? (
                <p>
                  Coordinates: {latitude}, {longitude}
                </p>
              ) : null}
            </section>
          ) : null}
          {faqs.length ? (
            <section className="trip-panel">
              <h2>FAQs</h2>
              <div className="faq-grid">
                {faqs.map((item) => (
                  <article key={String(item.question)}>
                    <h3>{String(item.question)}</h3>
                    <p>{String(item.answer)}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
