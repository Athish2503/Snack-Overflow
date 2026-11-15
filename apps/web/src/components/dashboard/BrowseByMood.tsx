'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SnackCategory } from '@/lib/types';

interface BrowseByMoodProps {
  categoryCounts?: Record<SnackCategory, number>;
}

export function BrowseByMood({ categoryCounts }: BrowseByMoodProps) {
  const moods: Array<{
    category?: SnackCategory;
    emoji: string;
    label: string;
    href: string;
    countKey?: SnackCategory;
  }> = [
    {
      category: 'SWEET',
      emoji: '🍬',
      label: 'Sweet',
      href: '/snacks?category=SWEET',
      countKey: 'SWEET',
    },
    {
      category: 'SAVOURY',
      emoji: '🥨',
      label: 'Savoury',
      href: '/snacks?category=SAVOURY',
      countKey: 'SAVOURY',
    },
    {
      category: 'DRINK',
      emoji: '🥤',
      label: 'Drink',
      href: '/snacks?category=DRINK',
      countKey: 'DRINK',
    },
    {
      category: 'HEALTHY_ISH',
      emoji: '🥕',
      label: 'Healthy-ish',
      href: '/snacks?category=HEALTHY_ISH',
      countKey: 'HEALTHY_ISH',
    },
    {
      emoji: '✨',
      label: 'All snacks',
      href: '/snacks',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2
        style={{
          fontFamily: 'var(--font-bricolage), sans-serif',
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          fontWeight: 900,
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        Browse by mood
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {moods.map((m) => {
          const count = m.countKey && categoryCounts ? categoryCounts[m.countKey] : null;
          const isAll = !m.countKey;

          return (
            <Link
              key={m.label}
              href={m.href}
              className="sticker focus-ring"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: isAll ? 'var(--primary-soft)' : 'var(--surface)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                textDecoration: 'none',
                color: 'var(--ink)',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }} role="img" aria-hidden="true">
                  {m.emoji}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-bricolage), sans-serif',
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--ink)',
                  }}
                >
                  {m.label}
                </span>
              </div>

              {count !== null && count !== undefined ? (
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--ink-muted)',
                    background: 'var(--surface-2)',
                    padding: '2px 8px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                  }}
                >
                  {count}
                </span>
              ) : (
                <ChevronRight size={18} color="var(--ink)" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
