import type { Metadata } from "next";

import { Hero } from "@/components/Hero";
import {
  AboutPreview,
  BlogPreview,
  ContactBand,
  FeaturedPackages,
  GalleryPreview,
  JeepSafari,
  Services,
  Testimonials,
} from "@/components/Sections";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kenya Tanzania Safari Adventure",
  description:
    "Book Kenya Tanzania safari adventure packages, Kenya adventure safaris, Tanzania adventure safaris, Masai Mara Serengeti routes and private East Africa tours.",
  keywords:
    "Kenya Tanzania safari adventure, Kenya adventure safari, Tanzania adventure safari, Nature Romp Safaris",
});

export default function Home() {
  return (
    <main>
      <Hero />
      <AboutPreview />
      <Services />
      <FeaturedPackages />
      <JeepSafari />
      <Testimonials />
      <GalleryPreview />
      <ContactBand />
      <BlogPreview />
    </main>
  );
}
