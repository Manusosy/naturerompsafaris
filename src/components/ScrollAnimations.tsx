"use client";

import { useEffect } from "react";

export function ScrollAnimations() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let context: { revert: () => void } | undefined;

    async function init() {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap;
      gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);

      context = gsap.context(() => {
        gsap.from("[data-animate='hero']", {
          autoAlpha: 0,
          duration: 1,
          ease: "power3.out",
          y: 28,
        });

        gsap.utils.toArray<HTMLElement>("[data-animate='section']").forEach((element) => {
          gsap.from(element, {
            autoAlpha: 0,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: {
              start: "top 82%",
              trigger: element,
            },
            y: 34,
          });
        });
      });
    }

    void init();

    return () => {
      context?.revert();
    };
  }, []);

  return null;
}
