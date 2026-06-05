import configPromise from "@payload-config";
import { getPayload } from "payload";

import { HeroSlider, type HeroSlide } from "@/components/HeroSlider";
import { heroSlides } from "@/content/site";
import { mediaUrl } from "@/lib/cms-media";

const fallbackSlides: HeroSlide[] = heroSlides.map((slide) => ({
  ctaHref: "/contact",
  ctaLabel: "Plan My Safari",
  description: slide.text,
  destinationFocus: "Kenya & Tanzania private safari planning",
  image: slide.image,
  title: slide.title,
}));

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
    const cmsSlides = (result.docs as Array<Record<string, unknown>>).map((doc) => ({
      ctaHref: String(doc.ctaHref || "/contact"),
      ctaLabel: String(doc.ctaLabel || "Plan My Safari"),
      description: String(doc.description || ""),
      destinationFocus: String(doc.destinationFocus || ""),
      image: mediaUrl(doc.image),
      title: String(doc.title || "Kenya Tanzania Safari Adventure"),
    })).filter((slide) => slide.title && slide.description);
    if (cmsSlides.length) slides = cmsSlides;
  } catch {
    slides = fallbackSlides;
  }

  return <HeroSlider slides={slides} />;
}
