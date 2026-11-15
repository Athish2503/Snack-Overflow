'use client';

import React from 'react';
import { clsx } from 'clsx';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface BentoTileProps {
  id?: string;
  title?: string;
  titleId?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  staggerIndex?: number;
  minHeight?: number | string;
}

export function BentoTile({
  id,
  title,
  titleId,
  badge,
  headerAction,
  icon,
  className,
  style,
  children,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load tile data.',
  onRetry,
  staggerIndex = 0,
  minHeight,
}: BentoTileProps) {
  const generatedTitleId = titleId || (title ? `bento-title-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <section
      id={id}
      aria-labelledby={generatedTitleId}
      className={clsx('bento-tile-container', className)}
      style={
        {
          containerType: 'inline-size',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          border: 'var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)',
          padding: '20px',
          position: 'relative',
          minHeight: minHeight || 'auto',
          animation: 'bento-stagger-in 420ms cubic-bezier(.22, 1, .36, 1) both',
          animationDelay: `${staggerIndex * 40}ms`,
          transition: 'transform 220ms cubic-bezier(.22, 1, .36, 1), box-shadow 220ms cubic-bezier(.22, 1, .36, 1)',
          ...style,
        } as React.CSSProperties
      }
    >
      <style>{`
        @keyframes bento-stagger-in {
          0% {
            opacity: 0;
            transform: translateY(0.75rem);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bento-tile-container {
            animation: bento-fade-in 220ms ease-out both !important;
            transform: none !important;
          }
          @keyframes bento-fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        }
        @media (hover: hover) and (pointer: fine) {
          .bento-tile-container:hover {
            transform: translate(-2px, -2px);
            box-shadow: var(--shadow-hover);
          }
        }
      `}</style>

      {(title || icon || badge || headerAction) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {icon && (
              <span
                style={{
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
            {title && (
              <h2
                id={generatedTitleId}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(15px, 1.2cqw, 18px)',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </h2>
            )}
            {badge}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </header>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              height: '100%',
              minHeight: 140,
            }}
          >
            <Skeleton style={{ width: '100%', height: '100%', minHeight: 120, borderRadius: 'var(--radius-md)' }} />
          </div>
        ) : isError ? (
          <div
            role="alert"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--gone)',
              background: 'var(--gone-soft)',
              color: 'var(--gone-ink)',
              gap: 12,
              height: '100%',
              minHeight: 140,
            }}
          >
            <AlertCircle size={28} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{errorMessage}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="sticker focus-ring"
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  minHeight: 36,
                }}
              >
                <RefreshCw size={13} />
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
