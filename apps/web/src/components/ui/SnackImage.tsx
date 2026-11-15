'use client';

import React, { useState } from 'react';
import { SnackCategory } from '@/lib/types';
import { CATEGORIES, CategoryIcon } from '@/lib/snackHelpers';

export interface SnackImageProps {
  src?: string | null;
  alt: string;
  category?: SnackCategory | string;
  aspectRatio?: string | number;
  width?: string | number;
  height?: string | number;
  iconSize?: number;
  className?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
}

export function SnackImage({
  src,
  alt,
  category,
  aspectRatio = '1 / 1',
  width = '100%',
  height = '100%',
  iconSize,
  className = '',
  style,
  imgStyle,
  loading = 'lazy',
}: SnackImageProps) {
  const [hasError, setHasError] = useState(false);

  const catKey = (category as SnackCategory) || 'SWEET';
  const meta = CATEGORIES[catKey] ?? CATEGORIES.SWEET;

  // Use tinted fallback if src is not provided or if image failed to load
  const showFallback = !src || hasError;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        aspectRatio: typeof aspectRatio === 'number' ? `${aspectRatio}` : aspectRatio,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showFallback ? meta.bgSoft : 'var(--surface-2)',
        flexShrink: 0,
        ...style,
      }}
    >
      {showFallback ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: meta.tint,
          }}
          aria-label={alt}
        >
          <CategoryIcon category={catKey} size={iconSize || 28} color={meta.tint} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            ...imgStyle,
          }}
        />
      )}
    </div>
  );
}
