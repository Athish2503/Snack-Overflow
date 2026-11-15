'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Cookie, TrendingUp, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

interface TabItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function TabItem({ href, icon, label }: TabItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link href={href} className={clsx('tab-item focus-ring', isActive && 'active')}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function CartTabItem() {
  const { openCart, totalItems, isBouncing } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open pantry bag (${totalItems} items)`}
      className="tab-item focus-ring relative cursor-pointer"
      style={{ background: 'none', border: 'none' }}
    >
      <div className={`relative ${isBouncing ? 'cart-bounce' : ''}`}>
        <ShoppingBag size={20} strokeWidth={2.4} />
        {totalItems > 0 && (
          <span
            className={`absolute -top-2 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-black flex items-center justify-center border border-[var(--ink)] ${
              isBouncing ? 'cart-badge-bounce' : ''
            }`}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
      <span>Bag</span>
    </button>
  );
}

export function BottomTabBar() {
  const { isAdmin } = useAuth();

  return (
    <nav className="bottom-tab-bar" aria-label="Main navigation">
      <TabItem href="/dashboard" icon={<Home />} label="Home" />
      <TabItem href="/snacks" icon={<Cookie />} label="Snacks" />
      <CartTabItem />
      {isAdmin && (
        <TabItem href="/activity" icon={<TrendingUp />} label="Activity" />
      )}
    </nav>
  );
}
