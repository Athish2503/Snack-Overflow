'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ArrowLeft, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ActivityListResponse, ActivityAction } from '@/lib/types';
import { CategoryIcon, formatRelativeTime, CATEGORIES } from '@/lib/snackHelpers';
import { Pagination } from '@/components/snacks/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorCard } from '@/components/ui/ErrorCard';

export default function ActivityPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActivityAction | 'ALL'>('ALL');

  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '15');
  if (actionFilter !== 'ALL') {
    queryParams.set('action', actionFilter);
  }

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activity', page, actionFilter],
    queryFn: () => api.get<ActivityListResponse>(`/activity?${queryParams.toString()}`),
    enabled: user?.role === 'ADMIN',
  });

  // Guard non-admins
  if (user && user.role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <div
          className="sticker"
          style={{
            background: 'var(--surface)',
            border: 'var(--border)',
            boxShadow: 'var(--shadow)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--gone-soft)',
              color: 'var(--gone-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={36} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 24,
                fontWeight: 900,
                color: 'var(--ink)',
                margin: '0 0 6px',
              }}
            >
              Admin Access Only
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0, maxWidth: 380 }}>
              The activity log audit trail is restricted to pantry administrators.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="sticker focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              color: 'var(--ink)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow)',
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              marginTop: 8,
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activities = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* ── Header ── */}
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
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '0 0 4px',
              lineHeight: 1.1,
            }}
          >
            Activity Log
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-muted)', margin: 0 }}>
            Live audit trail of all snack consumptions and restocks.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(['ALL', 'CONSUMED', 'RESTOCKED'] as const).map((act) => {
            const isSelected = actionFilter === act;
            const labels = {
              ALL: 'All Events',
              CONSUMED: 'Consumed',
              RESTOCKED: 'Restocked',
            };

            return (
              <button
                key={act}
                type="button"
                onClick={() => {
                  setActionFilter(act);
                  setPage(1);
                }}
                className="sticker focus-ring"
                style={{
                  padding: '8px 14px',
                  borderRadius: 100,
                  background: isSelected ? 'var(--primary)' : 'var(--surface)',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: isSelected ? 'none' : 'var(--shadow)',
                  transform: isSelected ? 'translate(2px, 2px)' : undefined,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 100ms ease',
                }}
              >
                {labels[act]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error State ── */}
      {isError && (
        <ErrorCard
          message={(error as Error)?.message || 'Failed to load activity log.'}
          onRetry={() => refetch()}
        />
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div
          className="sticker"
          style={{
            background: 'var(--surface)',
            border: 'var(--border)',
            boxShadow: 'var(--shadow)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton style={{ width: '40%', height: 16 }} />
                <Skeleton style={{ width: '25%', height: 12 }} />
              </div>
              <Skeleton style={{ width: 80, height: 28, borderRadius: 100 }} />
              <Skeleton style={{ width: 50, height: 20 }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !isError && activities.length === 0 && (
        <div style={{ padding: '40px 0' }}>
          <EmptyState
            icon={<History size={36} color="var(--ink)" />}
            title="No activity recorded yet"
            description="When users consume or admins restock snacks, the transactions will appear here."
          />
        </div>
      )}

      {/* ── Content: Desktop Table & Mobile Cards ── */}
      {!isLoading && !isError && activities.length > 0 && (
        <>
          {/* Desktop Table (md+) */}
          <div
            id="activity-desktop-table"
            className="sticker"
            style={{
              background: 'var(--surface)',
              border: 'var(--border)',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--surface-2)',
                    borderBottom: 'var(--border)',
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  <th style={{ padding: '16px 20px' }}>User</th>
                  <th style={{ padding: '16px 20px' }}>Snack</th>
                  <th style={{ padding: '16px 20px' }}>Action</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((item, idx) => {
                  const initials = item.user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const isRestock = item.action === 'RESTOCKED';
                  const isLast = idx === activities.length - 1;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid rgba(27,27,47,0.08)',
                        transition: 'background 100ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* User */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'var(--accent-soft)',
                              border: '1.5px solid var(--accent)',
                              color: 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                              {item.user.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                              {item.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Snack */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: CATEGORIES[item.snack.category]?.bgSoft || 'var(--surface-2)',
                              border: '1px solid var(--ink)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <CategoryIcon category={item.snack.category} size={16} />
                          </span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                              {item.snack.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                              {item.snack.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 800,
                            background: isRestock ? 'var(--stocked-soft)' : 'var(--accent-soft)',
                            color: isRestock ? 'var(--stocked-ink)' : 'var(--accent)',
                            border: `1px solid ${isRestock ? 'var(--stocked)' : 'var(--accent)'}`,
                          }}
                        >
                          {isRestock ? 'Restocked' : 'Consumed'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td
                        style={{
                          padding: '16px 20px',
                          textAlign: 'right',
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                          fontSize: 15,
                          fontWeight: 800,
                          fontVariantNumeric: 'tabular-nums',
                          color: isRestock ? 'var(--stocked-ink)' : 'var(--gone-ink)',
                        }}
                      >
                        {isRestock ? `+${item.amount}` : `−${item.amount}`}
                      </td>

                      {/* Time */}
                      <td
                        style={{
                          padding: '16px 20px',
                          textAlign: 'right',
                          fontSize: 13,
                          color: 'var(--ink-muted)',
                          whiteSpace: 'nowrap',
                        }}
                        title={new Date(item.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(item.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< md) */}
          <div
            id="activity-mobile-list"
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {activities.map((item) => {
              const initials = item.user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const isRestock = item.action === 'RESTOCKED';

              return (
                <div
                  key={item.id}
                  className="card sticker"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--accent-soft)',
                          border: '1.5px solid var(--accent)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {initials}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                        {item.user.name}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 800,
                        background: isRestock ? 'var(--stocked-soft)' : 'var(--accent-soft)',
                        color: isRestock ? 'var(--stocked-ink)' : 'var(--accent)',
                        border: `1px solid ${isRestock ? 'var(--stocked)' : 'var(--accent)'}`,
                      }}
                    >
                      {isRestock ? `+${item.amount}` : `−${item.amount}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(27,27,47,0.08)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CategoryIcon category={item.snack.category} size={18} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                        {item.snack.name}
                      </span>
                    </div>

                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </>
      )}

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 767px) {
          #activity-desktop-table { display: none !important; }
          #activity-mobile-list { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
