'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Cookie, TrendingUp, ShoppingBag, Bookmark } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ThemeToggle } from './ThemeToggle';

interface NavItemDef {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemDef) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link href={href} className={clsx('nav-item focus-ring', isActive && 'active')}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function RailItem({ href, icon, label }: NavItemDef) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link href={href} className={clsx('rail-item focus-ring', isActive && 'active')} title={label}>
      <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <span className="rail-tooltip">{label}</span>
    </Link>
  );
}

function SidebarBagButton() {
  const { openCart, totalItems } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open pantry bag (${totalItems} items)`}
      className="nav-item focus-ring cursor-pointer justify-between w-full text-left"
      style={{ background: 'none', border: 'none', font: 'inherit' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center' }}>
          <ShoppingBag size={20} />
        </span>
        <span>Pantry Bag</span>
      </div>
      {totalItems > 0 && (
        <span
          className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--primary)] text-[var(--ink)] text-[11px] font-black font-mono tabular-nums flex items-center justify-center border border-[var(--ink)]"
        >
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}

function RailBagButton() {
  const { openCart, totalItems } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open pantry bag (${totalItems} items)`}
      className="rail-item focus-ring relative cursor-pointer"
      title="Pantry Bag"
      style={{ background: 'none', border: 'none' }}
    >
      <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingBag size={20} />
      </span>
      {totalItems > 0 && (
        <span
          className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--primary)] text-[var(--ink)] text-[9px] font-black font-mono tabular-nums flex items-center justify-center border border-[var(--ink)]"
        >
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
      <span className="rail-tooltip">Pantry Bag</span>
    </button>
  );
}

export function Sidebar() {
  const { isAdmin } = useAuth();

  const navItems: NavItemDef[] = [
    { href: '/dashboard', icon: <Home size={20} />, label: 'Home' },
    { href: '/snacks', icon: <Cookie size={20} />, label: 'Snacks' },
    { href: '/favorites', icon: <Bookmark size={20} />, label: 'Favorites' },
    ...(isAdmin
      ? [{ href: '/activity', icon: <TrendingUp size={20} />, label: 'Activity' }]
      : []),
  ];

  return (
    <>
      {/* Desktop full sidebar (lg+) */}
      <aside className="sidebar" style={{ display: 'none' }} id="sidebar-full">
        <Link href="/dashboard" className="sidebar-logo focus-ring" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/snack-overflow-mark.svg"
            alt="Snack Overflow"
            width={34}
            height={34}
            style={{ borderRadius: 8, flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="logo-snack">SNACK</span>
            <span className="logo-overflow">OVERFLOW</span>
          </div>
          <span className="sidebar-badge">PANTRY</span>
        </Link>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
          <SidebarBagButton />
        </nav>
        <div className="sidebar-bottom">
          <ThemeToggle />
        </div>
      </aside>

      {/* Tablet icon rail (md–lg) */}
      <aside className="sidebar-rail" style={{ display: 'none' }} id="sidebar-rail">
        <Link href="/dashboard" className="rail-logo focus-ring" aria-label="Snack Overflow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/snack-overflow-mark.svg"
            alt="Snack Overflow"
            width={30}
            height={30}
            style={{ borderRadius: 8 }}
          />
        </Link>
        {navItems.map((item) => (
          <RailItem key={item.href} {...item} />
        ))}
        <RailBagButton />
        <div style={{ marginTop: 'auto', paddingBottom: 12 }}>
          <ThemeToggle compact />
        </div>
      </aside>

      {/* CSS to show/hide sidebars at breakpoints */}
      <style>{`
        @media (min-width: 768px) {
          #sidebar-rail { display: flex !important; }
        }
        @media (min-width: 1024px) {
          #sidebar-rail { display: none !important; }
          #sidebar-full { display: flex !important; }
        }
      `}</style>
    </>
  );
}
