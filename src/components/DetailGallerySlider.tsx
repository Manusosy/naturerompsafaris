"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type DetailGalleryImage = {
  alt: string;
  src: string;
};

export function DetailGallerySlider({
  className = "",
  images,
}: {
  className?: string;
  images: DetailGalleryImage[];
}) {
  const safeImages = images.filter((image) => image.src);
  const hasMany = safeImages.length > 1;
  const galleryKey = safeImages.map((image) => image.src).join("|");
  const [gallerySignature, setGallerySignature] = useState(galleryKey);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  if (galleryKey !== gallerySignature) {
    setGallerySignature(galleryKey);
    setActiveIndex(0);
  }

  useEffect(() => {
    const thumb = thumbsRef.current?.querySelector<HTMLButtonElement>(
      `[data-thumb-index="${activeIndex}"]`,
    );
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  if (!safeImages.length) {
    return <div className={`detail-gallery detail-gallery--empty ${className}`.trim()}>No photos available</div>;
  }

  function showPrevious() {
    setActiveIndex((index) => (index - 1 + safeImages.length) % safeImages.length);
  }

  function showNext() {
    setActiveIndex((index) => (index + 1) % safeImages.length);
  }

  return (
    <div className={`detail-gallery ${className}`.trim()}>
      <div className="detail-gallery__main">
        <div
          aria-live="polite"
          className="detail-gallery__track"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {safeImages.map((image, index) => (
            <div className="detail-gallery__slide" key={`${image.src}-${index}`}>
              <Image
                alt={image.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                src={image.src}
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>

        {hasMany ? (
          <>
            <button
              aria-label="Previous image"
              className="detail-gallery__nav detail-gallery__nav--prev"
              onClick={showPrevious}
              type="button"
            >
              <ChevronLeft size={28} strokeWidth={2.2} />
            </button>
            <button
              aria-label="Next image"
              className="detail-gallery__nav detail-gallery__nav--next"
              onClick={showNext}
              type="button"
            >
              <ChevronRight size={28} strokeWidth={2.2} />
            </button>
          </>
        ) : null}
      </div>

      {hasMany ? (
        <div className="detail-gallery__thumbs" ref={thumbsRef}>
          {safeImages.map((image, index) => (
            <button
              aria-label={`Show image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? "detail-gallery__thumb is-active" : "detail-gallery__thumb"}
              data-thumb-index={index}
              key={`${image.src}-thumb-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image alt="" fill sizes="80px" src={image.src} style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
