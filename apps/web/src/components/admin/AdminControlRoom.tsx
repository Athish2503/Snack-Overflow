'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { AdminDashboardResponse, Snack } from '@/lib/types';
import { AdminControlHeader } from './AdminControlHeader';
import { SnackOfTheWeekHero } from '@/components/dashboard/SnackOfTheWeekHero';
import { PantryHealthTile } from './PantryHealthTile';
import { NeedsRestockTile } from './NeedsRestockTile';
import { LiveActivityTile } from './LiveActivityTile';
import { ConsumptionChartTile } from './ConsumptionChartTile';
import { MostConsumedTile } from './MostConsumedTile';
import { AddSnackModal } from './AddSnackModal';
import { RestockModal } from './RestockModal';

export function AdminControlRoom() {
  const { user } = useAuth();
  const [isAddSnackOpen, setIsAddSnackOpen] = useState(false);
  const [restockModalSnack, setRestockModalSnack] = useState<Snack | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
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
  const consumptionAverage = data?.consumptionAverage ?? 0;
  const mostConsumedThisWeek = data?.mostConsumedThisWeek ?? [];
  const snackOfTheWeek = data?.snackOfTheWeek ?? null;

  return (
    <div
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 8px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <style>{`
        /* ── Bento Grid System with Explicit Areas & Equal Row Heights ── */
        .admin-bento-grid {
          display: grid;
          gap: 18px;
          align-items: stretch;
        }

        /* Desktop lg+ (>= 1200px, 12 cols, explicit grid areas, equal row heights, no dead space) */
        @media (min-width: 1200px) {
          .admin-bento-grid {
            grid-template-columns: repeat(12, 1fr);
            grid-template-areas:
              "hero hero hero hero hero hero hero hero hero hero hero hero"
              "health health health health needs needs needs needs activity activity activity activity"
              "consumption consumption consumption consumption consumption consumption consumption most most most most most";
          }
          .tile-hero {
            grid-area: hero;
          }
          .tile-health {
            grid-area: health;
            min-height: 440px;
          }
          .tile-needs-restock {
            grid-area: needs;
            min-height: 440px;
          }
          .tile-live-activity {
            grid-area: activity;
            min-height: 440px;
          }
          .tile-consumption {
            grid-area: consumption;
            min-height: 300px;
          }
          .tile-most-consumed {
            grid-area: most;
            min-height: 300px;
          }
        }

        /* Tablet md (768px - 1199px, 6 cols) */
        @media (min-width: 768px) and (max-width: 1199px) {
          .admin-bento-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
          }
          .tile-hero {
            grid-column: span 6;
            order: 1;
          }
          .tile-health {
            grid-column: span 6;
            order: 2;
          }
          .tile-needs-restock {
            grid-column: span 3;
            order: 3;
          }
          .tile-live-activity {
            grid-column: span 3;
            order: 4;
          }
          .tile-consumption {
            grid-column: span 6;
            order: 5;
          }
          .tile-most-consumed {
            grid-column: span 6;
            order: 6;
          }
        }

        /* Mobile (< 768px): single column, exact requested order:
           Needs restock, Pantry health, Hero, Activity, Consumption, Most consumed */
        @media (max-width: 767px) {
          .admin-bento-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .mobile-order-needs {
            order: 1;
          }
          .mobile-order-health {
            order: 2;
          }
          .mobile-order-hero {
            order: 3;
          }
          .mobile-order-activity {
            order: 4;
          }
          .mobile-order-consumption {
            order: 5;
          }
          .mobile-order-most {
            order: 6;
          }
        }
      `}</style>

      {/* Top Greeting, Alert Banner, + Add snack button */}
      <AdminControlHeader
        adminName={adminName}
        goneCount={counts.gone}
        lowCount={counts.low}
        onAddSnackClick={() => setIsAddSnackOpen(true)}
      />

      {/* Main Bento Grid */}
      <div className="admin-bento-grid">
        {/* Full-width Snack of the Week Hero Banner */}
        <div id="admin-hero-banner" className="tile-hero mobile-order-hero" style={{ width: '100%' }}>
          <SnackOfTheWeekHero
            snack={snackOfTheWeek}
            variant="admin"
            isLoading={isLoading}
            onUpdated={() => refetch()}
            onRestockClick={(s) => setRestockModalSnack(s)}
          />
        </div>
        {/* Row 1, Col 1: Pantry Health Tile (4 cols desktop, min-height ~440px) */}
        <div className="tile-health mobile-order-health">
          <PantryHealthTile
            counts={counts}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={0}
          />
        </div>

        {/* Row 1, Col 2: Needs Restock Tile (4 cols desktop, min-height ~440px) */}
        <div className="tile-needs-restock mobile-order-needs">
          <NeedsRestockTile
            snacks={needsRestock}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={1}
          />
        </div>

        {/* Row 1, Col 3: Activity Tile (4 cols desktop, min-height ~440px) */}
        <div className="tile-live-activity mobile-order-activity">
          <LiveActivityTile
            activities={recentActivity}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={2}
          />
        </div>

        {/* Row 2, Col 1: Consumption Last 7 Days (7 cols desktop, min-height ~300px) */}
        <div className="tile-consumption mobile-order-consumption">
          <ConsumptionChartTile
            days={consumptionLast7Days}
            average={consumptionAverage}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={3}
          />
        </div>

        {/* Row 2, Col 2: Most Consumed This Week (5 cols desktop, min-height ~300px) */}
        <div className="tile-most-consumed mobile-order-most">
          <MostConsumedTile
            snacks={mostConsumedThisWeek}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            staggerIndex={4}
          />
        </div>
      </div>

      {/* Add Snack Dialog */}
      <AddSnackModal
        isOpen={isAddSnackOpen}
        onClose={() => {
          setIsAddSnackOpen(false);
          refetch();
        }}
      />

      {/* Restock Dialog (for hero and any shortcuts) */}
      <RestockModal
        isOpen={Boolean(restockModalSnack)}
        onClose={() => setRestockModalSnack(null)}
        snack={restockModalSnack}
        onUpdated={() => refetch()}
      />
    </div>
  );
}
