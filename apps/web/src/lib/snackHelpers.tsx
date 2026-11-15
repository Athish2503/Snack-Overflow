import React from 'react';
import { Cookie, UtensilsCrossed, CupSoda, Apple, LucideIcon } from 'lucide-react';
import { SnackCategory } from './types';

export interface CategoryMeta {
  key: SnackCategory;
  label: string;
  tint: string;
  bgSoft: string;
  icon: LucideIcon;
}

export const CATEGORIES: Record<SnackCategory, CategoryMeta> = {
  SWEET: {
    key: 'SWEET',
    label: 'Sweet',
    tint: '#FF8FB8',
    bgSoft: '#FFEAF2',
    icon: Cookie,
  },
  SAVOURY: {
    key: 'SAVOURY',
    label: 'Savoury',
    tint: '#C98B5A',
    bgSoft: '#FBF0E7',
    icon: UtensilsCrossed,
  },
  DRINK: {
    key: 'DRINK',
    label: 'Drink',
    tint: '#4DB8FF',
    bgSoft: '#E6F6FF',
    icon: CupSoda,
  },
  HEALTHY_ISH: {
    key: 'HEALTHY_ISH',
    label: 'Healthy-ish',
    tint: '#8BD450',
    bgSoft: '#F2FBEB',
    icon: Apple,
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export function CategoryIcon({
  category,
  size = 18,
  color,
  className,
}: {
  category: SnackCategory;
  size?: number;
  color?: string;
  className?: string;
}) {
  const meta = CATEGORIES[category] ?? CATEGORIES.SWEET;
  const IconComp = meta.icon;
  return <IconComp size={size} color={color} className={className} strokeWidth={2.2} />;
}

/**
 * Calculates stock meter fill percentage capped at 100%.
 * Fill ratio = quantity / max(threshold * 3, quantity)
 */
export function getStockRatio(quantity: number, threshold: number): number {
  if (quantity <= 0) return 0;
  const maxRef = Math.max(threshold * 3, quantity, 1);
  return Math.min(100, Math.round((quantity / maxRef) * 100));
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
