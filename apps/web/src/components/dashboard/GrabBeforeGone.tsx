'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Flame } from 'lucide-react';
import { Snack } from '@/lib/types';
import { CategoryIcon } from '@/lib/snackHelpers';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface GrabBeforeGoneProps {
  snacks: Snack[];
  onSelect?: (snack: Snack) => void;
}

export function GrabBeforeGone({ snacks, onSelect }: GrabBeforeGoneProps) {
  const { addToCart, getItemQuantity } = useCart();

  if (!snacks || snacks.length === 0) {
    return null;
  }

  const handleAdd = (e: React.MouseEvent, snack: Snack) => {
    e.stopPropagation();
    const cardEl = (e.currentTarget.closest('.grab-card') || e.currentTarget) as HTMLElement;
    const sourceRect = cardEl.getBoundingClientRect();
    const success = addToCart(snack, 1, sourceRect);
    if (!success) {
      toast.error(`Max available stock is ${snack.quantity}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 'clamp(20px, 3vw, 24px)',
              fontWeight: 900,
              color: 'var(--ink)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Grab before it&apos;s gone</span>
            <span role="img" aria-label="warning" style={{ fontSize: 20 }}>
              ⚠️
            </span>
          </h2>
        </div>

        <Link
          href="/snacks?status=running_low"
          className="sticker focus-ring"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--ink)',
            textDecoration: 'none',
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            boxShadow: '2px 2px 0 var(--ink)',
            padding: '6px 14px',
            borderRadius: 100,
          }}
        >
          See all
          <ChevronRight size={15} />
        </Link>
      </div>

      {/* Horizontal photo cards row with scroll-snap */}
      <div
        className="grab-scroll-row"
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {snacks.map((snack) => {
          const inCart = getItemQuantity(snack.id);
          const primaryImg =
            snack.images && snack.images.length > 0 ? snack.images[0] : snack.imageUrl;

          return (
            <div
              key={snack.id}
              className="sticker grab-card"
              onClick={() => onSelect?.(snack)}
              style={{
                flex: '0 0 240px',
                scrollSnapAlign: 'start',
                background: 'var(--surface)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: onSelect ? 'pointer' : 'default',
                position: 'relative',
              }}
            >
              {/* Photo box with Urgency Chip */}
              <div
                style={{
                  width: '100%',
                  height: 140,
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--ink)',
                  overflow: 'hidden',
                  background: 'var(--surface-2)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {primaryImg ? (
                  <img
                    src={primaryImg}
                    alt={snack.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <CategoryIcon category={snack.category} size={48} />
                )}

                {/* Scarcity chip "N left" */}
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: 'var(--running-low-soft)',
                    color: 'var(--running-low-ink)',
                    border: '1.5px solid var(--ink)',
                    boxShadow: '1.5px 1.5px 0 var(--ink)',
                    borderRadius: 100,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    letterSpacing: 0.5,
                  }}
                >
                  {snack.quantity} left
                </span>
              </div>

              {/* Title & Calories */}
              <div style={{ flex: 1, minHeight: 44 }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-bricolage), sans-serif',
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--ink)',
                    margin: '0 0 4px',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={snack.name}
                >
                  {snack.name}
                </h3>
                {snack.calories && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--ink-muted)',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                    }}
                  >
                    <Flame size={12} color="var(--primary)" />
                    {snack.calories} kcal
                  </span>
                )}
              </div>

              {/* Add to bag action */}
              <button
                type="button"
                onClick={(e) => handleAdd(e, snack)}
                className="sticker focus-ring"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: inCart > 0 ? 'var(--primary-soft)' : 'var(--primary)',
                  color: inCart > 0 ? 'var(--ink)' : '#ffffff',
                  border: '1.5px solid var(--ink)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  borderRadius: 100,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                }}
              >
                {inCart > 0 ? `In bag · ${inCart}` : 'Add to bag'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
