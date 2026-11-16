'use client';

import React from 'react';
import Link from 'next/link';
import { BentoTile } from './BentoTile';
import { useEvents } from '@/contexts/EventsContext';
import { AdminRecentActivityItem } from '@/lib/types';
import { formatRelativeTime } from '@/lib/snackHelpers';

interface LiveActivityTileProps {
  activities?: AdminRecentActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
  dataUpdatedAt?: number;
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatAbsoluteTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LiveActivityTile({
  activities = [],
  isLoading,
  isError,
  onRetry,
  staggerIndex = 2,
}: LiveActivityTileProps) {
  const { isConnected } = useEvents();

  // Top 5 items, no inner scrollbar
  const top5Activities = activities.slice(0, 5);

  return (
    <BentoTile
      title="Activity"
      icon={
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--stocked)',
          }}
          title={isConnected ? 'Live real-time feed connected' : 'Connecting to live telemetry...'}
          aria-label={isConnected ? 'Live real-time telemetry active' : 'Connecting to live telemetry'}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isConnected ? 'var(--stocked)' : '#F5B700',
              display: 'inline-block',
              boxShadow: isConnected ? '0 0 6px var(--stocked)' : 'none',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ fontSize: 11, color: isConnected ? 'var(--stocked)' : 'var(--ink-muted)' }}>
            Live
          </span>
        </span>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      headerAction={
        <Link
          href="/activity"
          className="focus-ring"
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--ink-muted)',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          View all
        </Link>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          gap: 8,
        }}
        aria-live="polite"
      >
        <style>{`
          .feed-item {
            transition: all 320ms cubic-bezier(.22, 1, .36, 1);
          }
          .feed-item:first-child {
            animation: slideInDown 320ms cubic-bezier(.22, 1, .36, 1);
          }
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {top5Activities.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center',
              flex: 1,
              minHeight: 180,
              gap: 6,
            }}
          >
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
              No recent activity
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
              Pantry stock updates and consumptions will stream here live.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top5Activities.map((act) => {
              const isConsumed = act.action === 'CONSUMED';
              const initials = getInitials(act.userName);

              return (
                <div
                  key={act.id}
                  className="feed-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)',
                    border: '1.5px solid var(--border-subtle)',
                  }}
                >
                  {/* Left: Avatar initials + User consumed/restocked Snack (wraps, never single-line truncated) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: isConsumed ? 'rgba(124, 92, 255, 0.15)' : 'rgba(34, 176, 125, 0.15)',
                        color: isConsumed ? 'var(--accent)' : 'var(--stocked-ink)',
                        border: '1.5px solid var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.3, flex: 1 }}>
                      <strong>{act.userName}</strong>{' '}
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {isConsumed ? 'consumed' : 'restocked'}
                      </span>{' '}
                      <span style={{ fontWeight: 800 }}>{act.snackName}</span>
                    </div>
                  </div>

                  {/* Right: Amount badge (-N violet, +N green) + Relative time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        fontSize: 12,
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: 100,
                        border: '1.5px solid var(--ink)',
                        background: isConsumed ? '#F0EBFF' : 'var(--stocked-soft)',
                        color: isConsumed ? 'var(--accent)' : 'var(--stocked-ink)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {isConsumed ? `-${act.amount}` : `+${act.amount}`}
                    </span>

                    <span
                      title={formatAbsoluteTime(act.createdAt)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink-muted)',
                        minWidth: 46,
                        textAlign: 'right',
                        cursor: 'help',
                      }}
                    >
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BentoTile>
  );
}
