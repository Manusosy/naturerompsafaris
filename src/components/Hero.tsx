import Link from "next/link";

import { heroSlides } from "@/content/site";

export function Hero() {
  return (
    <section className="hero" aria-label="Featured safari adventures">
      {heroSlides.map((slide, index) => (
        <article
          className={index === 0 ? "hero__slide hero__slide--active" : "hero__slide"}
          style={{ backgroundImage: `url(${slide.image})` }}
          key={slide.image}
        >
          <div className="hero__overlay" />
          <div className="container hero__content">
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
            <Link href="/safari-packages" className="btn btn--primary">
              Explore Tours
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
