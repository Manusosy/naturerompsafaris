import configPromise from "@payload-config";
import Image from "next/image";
import type { Metadata } from "next";
import { getPayload } from "payload";

import { PageHero } from "@/components/PageHero";
import { mediaUrl } from "@/lib/cms-media";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Photo Gallery",
  description:
    "View Nature Romp Safaris gallery images from Kenya Tanzania safari adventures, wildlife holidays and East Africa travel.",
  path: "/photo-gallery",
  keywords: "Kenya Tanzania safari gallery, Nature Romp Safaris photos, safari photos",
});

export default async function GalleryPage() {
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "gallery" as never,
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: "sortOrder",
    where: { status: { equals: "published" } } as never,
  }).catch(() => ({ docs: [] }));
  const gallery = result.docs as Array<Record<string, unknown>>;
  const categories = [...new Set(gallery.map((item) => String(item.category || "Safari Moments")))];

  return (
    <main>
      <PageHero title="Photo Gallery" subtitle="Field moments from Kenya and Tanzania safaris, organized from the dashboard gallery." />
      <section className="section gallery-page">
        <div className="container">
          {categories.map((category) => {
            const items = gallery.filter((item) => String(item.category || "Safari Moments") === category);
            return (
              <div className="gallery-category" key={category}>
                <h2>{category}</h2>
                <div className="gallery-grid">
                  {items.map((item) => (
                    <a href={mediaUrl(item.image)} className="gallery-item" key={String(item.id)}>
                      <Image src={mediaUrl(item.image)} alt={String(item.alt || item.title || "Nature Romp Safaris gallery")} width={520} height={390} unoptimized />
                      <span>{String(item.title || category)}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          {!gallery.length ? <p>Published gallery images will appear here once added from the dashboard media library.</p> : null}
        </div>
      </section>
    </main>
  );
}
