'use client';

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function StickyMobileBagBar() {
  const { totalItems, openCart } = useCart();

  if (totalItems <= 0) return null;

  return (
    <div
      className="md:hidden sticky-mobile-bag-container"
      style={{
        position: 'fixed',
        bottom: 'calc(68px + env(safe-area-inset-bottom))',
        left: 16,
        right: 16,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <button
        type="button"
        onClick={openCart}
        className="sticker focus-ring pointer-events-auto"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ink)',
          color: '#ffffff',
          border: '2px solid var(--ink)',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
          borderRadius: 100,
          padding: '12px 20px',
          cursor: 'pointer',
        }}
        aria-label={`Pantry bag contains ${totalItems} items. Tap to review bag.`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <ShoppingBag size={16} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            Bag · {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--primary)',
              fontFamily: 'var(--font-bricolage), sans-serif',
            }}
          >
            Grab them
          </span>
          <ArrowRight size={16} color="var(--primary)" />
        </div>
      </button>
    </div>
  );
}
