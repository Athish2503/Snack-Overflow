'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { BentoTile } from './BentoTile';
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
          gap: 6,
          height: '100%',
          justifyContent: 'center',
        }}
      >
        {snacks.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 100,
              color: 'var(--ink-muted)',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            No snacks consumed this week yet.
          </div>
        ) : (
          snacks.slice(0, 3).map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--ink)',
                background: index === 0 ? 'var(--primary-soft)' : 'var(--surface-2)',
              }}
            >
              {/* Rank & Image & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 900,
                    color: index === 0 ? 'var(--primary)' : 'var(--ink-muted)',
                    width: 14,
                    textAlign: 'center',
                  }}
                >
                  #{index + 1}
                </span>

                {item.imageUrl && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: '1px solid var(--ink)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                )}

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>

              {/* Units */}
              <div style={{ flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 900,
                    color: 'var(--ink)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.units} units
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </BentoTile>
  );
}
