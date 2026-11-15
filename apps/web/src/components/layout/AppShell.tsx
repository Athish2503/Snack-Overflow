'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar, MobileTopBar } from './TopBar';
import { BottomTabBar } from './BottomTabBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: 'var(--bg)',
      }}
    >
      {/* Sidebar (md+) */}
      <Sidebar />

      {/* Main content area */}
      <div
        id="app-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          // marginLeft handled by CSS below
        }}
      >
        {/* Mobile top bar */}
        <div id="mobile-topbar-wrapper">
          <MobileTopBar />
        </div>

        {/* Desktop top bar */}
        <div id="desktop-topbar-wrapper" style={{ display: 'none' }}>
          <TopBar />
        </div>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: '24px',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', // space for bottom tab bar on mobile
          }}
          id="page-content"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div id="bottom-tab-wrapper">
        <BottomTabBar />
      </div>

      {/* Responsive layout CSS */}
      <style>{`
        @media (min-width: 768px) {
          #mobile-topbar-wrapper { display: none !important; }
          #desktop-topbar-wrapper { display: block !important; }
          #bottom-tab-wrapper { display: none !important; }
          #app-main { margin-left: var(--sidebar-rail) !important; }
          #page-content { padding-bottom: 24px !important; }
        }
        @media (min-width: 1024px) {
          #app-main { margin-left: var(--sidebar-width) !important; }
        }
      `}</style>
    </div>
  );
}
