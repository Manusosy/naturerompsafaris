"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GalleryItem = {
    alt?: string;
    image?: unknown;
    caption?: string;
};

export function DestinationGallerySlider({
    gallery,
    destinationName,
}: {
    gallery: GalleryItem[];
    destinationName: string;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!gallery || gallery.length === 0) return null;

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
    };

    const getUrl = (item: GalleryItem) => {
        if (item && typeof item === "object") {
            if (item.image && typeof item.image === "object" && "url" in item.image) {
                return String(item.image.url || "");
            }
            if (typeof item.image === "string") return item.image;
        }
        return "";
    };

    return (
        <div className="destination-gallery-slider" style={{ position: "relative", width: "100%", height: "480px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
            {/* Slides */}
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {gallery.map((item, index) => {
                    const url = getUrl(item);
                    if (!url) return null;
                    const isActive = index === currentIndex;
                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: isActive ? 1 : 0,
                                zIndex: isActive ? 1 : 0,
                                transition: "opacity 0.6s ease-in-out",
                                width: "100%",
                                height: "100%",
                            }}
                        >
                            <Image
                                src={url}
                                alt={item.alt || `${destinationName} gallery image ${index + 1}`}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width: 1200px) 100vw, 1140px"
                                priority={index === 0}
                                unoptimized
                            />
                            {/* Caption Overlay */}
                            {item.caption && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))",
                                        color: "#fff",
                                        padding: "30px 24px 20px",
                                        zIndex: 2,
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", letterSpacing: "0.5px" }}>
                                        {item.caption}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            {gallery.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={handlePrev}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "16px",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            background: "rgba(255, 255, 255, 0.8)",
                            border: "none",
                            borderRadius: "50%",
                            width: "44px",
                            height: "44px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            transition: "background 0.2s, transform 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
                    >
                        <ChevronLeft size={24} style={{ color: "#1c3d15" }} />
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        style={{
                            position: "absolute",
                            top: "50%",
                            right: "16px",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            background: "rgba(255, 255, 255, 0.8)",
                            border: "none",
                            borderRadius: "50%",
                            width: "44px",
                            height: "44px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            transition: "background 0.2s, transform 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)")}
                    >
                        <ChevronRight size={24} style={{ color: "#1c3d15" }} />
                    </button>

                    {/* Dots Pagination */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: "8px",
                            zIndex: 10,
                        }}
                    >
                        {gallery.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentIndex(index)}
                                style={{
                                    width: index === currentIndex ? "24px" : "8px",
                                    height: "8px",
                                    borderRadius: "999px",
                                    border: "none",
                                    background: index === currentIndex ? "#f0c878" : "rgba(255, 255, 255, 0.6)",
                                    cursor: "pointer",
                                    padding: 0,
                                    transition: "all 0.3s ease",
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
