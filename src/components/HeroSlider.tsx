"use client";

import { Compass, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildYouTubeBackgroundEmbedUrl } from "@/lib/youtube";

export type HeroSlide = {
  backgroundVideoUrl?: string;
  ctaHref: string;
  ctaLabel: string;
  description: string;
  destinationFocus?: string;
  image: string;
  images: string[];
  slideIntervalMs: number;
  title: string;
  youtubeVideoId?: string | null;
};

function HeroSlideBackground({
  isActive,
  slide,
}: {
  isActive: boolean;
  slide: HeroSlide;
}) {
  const images = slide.images.length ? slide.images : slide.image ? [slide.image] : [];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setImageIndex(0);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || slide.youtubeVideoId || images.length <= 1) return;
    const timer = window.setInterval(() => {
      setImageIndex((value) => (value + 1) % images.length);
    }, slide.slideIntervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, isActive, slide.slideIntervalMs, slide.youtubeVideoId]);

  if (slide.youtubeVideoId) {
    return (
      <div aria-hidden className="hero__video-bg">
        <iframe
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={false}
          src={buildYouTubeBackgroundEmbedUrl(slide.youtubeVideoId)}
          title={`${slide.title} background video`}
        />
      </div>
    );
  }

  if (!images.length) return null;

  return (
    <div aria-hidden className="hero__image-stack">
      {images.map((src, index) => (
        <div
          className={index === imageIndex ? "hero__bg hero__bg--active" : "hero__bg"}
          key={`${src}-${index}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const activeDuration = slides[activeSlide]?.slideIntervalMs ?? 7600;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((value) => (value + 1) % slides.length);
    }, activeDuration);
    return () => window.clearInterval(timer);
  }, [activeDuration, slides.length]);

  const safeSlides = useMemo(
    () => slides.filter((slide) => slide.title && slide.description),
    [slides],
  );

  if (!safeSlides.length) return null;

  return (
    <section className="hero hero--cms" aria-label="Featured Kenya and Tanzania safari adventures">
      {safeSlides.map((slide, index) => {
        const isActive = index === activeSlide;
        return (
          <article
            aria-hidden={!isActive}
            className={isActive ? "hero__slide hero__slide--active" : "hero__slide"}
            key={`${slide.title}-${index}`}
          >
            <HeroSlideBackground isActive={isActive} slide={slide} />
            <div className="hero__overlay" />
            <div className="container hero__content" data-animate="hero">
              {slide.destinationFocus ? <p className="hero__focus">{slide.destinationFocus}</p> : null}
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <div className="hero__actions">
                <Link href="/safari-packages" className="btn btn--primary">
                  <Compass size={18} /> View Our Tour Packages
                </Link>
                <Link href={slide.ctaHref || "/contact"} className="btn btn--ghost">
                  <MessageCircle size={18} /> {slide.ctaLabel || "Request A Free Quote"}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
      {safeSlides.length > 1 ? (
        <div className="hero__dots" aria-label="Hero slides">
          {safeSlides.map((slide, index) => (
            <button
              aria-label={`Show ${slide.title}`}
              className={index === activeSlide ? "is-active" : ""}
              key={`${slide.title}-dot-${index}`}
              onClick={() => setActiveSlide(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
