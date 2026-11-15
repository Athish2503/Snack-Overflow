'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SnackCategory } from '../../lib/types';
import { CategoryIcon } from '../../lib/snackHelpers';

interface ImageCarouselProps {
  images?: string[] | null;
  fallbackCategory?: SnackCategory;
  heightClass?: string;
  alt: string;
  showIndicators?: boolean;
  showArrows?: boolean;
  overlayBadge?: React.ReactNode;
  topRightBadge?: React.ReactNode;
  className?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  fallbackCategory,
  heightClass = 'h-[154px]',
  alt,
  showIndicators = true,
  showArrows = true,
  overlayBadge,
  topRightBadge,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  const validImages = Array.isArray(images) && images.length > 0 ? images.filter(Boolean) : [];
  const total = validImages.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex(index);
  };

  const isCurrentFailed = failedIndices[currentIndex] || total === 0;

  return (
    <div
      className={`relative w-full ${heightClass} overflow-hidden bg-[var(--surface-2)] select-none group border-b-2 border-[var(--ink)] ${className}`}
    >
      {/* Current Image or Fallback */}
      {!isCurrentFailed && validImages[currentIndex] ? (
        <img
          key={validImages[currentIndex]}
          src={validImages[currentIndex]}
          alt={`${alt} - image ${currentIndex + 1}`}
          onError={() => setFailedIndices((prev) => ({ ...prev, [currentIndex]: true }))}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--surface-2)] to-[var(--primary-soft)] text-[var(--ink-muted)]">
          {fallbackCategory ? (
            <CategoryIcon category={fallbackCategory} size={36} className="text-[var(--ink-muted)]" />
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
          )}
        </div>
      )}

      {/* Optional Top Left Overlay Badge (Category badge) */}
      {overlayBadge && (
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          {overlayBadge}
        </div>
      )}

      {/* Optional Top Right Badge (Vote chip or Heart) */}
      {topRightBadge && (
        <div className="absolute top-2.5 right-2.5 z-10">
          {topRightBadge}
        </div>
      )}

      {/* Navigation Arrows (if multiple images) */}
      {showArrows && total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--surface)] text-[var(--ink)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center opacity-85 hover:opacity-100 transition-all active:scale-90 hover:bg-[var(--primary-soft)]"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--surface)] text-[var(--ink)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center opacity-85 hover:opacity-100 transition-all active:scale-90 hover:bg-[var(--primary-soft)]"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showIndicators && total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--ink)]/70 backdrop-blur-xs">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to image ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-4 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
