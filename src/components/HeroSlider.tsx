"use client";

import { Compass, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  destinationFocus?: string;
  image: string;
  title: string;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % slides.length);
    }, 7600);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero hero--cms" aria-label="Featured Kenya and Tanzania safari adventures">
      {slides.map((slide, index) => (
        <article
          aria-hidden={index !== active}
          className={index === active ? "hero__slide hero__slide--active" : "hero__slide"}
          key={`${slide.title}-${slide.image}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="hero__overlay" />
          <div className="container hero__content" data-animate="hero">
            {slide.destinationFocus ? <p className="hero__focus">{slide.destinationFocus}</p> : null}
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
            <div className="hero__actions">
              <Link href="/safari-packages" className="btn btn--primary">
                <Compass size={18} /> View Our Tour Packages
              </Link>
              <Link href="/contact" className="btn btn--ghost">
                <MessageCircle size={18} /> Request A Free Quote
              </Link>
            </div>
          </div>
        </article>
      ))}
      {slides.length > 1 ? (
        <div className="hero__dots" aria-label="Hero slides">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show ${slide.title}`}
              className={index === active ? "is-active" : ""}
              key={slide.title}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
