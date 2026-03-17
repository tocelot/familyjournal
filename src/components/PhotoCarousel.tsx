"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Photo = {
  id: string;
  blob_url: string;
  media_type: string;
  sort_order: number;
};

type Props = {
  photos: Photo[];
  className?: string;
};

export default function PhotoCarousel({ photos, className = "" }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(Math.min(index, photos.length - 1));
  }, [photos.length]);

  const scrollTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    const photo = photos[0];
    return (
      <div className={className}>
        {photo.media_type === "video" ? (
          <VideoPlayer src={photo.blob_url} />
        ) : (
          <img src={photo.blob_url} alt="" className="w-full object-contain" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {photos.map((photo) => (
          <div key={photo.id} className="w-full flex-shrink-0 snap-center">
            {photo.media_type === "video" ? (
              <VideoPlayer src={photo.blob_url} />
            ) : (
              <img src={photo.blob_url} alt="" className="w-full object-contain" />
            )}
          </div>
        ))}
      </div>

      {/* Counter badge */}
      <span className="absolute right-3 top-3 rounded-full bg-[#1A1A1A]/60 px-2.5 py-1 text-xs font-medium text-white">
        {activeIndex + 1} / {photos.length}
      </span>

      {/* Dot indicators */}
      {photos.length <= 10 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); scrollTo(i); }}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className="w-full object-contain"
    />
  );
}
