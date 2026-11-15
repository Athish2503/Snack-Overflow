'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { BentoTile } from './BentoTile';
import { SnackImage } from '@/components/ui/SnackImage';
import { AdminMostConsumedItem } from '@/lib/types';

interface MostConsumedTileProps {
  snacks?: AdminMostConsumedItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

export function MostConsumedTile({
  snacks = [],
  isLoading,
  isError,
  onRetry,
  staggerIndex = 5,
}: MostConsumedTileProps) {
  const top3Snacks = snacks.slice(0, 3);

  return (
    <BentoTile
      title="Most Consumed"
      icon={<Flame size={20} color="var(--primary)" />}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      badge={
        <span
          className="badge"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--ink-muted)',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          Past 7 Days
        </span>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          height: '100%',
          justifyContent: 'center',
        }}
      >
        {top3Snacks.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 120,
              color: 'var(--ink-muted)',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            No snacks consumed this week yet.
          </div>
        ) : (
          top3Snacks.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--ink)',
                background: index === 0 ? 'var(--primary-soft)' : 'var(--surface-2)',
              }}
            >
              {/* Left: Rank & Thumbnail & 2-line clamped Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 13,
                    fontWeight: 900,
                    color: index === 0 ? 'var(--primary)' : 'var(--ink-muted)',
                    width: 18,
                    textAlign: 'center',
                  }}
                >
                  #{index + 1}
                </span>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--ink)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--surface)',
                  }}
                >
                  <SnackImage
                    src={item.imageUrl}
                    alt={item.name}
                    width="100%"
                    height="100%"
                    iconSize={18}
                  />
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--ink)',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                  title={item.name}
                >
                  {item.name}
                </div>
              </div>

              {/* Right: Units in Mono */}
              <div
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'var(--ink)',
                  flexShrink: 0,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.units} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)' }}>units</span>
              </div>
            </div>
          ))
        )}
      </div>
    </BentoTile>
  );
}
