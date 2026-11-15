'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { AdminDashboardResponse } from '@/lib/types';
import { AdminControlHeader } from './AdminControlHeader';
import { PantryHealthTile } from './PantryHealthTile';
import { NeedsRestockTile } from './NeedsRestockTile';
import { LiveActivityTile } from './LiveActivityTile';
import { SnackOfTheWeekTile } from './SnackOfTheWeekTile';
import { ConsumptionChartTile } from './ConsumptionChartTile';
import { MostConsumedTile } from './MostConsumedTile';
import { QuickActionsTile } from './QuickActionsTile';

export function AdminControlRoom() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<AdminDashboardResponse>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<AdminDashboardResponse>('/admin/dashboard'),
    refetchInterval: 20000,
    refetchIntervalInBackground: false, // automatically pauses when document is hidden
  });

  const adminName = user?.name ? user.name : 'Admin';
  const counts = data?.counts ?? { total: 0, stocked: 0, low: 0, gone: 0 };
  const needsRestock = data?.needsRestock ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const consumptionLast7Days = data?.consumptionLast7Days ?? [];
  const mostConsumedThisWeek = data?.mostConsumedThisWeek ?? [];
  const snackOfTheWeek = data?.snackOfTheWeek ?? null;

  return (
    <div
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 4px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <style>{`
        /* Bento Grid Layout System */
        .admin-bento-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(12, 1fr);
        }

        /* Desktop lg+ (>= 1024px) */
        @media (min-width: 1024px) {
          .tile-health {
            grid-column: span 6;
            grid-row: span 2;
          }
          .tile-needs-restock {
            grid-column: span 3;
            grid-row: span 2;
          }
          .tile-live-activity {
            grid-column: span 3;
            grid-row: span 2;
          }
          .tile-snack-of-the-week {
            grid-column: span 6;
            grid-row: span 1;
          }
          .tile-consumption {
            grid-column: span 6;
            grid-row: span 1;
          }
          .tile-most-consumed {
            grid-column: span 6;
            grid-row: span 1;
          }
          .tile-quick-actions {
            grid-column: span 6;
            grid-row: span 1;
          }
        }

        /* Tablet md (768px - 1023px): 6 columns */
        @media (min-width: 768px) and (max-width: 1023px) {
          .admin-bento-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
          }
          .tile-health {
            grid-column: span 6;
          }
          .tile-needs-restock {
            grid-column: span 3;
          }
          .tile-live-activity {
            grid-column: span 3;
          }
          .tile-snack-of-the-week {
            grid-column: span 6;
          }
          .tile-consumption {
            grid-column: span 6;
          }
          .tile-most-consumed {
            grid-column: span 3;
          }
          .tile-quick-actions {
            grid-column: span 3;
          }
        }

        /* Mobile (< 768px): single column, exact requested order */
        @media (max-width: 767px) {
          .admin-bento-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .tile-needs-restock {
            order: 1;
            grid-column: span 1;
          }
          .tile-health {
            order: 2;
            grid-column: span 1;
          }
          .tile-snack-of-the-week {
            order: 3;
            grid-column: span 1;
          }
          .tile-live-activity {
            order: 4;
            grid-column: span 1;
          }
          .tile-consumption {
            order: 5;
            grid-column: span 1;
          }
          .tile-most-consumed {
            order: 6;
            grid-column: span 1;
          }
          .tile-quick-actions {
            order: 7;
            grid-column: span 1;
          }
        }
      `}</style>

      {/* Top Greeting & Stock Alert Line */}
      <AdminControlHeader
        adminName={adminName}
        goneCount={counts.gone}
        lowCount={counts.low}
      />

      {/* Main Bento Grid */}
      <div className="admin-bento-grid">
        {/* 1. Pantry Health Tile */}
        <div className="tile-health">
          <PantryHealthTile
            counts={counts}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={0}
          />
        </div>

        {/* 2. Needs Restock Tile */}
        <div className="tile-needs-restock">
          <NeedsRestockTile
            snacks={needsRestock}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={1}
          />
        </div>

        {/* 3. Live Activity Tile */}
        <div className="tile-live-activity">
          <LiveActivityTile
            activities={recentActivity}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={2}
          />
        </div>

        {/* 4. Snack of the Week Tile */}
        <div className="tile-snack-of-the-week">
          <SnackOfTheWeekTile
            snack={snackOfTheWeek}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={3}
          />
        </div>

        {/* 5. Consumption Last 7 Days Tile */}
        <div className="tile-consumption">
          <ConsumptionChartTile
            days={consumptionLast7Days}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={4}
          />
        </div>

        {/* 6. Most Consumed Tile */}
        <div className="tile-most-consumed">
          <MostConsumedTile
            snacks={mostConsumedThisWeek}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={5}
          />
        </div>

        {/* 7. Quick Actions Tile */}
        <div className="tile-quick-actions">
          <QuickActionsTile
            needsRestockSnacks={needsRestock}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={6}
          />
        </div>
      </div>
    </div>
  );
}
