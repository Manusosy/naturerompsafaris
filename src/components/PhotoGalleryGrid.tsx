"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type GalleryImage = {
  alt: string;
  id: string;
  src: string;
};

export type GalleryCategoryGroup = {
  images: GalleryImage[];
  name: string;
};

export function PhotoGalleryGrid({ categories }: { categories: GalleryCategoryGroup[] }) {
  const allImages = categories.flatMap((category) => category.images);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null || allImages.length === 0) return current;
      return (current - 1 + allImages.length) % allImages.length;
    });
  }, [allImages.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null || allImages.length === 0) return current;
      return (current + 1) % allImages.length;
    });
  }, [allImages.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, showNext, showPrevious]);

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    (event.currentTarget as HTMLDivElement & { touchStartX?: number }).touchStartX = touch.clientX;
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touchStartX = (event.currentTarget as HTMLDivElement & { touchStartX?: number }).touchStartX;
      const touch = event.changedTouches[0];
      if (touchStartX === undefined || !touch) return;

      const delta = touch.clientX - touchStartX;
      if (Math.abs(delta) < 48) return;
      if (delta > 0) showPrevious();
      else showNext();
    },
    [showNext, showPrevious],
  );

  if (!allImages.length) {
    return <p>Published gallery images will appear here once added from the dashboard media library.</p>;
  }

  const activeImage = activeIndex === null ? null : allImages[activeIndex];

  return (
    <>
      {categories.map((category) => (
        <div className="gallery-category" key={category.name}>
          <h2>{category.name}</h2>
          <div className="gallery-grid gallery-grid--lightbox">
            {category.images.map((image) => {
              const index = allImages.findIndex((item) => item.id === image.id);
              return (
                <button
                  aria-label={`View ${image.alt}`}
                  className="gallery-item gallery-item--lightbox"
                  key={image.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <div className="gallery-item__media">
                    <Image alt={image.alt} height={390} src={image.src} unoptimized width={520} />
                    <div aria-hidden="true" className="gallery-item__expand">
                      <Expand size={22} strokeWidth={2.2} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {activeImage ? (
        <div
          aria-label="Gallery lightbox"
          aria-modal="true"
          className="gallery-lightbox"
          onClick={close}
          onTouchEnd={onTouchEnd}
          onTouchStart={onTouchStart}
          role="dialog"
        >
          <button
            aria-label="Close gallery"
            className="gallery-lightbox__close"
            onClick={close}
            type="button"
          >
            <X size={24} />
          </button>
          <button
            aria-label="Previous image"
            className="gallery-lightbox__nav gallery-lightbox__nav--prev"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            type="button"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="gallery-lightbox__stage" onClick={(event) => event.stopPropagation()}>
            <Image
              alt={activeImage.alt}
              className="gallery-lightbox__image"
              fill
              priority
              sizes="100vw"
              src={activeImage.src}
              unoptimized
            />
          </div>
          <button
            aria-label="Next image"
            className="gallery-lightbox__nav gallery-lightbox__nav--next"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            type="button"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      ) : null}
    </>
  );
}
