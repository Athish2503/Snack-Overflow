'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { SnackSummary, SnackListResponse, Snack } from '@/lib/types';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { SnackDetailDrawer } from '@/components/snacks/SnackDetailDrawer';
import { PantryPulse } from '@/components/dashboard/PantryPulse';
import { SnackOfTheWeekHero } from '@/components/dashboard/SnackOfTheWeekHero';
import { GrabBeforeGone } from '@/components/dashboard/GrabBeforeGone';
import { PicksAndLovedSection } from '@/components/dashboard/PicksAndLovedSection';
import { BrowseByMood } from '@/components/dashboard/BrowseByMood';
import { StickyMobileBagBar } from '@/components/cart/StickyMobileBagBar';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function MemberDashboard() {
  const { user } = useAuth();
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);

  // 1. Summary Query (Pantry Pulse & Snack of the Week & Category counts)
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['snack-summary'],
    queryFn: () => api.get<SnackSummary>('/snacks/summary'),
  });

  // 2. Grab before it's gone (Running low items)
  const {
    data: runningLowData,
    isLoading: isRunningLowLoading,
    refetch: refetchRunningLow,
  } = useQuery({
    queryKey: ['snacks', 'running-low-preview'],
    queryFn: () =>
      api.get<SnackListResponse>('/snacks?status=running_low&limit=6'),
  });

  // 3. Your picks (snacks current user has voted for)
  const {
    data: userPicksData,
    refetch: refetchPicks,
  } = useQuery({
    queryKey: ['snacks', 'user-picks'],
    queryFn: () =>
      api.get<SnackListResponse>('/snacks?votedOnly=true&limit=8'),
    enabled: !!user,
  });

  // 4. Most loved (top voted snacks across the team)
  const {
    data: mostLovedData,
    refetch: refetchLoved,
  } = useQuery({
    queryKey: ['snacks', 'most-loved'],
    queryFn: () =>
      api.get<SnackListResponse>('/snacks?sortBy=votes&sortOrder=desc&limit=3'),
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const runningLowCount = summary?.counts.running_low ?? 0;

  const handleRefreshAll = () => {
    refetchSummary();
    refetchRunningLow();
    refetchPicks();
    refetchLoved();
  };

  if (isSummaryError) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 0' }}>
        <ErrorCard
          message={(summaryError as Error)?.message || 'Failed to load pantry dashboard.'}
          onRetry={handleRefreshAll}
        />
      </div>
    );
  }

  const counts = summary?.counts ?? { stocked: 0, running_low: 0, gone: 0 };

  return (
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        paddingBottom: 24,
      }}
    >
      {/* ── 1. Greeting Row ── */}
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-bricolage), sans-serif',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900,
            color: 'var(--ink)',
            margin: '0 0 4px',
            lineHeight: 1.15,
          }}
        >
          {getGreeting()}, {firstName} 👋
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink-muted)',
          }}
        >
          {runningLowCount > 0
            ? `${runningLowCount} snack${runningLowCount > 1 ? 's are' : ' is'} running low, grab yours!`
            : 'The pantry is fully stocked and ready for snacking.'}
        </p>
      </div>

      {/* ── 2. Pantry Pulse ── */}
      {isSummaryLoading ? (
        <div style={{ height: 68, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
        <PantryPulse
          stocked={counts.stocked}
          runningLow={counts.running_low}
          gone={counts.gone}
        />
      )}

      {/* ── 3. Snack of the Week Hero ── */}
      {isSummaryLoading ? (
        <div
          style={{
            height: 160,
            borderRadius: 'var(--radius-lg)',
            border: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
        <SnackOfTheWeekHero
          snack={summary?.snackOfTheWeek ?? null}
          onUpdated={handleRefreshAll}
        />
      )}

      {/* ── 4. Grab before it's gone (Photo Cards Row) ── */}
      {isRunningLowLoading ? (
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <GrabBeforeGone
          snacks={runningLowData?.data ?? []}
          onSelect={(snack) => setSelectedSnack(snack)}
        />
      )}

      {/* ── 5. Your picks & Most loved ── */}
      <PicksAndLovedSection
        userPicks={userPicksData?.data ?? []}
        mostLoved={mostLovedData?.data ?? []}
        onSelect={(snack) => setSelectedSnack(snack)}
      />

      {/* ── 6. Browse by mood ── */}
      <BrowseByMood categoryCounts={counts.categories} />

      {/* ── Snack Detail Drawer (Accessible across cards) ── */}
      <SnackDetailDrawer
        snack={selectedSnack}
        isOpen={Boolean(selectedSnack)}
        onClose={() => setSelectedSnack(null)}
        onUpdated={handleRefreshAll}
      />

      {/* ── Sticky Mobile Bag Bar ── */}
      <StickyMobileBagBar />
    </div>
  );
}
