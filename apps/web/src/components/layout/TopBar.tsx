'use client';

import React, { useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ChevronDown, LogOut, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Home',
  '/snacks': 'Snacks',
  '/activity': 'Activity',
};

export function CartTrigger() {
  const { totalItems, totalCalories, openCart, registerCartTarget, isBouncing } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registerCartTarget(buttonRef.current);
  }, [registerCartTarget]);

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
            className={`absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-black font-heading flex items-center justify-center border border-[var(--ink)] shadow-[1px_1px_0_var(--ink)] ${
              isBouncing ? 'cart-badge-bounce' : ''
            }`}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
      <span className="hidden sm:inline font-heading font-black text-xs text-[var(--ink)] tracking-tight">
        Bag
      </span>
      {totalCalories > 0 && (
        <span className="hidden lg:inline text-[11px] font-extrabold text-[var(--primary)]">
          {totalCalories} kcal
        </span>
      )}
    </button>
  );
}

function UserMenu() {
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
      >
        <div className="user-avatar" aria-hidden="true">
          {initials}
        </div>
        <span className="user-name">{user.name}</span>
        <ChevronDown
          size={16}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Package size={22} color="var(--primary)" strokeWidth={2.5} />
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
      </div>
      <CartTrigger />
    </header>
  );
}
