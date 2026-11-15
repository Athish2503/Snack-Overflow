'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Crown, Trophy, ChevronRight, Flame } from 'lucide-react';
import { SnackCategory } from '@/lib/types';
import { CategoryIcon } from '@/lib/snackHelpers';

interface SnackOfTheWeekProps {
  snack: {
    id: string;
    name: string;
    category?: SnackCategory;
    calories?: number | null;
    imageUrl?: string | null;
    images?: string[];
    voteCount: number;
  } | null;
}

export function SnackOfTheWeekHero({ snack }: SnackOfTheWeekProps) {
  const [imgError, setImgError] = useState(false);

  if (!snack) {
    return (
      <div
        className="sticker"
        style={{
          background: 'var(--accent)',
          border: 'var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trophy size={32} color="#ffffff" />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-bricolage), sans-serif',
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
            color: '#fff',
          }}
        >
          Snack of the Week
        </h2>
        <p style={{ fontSize: 15, margin: 0, opacity: 0.9, maxWidth: 440 }}>
          No votes cast yet this week. Be the first to vote and crown the pantry favorite!
        </p>
        <Link
          href="/snacks"
          className="sticker focus-ring"
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            color: 'var(--ink)',
            border: '2px solid var(--ink)',
            boxShadow: '3px 3px 0 var(--ink)',
            borderRadius: 100,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          Vote for snacks
          <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div
      className="sticker"
      style={{
        background: 'var(--accent)',
        border: 'var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
      }}
    >
      {/* Decorative tape sticker on top-left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -8,
          left: 36,
          width: 70,
          height: 26,
          background: 'rgba(255, 255, 255, 0.45)',
          border: '1.5px dashed rgba(27, 27, 47, 0.3)',
          transform: 'rotate(-4deg)',
          borderRadius: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Decorative Trophy Sticker on top-right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 18,
          right: 28,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: '#FFF0B8',
          border: '2.5px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(12deg)',
          color: 'var(--ink)',
        }}
      >
        <Trophy size={24} />
      </div>

      {/* Left: Sticker Tile with Snack Image */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 16,
            background: '#ffffff',
            border: '2.5px solid var(--ink)',
            boxShadow: '4px 4px 0 var(--ink)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-4deg)',
            flexShrink: 0,
          }}
        >
          {(((snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl) && !imgError) ? (
            <img
              src={(snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl!}
              alt={snack.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <CategoryIcon category={snack.category || 'SWEET'} size={40} />
          )}
        </div>

        {/* Middle: Details */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1,
              opacity: 0.95,
              marginBottom: 4,
            }}
          >
            <Crown size={15} />
            Snack of the Week
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 'clamp(22px, 3.5vw, 34px)',
              fontWeight: 900,
              margin: '0 0 10px',
              color: '#ffffff',
              lineHeight: 1.15,
            }}
          >
            {snack.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 13,
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: 100,
                padding: '4px 12px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {snack.voteCount} {snack.voteCount === 1 ? 'vote' : 'votes'} this week
            </span>

            {snack.calories !== null && snack.calories !== undefined && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 100,
                  padding: '4px 12px',
                }}
              >
                <Flame size={13} fill="#ffffff" />
                {snack.calories} kcal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: View snack CTA */}
      <Link
        href={`/snacks?search=${encodeURIComponent(snack.name)}`}
        className="sticker focus-ring"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#ffffff',
          color: 'var(--ink)',
          border: '2.5px solid var(--ink)',
          boxShadow: '4px 4px 0 var(--ink)',
          borderRadius: 100,
          padding: '12px 24px',
          fontSize: 15,
          fontWeight: 800,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-bricolage), sans-serif',
        }}
      >
        View snack
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}
