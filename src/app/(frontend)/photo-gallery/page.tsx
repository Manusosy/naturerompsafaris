import configPromise from "@payload-config";
import type { Metadata } from "next";
import { getPayload } from "payload";

import { PageHero } from "@/components/PageHero";
import { PhotoGalleryGrid, type GalleryCategoryGroup } from "@/components/PhotoGalleryGrid";
import { galleryItemImages } from "@/lib/cms-media";
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

  const categoryGroups: GalleryCategoryGroup[] = categories.map((category) => ({
    name: category,
    images: gallery
      .filter((item) => String(item.category || "Safari Moments") === category)
      .flatMap((item) => {
        const alt = String(item.alt || item.title || "Nature Romp Safaris gallery");
        return galleryItemImages(item).map((src, index) => ({
          alt,
          id: `${String(item.id)}-${index}`,
          src,
        }));
      }),
  }));

  return (
    <main>
      <PageHero title="Photo Gallery" subtitle="Field moments from Kenya and Tanzania safaris, organized from the dashboard gallery." />
      <section className="section gallery-page">
        <div className="container">
          <PhotoGalleryGrid categories={categoryGroups} />
        </div>
      </section>
    </main>
  );
}
