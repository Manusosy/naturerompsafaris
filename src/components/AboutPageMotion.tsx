"use client";

import { useEffect, useRef } from "react";

export function AboutPageMotion() {
  const loopRef = useRef<{ timeScale: (value: number) => void } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let context: { revert: () => void } | undefined;

    async function init() {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap;
      gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);

      context = gsap.context(() => {
        // 1. Hero Zoom & Parallax Animation
        gsap.to(".about-hero__image", {
          scale: 1.15,
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Hero Content Fade up nicely on mount
        gsap.from(".about-hero__content > *", {
          opacity: 0,
          y: 35,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.15,
        });

        // 2. Continuous Smooth Marquee for Reviews (Silky GSAP loop)
        const track = document.querySelector(".about-review-track");
        if (track) {
          // Double width track marquee animation
          // We calculate the actual scrolling width of one set of reviews.
          // Since we duplicate the list of reviews in the component, the scroll width to loop is exactly 50%.
          // 2. Continuous Smooth Marquee for Reviews (Silky GSAP loop)
          const loop = gsap.to(track, {
            xPercent: -50,
            ease: "none",
            duration: 25, // speed of marquee
            repeat: -1,
            paused: false,
          });

          loopRef.current = loop;

          // Pause marquee on hover to let users read reviews easily
          const pauseMarquee = () => {
            gsap.to(loop, { timeScale: 0, duration: 0.5, ease: "power2.out" });
          };
          const resumeMarquee = () => {
            gsap.to(loop, { timeScale: 1, duration: 0.5, ease: "power2.out" });
          };

          track.addEventListener("mouseenter", pauseMarquee);
          track.addEventListener("mouseleave", resumeMarquee);
          track.addEventListener("touchstart", pauseMarquee);
          track.addEventListener("touchend", resumeMarquee);
        }

        // 3. Staggered Asymmetric Reveal for Images
        gsap.utils.toArray<HTMLElement>(".about-media-frame, .about-journey-media").forEach((frame) => {
          gsap.from(frame.querySelector("img"), {
            clipPath: "inset(15% 15% 15% 15% round 16px)",
            scale: 1.18,
            duration: 1.4,
            ease: "power4.out",
            scrollTrigger: {
              trigger: frame,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });

          // Soft parallax lift on the actual frame
          gsap.from(frame, {
            y: 40,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: frame,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });

        // 4. Staggered sections fade and slide up
        const fadeSections = [
          ".about-kicker",
          ".about-journey-text > *",
          ".about-section-header > *",
          ".about-stats-grid > *",
        ];

        fadeSections.forEach((selector) => {
          gsap.utils.toArray<HTMLElement>(selector).forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 28,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            });
          });
        });

        // 5. Why Sets Us Apart Staggered Grid Reveal
        gsap.from(".about-why-card", {
          opacity: 0,
          y: 45,
          scale: 0.96,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: ".about-why-grid",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });

        // Scope Rows Staggered List (Removed)
      });
    }

    void init();

    return () => {
      context?.revert();
    };
  }, []);

  return null;
}
