'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import { BentoTile } from './BentoTile';
import { useEvents } from '@/contexts/EventsContext';
import { AdminRecentActivityItem } from '@/lib/types';

interface LiveActivityTileProps {
  activities?: AdminRecentActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return 'just now';
  if (diffSec < 90) return '1m ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
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

  return (
    <BentoTile
      title="Live Activity"
      icon={<Radio size={18} className="pulse-radio" color={isConnected ? 'var(--stocked)' : 'var(--accent)'} />}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      badge={
        <span
          className="badge"
          style={{
            background: isConnected ? 'var(--stocked-soft)' : 'var(--accent-soft)',
            color: isConnected ? 'var(--stocked-ink)' : 'var(--accent)',
            fontSize: 10,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isConnected ? 'var(--stocked)' : 'var(--accent)',
              display: 'inline-block',
            }}
          />
          {isConnected ? 'Live SSE' : '20s poll'}
        </span>
      }
      headerAction={
        <Link
          href="/activity"
          className="focus-ring"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--ink-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            textDecoration: 'none',
          }}
        >
          View all <ArrowUpRight size={14} />
        </Link>
      }
    >
      <style>{`
        @keyframes pulse-radio-icon {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        .pulse-radio {
          animation: pulse-radio-icon 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-radio { animation: none !important; }
        }
        @keyframes activity-slide-in {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .activity-row {
          animation: activity-slide-in 280ms cubic-bezier(.22, 1, .36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .activity-row {
            animation: none !important;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          height: '100%',
          overflowY: 'auto',
          maxHeight: 380,
          paddingRight: 4,
        }}
        aria-live="polite"
      >
        {activities.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center',
              height: '100%',
              minHeight: 180,
              gap: 8,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--ink-muted)' }}>
              No recent activity recorded yet.
            </p>
          </div>
        ) : (
          activities.map((act, index) => {
            const isConsumed = act.action === 'CONSUMED';
            return (
              <div
                key={act.id}
                className="activity-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--ink)',
                  background: 'var(--surface-2)',
                  animationDelay: `${index * 30}ms`,
                }}
              >
                {/* Event info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ color: 'var(--ink)' }}>{act.userName}</span>{' '}
                    <span style={{ fontWeight: 600, color: 'var(--ink-muted)' }}>
                      {isConsumed ? 'consumed' : 'restocked'}
                    </span>{' '}
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{act.snackName}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      marginTop: 2,
                    }}
                    title={formatAbsoluteTime(act.createdAt)}
                  >
                    {formatRelativeTime(act.createdAt)}
                  </div>
                </div>

                {/* Badge (-N or +N) */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    className="badge"
                    style={{
                      background: isConsumed ? 'var(--accent-soft)' : 'var(--stocked-soft)',
                      color: isConsumed ? 'var(--accent)' : 'var(--stocked-ink)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 12,
                      fontWeight: 900,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    {isConsumed ? (
                      <>
                        <ArrowDownLeft size={12} strokeWidth={3} />
                        -{act.amount}
                      </>
                    ) : (
                      <>
                        <RefreshCcw size={12} strokeWidth={3} />
                        +{act.amount}
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </BentoTile>
  );
}
