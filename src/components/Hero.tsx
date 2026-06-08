import configPromise from "@payload-config";
import { getPayload } from "payload";

import { HeroSlider, type HeroSlide } from "@/components/HeroSlider";
import { heroSlides } from "@/content/site";
import { mediaUrl } from "@/lib/cms-media";
import { getYouTubeVideoId } from "@/lib/youtube";

const fallbackSlides: HeroSlide[] = heroSlides.map((slide) => ({
  ctaHref: "/contact",
  ctaLabel: "Plan My Safari",
  description: slide.text,
  destinationFocus: "Kenya & Tanzania private safari planning",
  image: slide.image,
  images: [slide.image],
  slideIntervalMs: 7600,
  title: slide.title,
}));

function normalizeHeroImages(doc: Record<string, unknown>) {
  const fromGallery = Array.isArray(doc.images)
    ? doc.images.map((item) => mediaUrl(item)).filter(Boolean)
    : [];
  if (fromGallery.length) return fromGallery;

  const legacy = mediaUrl(doc.image);
  return legacy ? [legacy] : [];
}

function normalizeHeroSlide(doc: Record<string, unknown>): HeroSlide {
  const images = normalizeHeroImages(doc);
  const intervalSeconds = typeof doc.slideIntervalSeconds === "number" ? doc.slideIntervalSeconds : 6;
  const backgroundVideoUrl =
    typeof doc.backgroundVideoUrl === "string" ? doc.backgroundVideoUrl.trim() : undefined;

  return {
    backgroundVideoUrl,
    ctaHref: String(doc.ctaHref || "/contact"),
    ctaLabel: String(doc.ctaLabel || "Plan My Safari"),
    description: String(doc.description || ""),
    destinationFocus: String(doc.destinationFocus || ""),
    image: images[0] || mediaUrl(doc.image),
    images,
    slideIntervalMs: Math.max(3000, Math.min(30000, intervalSeconds * 1000)),
    title: String(doc.title || "Kenya Tanzania Safari Adventure"),
    youtubeVideoId: getYouTubeVideoId(backgroundVideoUrl),
  };
}

export async function Hero() {
  let slides: HeroSlide[] = fallbackSlides;

  try {
    const payload = await getPayload({ config: configPromise });
    const result = await payload.find({
      collection: "homepage-slides" as never,
      depth: 1,
      limit: 6,
      overrideAccess: true,
      sort: "sortOrder",
      where: { status: { equals: "published" } } as never,
    });
    const cmsSlides = (result.docs as Array<Record<string, unknown>>)
      .map(normalizeHeroSlide)
      .filter((slide) => slide.title && slide.description && (slide.images.length || slide.youtubeVideoId));
    if (cmsSlides.length) slides = cmsSlides;
  } catch {
    slides = fallbackSlides;
  }

  return <HeroSlider slides={slides} />;
}
