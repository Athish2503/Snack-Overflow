'use client';

import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { CategoryIcon } from '../../lib/snackHelpers';
import { Package } from 'lucide-react';

export const FlyingItemsOverlay: React.FC = () => {
  const { flyingItems } = useCart();

  if (flyingItems.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
      aria-hidden="true"
    >
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="flying-cart-item w-14 h-14 rounded-2xl overflow-hidden border-2 border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] bg-[var(--surface)] flex items-center justify-center"
          style={
            {
              '--start-x': `${item.startX}px`,
              '--start-y': `${item.startY}px`,
              '--target-x': `${item.targetX}px`,
              '--target-y': `${item.targetY}px`,
              top: 0,
              left: 0,
            } as React.CSSProperties
          }
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : item.category ? (
            <div className="w-full h-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--ink)]">
              <CategoryIcon category={item.category} size={28} />
            </div>
          ) : (
            <div className="w-full h-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
              <Package size={24} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
