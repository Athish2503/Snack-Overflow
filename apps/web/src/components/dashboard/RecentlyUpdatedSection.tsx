'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, History, Flame } from 'lucide-react';
import { Snack } from '@/lib/types';
import { CategoryIcon, formatRelativeTime } from '@/lib/snackHelpers';
import { StatusBadge } from '@/components/ui/Badge';

interface RecentlyUpdatedSectionProps {
  snacks: Snack[];
}

export function RecentlyUpdatedSection({ snacks }: RecentlyUpdatedSectionProps) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '24px',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 20,
              fontWeight: 800,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            Recently updated
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--ink-muted)',
            }}
          >
            Latest pantry activity
          </span>
        </div>

        {snacks.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--ink-muted)',
              fontSize: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <History size={28} color="var(--ink-muted)" />
            <span>No recent inventory updates.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {snacks.slice(0, 5).map((snack) => {
              const timeString = formatRelativeTime(snack.updatedAt || snack.createdAt);

              return (
                <div
                  key={snack.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)',
                    gap: 12,
                  }}
                >
                  {/* Left: Thumbnail + Name + Relative time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'var(--surface)',
                        border: '1.5px solid var(--ink)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {((snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl) ? (
                        <img
                          src={(snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl!}
                          alt={snack.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <CategoryIcon category={snack.category} size={20} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {snack.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <span>{timeString}</span>
                        {snack.calories !== null && snack.calories !== undefined && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                            <Flame size={10} color="var(--primary)" />
                            {snack.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge */}
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={snack.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(27,27,47,0.08)' }}>
        <Link
          href="/snacks"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--primary)',
            textDecoration: 'none',
          }}
        >
          Browse all snacks
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
