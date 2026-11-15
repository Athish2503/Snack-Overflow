'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { SnackSummary, SnackListResponse } from '@/lib/types';
import { RoleBadge } from '@/components/ui/Badge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SnackOfTheWeekHero } from '@/components/dashboard/SnackOfTheWeekHero';
import { RunningLowSection } from '@/components/dashboard/RunningLowSection';
import { RecentlyUpdatedSection } from '@/components/dashboard/RecentlyUpdatedSection';
import { BrowseAllSnacksBar } from '@/components/dashboard/BrowseAllSnacksBar';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();

  // 1. Summary Query
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

  // 2. Running Low Query
  const {
    data: runningLowData,
    isLoading: isRunningLowLoading,
    refetch: refetchRunningLow,
  } = useQuery({
    queryKey: ['snacks', 'running-low-preview'],
    queryFn: () =>
      api.get<SnackListResponse>('/snacks?status=running_low&limit=5'),
  });

  // 3. Recently Added/Updated Query
  const {
    data: recentData,
    isLoading: isRecentLoading,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ['snacks', 'recent-preview'],
    queryFn: () =>
      api.get<SnackListResponse>('/snacks?sortBy=createdAt&sortOrder=desc&limit=5'),
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const handleRefreshAll = () => {
    refetchSummary();
    refetchRunningLow();
    refetchRecent();
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
  const totalItems = counts.stocked + counts.running_low + counts.gone;

  return (
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {/* 1. Greeting Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '0 0 6px',
              lineHeight: 1.1,
            }}
          >
            {getGreeting()}, {firstName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <>
                <RoleBadge role={user.role} />
                <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{user.email}</span>
              </>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Loading session...</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Summary Cards Row */}
      {isSummaryLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <SummaryCards
          counts={{
            total: totalItems,
            stocked: counts.stocked,
            running_low: counts.running_low,
            gone: counts.gone,
          }}
        />
      )}

      {/* 3. Snack of the Week Hero */}
      {isSummaryLoading ? (
        <div
          style={{
            height: 180,
            borderRadius: 'var(--radius-lg)',
            border: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
        <SnackOfTheWeekHero snack={summary?.snackOfTheWeek ?? null} />
      )}

      {/* 4. Two-Column Section: Running Low & Recently Updated */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {isRunningLowLoading ? (
          <SkeletonCard />
        ) : (
          <RunningLowSection
            snacks={runningLowData?.data ?? []}
            onUpdated={handleRefreshAll}
          />
        )}

        {isRecentLoading ? (
          <SkeletonCard />
        ) : (
          <RecentlyUpdatedSection
            snacks={recentData?.data ?? []}
          />
        )}
      </div>

      {/* 5. Bottom CTA Row */}
      <BrowseAllSnacksBar />
    </div>
  );
}
