import Image from "next/image";
import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
import { gallery } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Photo Gallery",
  description:
    "View Nature Romp Safaris gallery images from Kenya Tanzania safari adventures, wildlife holidays and East Africa travel.",
  path: "/photo-gallery",
  keywords: "Kenya Tanzania safari gallery, Nature Romp Safaris photos, safari photos",
});

export default function GalleryPage() {
  return (
    <main>
      <PageHero title="Photo Gallery" />
      <section className="section">
        <div className="container gallery-grid">
          {gallery.map((item) => (
            <a href={item.src} className="gallery-item" key={item.src}>
              <Image src={item.src} alt={item.alt} width={520} height={390} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
