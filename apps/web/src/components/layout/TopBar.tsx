'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ChevronDown, LogOut, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Home',
  '/snacks': 'Snacks',
  '/favorites': 'Favorites',
  '/activity': 'Activity',
};

export function CartTrigger() {
  const { totalItems, totalCalories, openCart, registerCartTarget, isBouncing } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [prevCount, setPrevCount] = useState(totalItems);
  const [isDigitRolling, setIsDigitRolling] = useState(false);

  useEffect(() => {
    registerCartTarget(buttonRef.current);
  }, [registerCartTarget]);

  if (totalItems !== prevCount) {
    setPrevCount(totalItems);
    setIsDigitRolling(true);
  }

  useEffect(() => {
    if (isDigitRolling) {
      const timer = setTimeout(() => setIsDigitRolling(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isDigitRolling]);

  const displayCount = totalItems > 9 ? '9+' : totalItems;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={openCart}
      aria-label={`Open pantry bag (${totalItems} items)`}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] shadow-[2px_2px_0_var(--ink)] hover:shadow-[3px_3px_0_var(--ink)] hover:bg-[var(--primary-soft)] active:scale-95 transition-all cursor-pointer ${
        isBouncing ? 'cart-bounce bg-[var(--primary-soft)]' : ''
      }`}
    >
      <div className="relative flex items-center justify-center">
        <ShoppingBag size={18} strokeWidth={2.4} className="text-[var(--ink)]" />
        {totalItems > 0 && (
          <span
            className={`absolute -top-3 -right-3.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[var(--primary)] text-[var(--ink)] text-[10px] font-black font-mono tabular-nums flex items-center justify-center border-2 border-[var(--ink)] shadow-[1px_1px_0_var(--ink)] pointer-events-none select-none z-10 ${
              isBouncing ? 'cart-badge-bounce' : ''
            }`}
          >
            <span
              key={displayCount}
              className={`inline-block font-mono tabular-nums ${isDigitRolling ? 'badge-digit-roll' : ''}`}
            >
              {displayCount}
            </span>
          </span>
        )}
      </div>
      <span className="hidden sm:inline font-heading font-black text-xs text-[var(--ink)] tracking-tight">
        Bag
      </span>
      {totalCalories > 0 && (
        <span className="hidden lg:inline text-[11px] font-extrabold text-[var(--primary)] font-mono tabular-nums">
          {totalCalories} kcal
        </span>
      )}
      {/* Aria-live polite region for screen readers */}
      <span className="sr-only" aria-live="polite">
        {totalItems} item{totalItems === 1 ? '' : 's'} in bag
      </span>
    </button>
  );
}

function UserMenu({ compactOnMobile = false }: { compactOnMobile?: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger focus-ring"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`User menu for ${user.name}`}
      >
        <div className="user-avatar" aria-hidden="true">
          {initials}
        </div>
        <span className={`user-name ${compactOnMobile ? 'hidden sm:inline' : ''}`}>{user.name}</span>
        <ChevronDown
          size={16}
          className={compactOnMobile ? 'hidden sm:inline' : ''}
          style={{
            color: 'var(--ink-muted)',
            transform: open ? 'rotate(180deg)' : undefined,
            transition: 'transform 150ms',
          }}
        />
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(27,27,47,0.1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
              {user.email}
            </div>
          </div>
          <button
            className="user-dropdown-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navSearch, setNavSearch] = useState('');
  const title =
    pageTitles[pathname] ??
    Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ??
    'Snack Overflow';

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/snacks?search=${encodeURIComponent(navSearch.trim())}`);
    }
  }

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <form onSubmit={handleSearchSubmit} className="topbar-search" style={{ display: 'flex' }}>
        <Search size={16} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
        <input
          value={navSearch}
          onChange={(e) => setNavSearch(e.target.value)}
          placeholder="Search snacks..."
          aria-label="Search snacks"
        />
      </form>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CartTrigger />
        <UserMenu />
      </div>
    </header>
  );
}

export function MobileTopBar() {
  return (
    <header className="mobile-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <img
          src="/snack-overflow-mark.svg"
          alt="Snack Overflow"
          width={28}
          height={28}
          style={{ borderRadius: 6, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: 'var(--font-bricolage), Bricolage Grotesque, sans-serif',
            fontWeight: 900,
            fontSize: 18,
            color: 'var(--ink)',
          }}
        >
          Snack<span style={{ color: 'var(--primary)' }}>Overflow</span>
        </span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CartTrigger />
        <UserMenu compactOnMobile={true} />
      </div>
    </header>
  );
}
