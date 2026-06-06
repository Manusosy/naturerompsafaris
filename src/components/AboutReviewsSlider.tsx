"use client";

import { useEffect, useRef } from "react";

export type AboutReview = {
  avatar: string;
  date: string;
  name: string;
  text: string;
};

export function AboutReviewsSlider({ reviews }: { reviews: AboutReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const loopItems = [...reviews, ...reviews];

  useEffect(() => {
    const trackEl = trackRef.current;
    if (!trackEl || reviews.length === 0) return;

    const sliderTrack: HTMLDivElement = trackEl;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let context: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      context = gsap.context(() => {
        const loop = gsap.to(sliderTrack, {
          xPercent: -50,
          ease: "none",
          duration: 28,
          repeat: -1,
        });

        const pause = () => {
          gsap.to(loop, { timeScale: 0, duration: 0.4, ease: "power2.out" });
        };
        const resume = () => {
          gsap.to(loop, { timeScale: 1, duration: 0.4, ease: "power2.out" });
        };

        sliderTrack.addEventListener("mouseenter", pause);
        sliderTrack.addEventListener("mouseleave", resume);
        sliderTrack.addEventListener("touchstart", pause, { passive: true });
        sliderTrack.addEventListener("touchend", resume, { passive: true });
      }, sliderTrack);
    }

    void init();

    return () => {
      context?.revert();
    };
  }, [reviews.length]);

  return (
    <div className="about-reviews-slider">
      <div className="about-reviews-slider__viewport">
        <div className="about-reviews-slider__track" ref={trackRef}>
          {loopItems.map((review, index) => (
            <article className="about-reviews-clean__card" key={`${review.name}-${index}`}>
              <div className="about-reviews-clean__top">
                <span className="about-reviews-clean__avatar">{review.avatar}</span>
                <div>
                  <h3>{review.name}</h3>
                  <p>{review.date}</p>
                </div>
                <span className="about-reviews-clean__stars" aria-label="5 out of 5 stars">
                  ★★★★★
                </span>
              </div>
              <p>{review.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
