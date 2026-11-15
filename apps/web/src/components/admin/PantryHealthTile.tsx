'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';
import { BentoTile } from './BentoTile';
import { CountUp } from '@/components/ui/CountUp';
import { AdminDashboardCounts } from '@/lib/types';

interface PantryHealthTileProps {
  counts?: AdminDashboardCounts;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

export function PantryHealthTile({
  counts,
  isLoading,
  isError,
  onRetry,
  staggerIndex = 0,
}: PantryHealthTileProps) {
  const { total, stocked, low, gone } = counts ?? { total: 0, stocked: 0, low: 0, gone: 0 };

  // Calculate percentages and stroke-dashoffset for SVG donut
  const { stockedPct, lowPct, gonePct, stockedDash, lowDash, goneDash } = useMemo(() => {
    if (!total || total === 0) {
      return {
        stockedPct: 0,
        lowPct: 0,
        gonePct: 0,
        stockedDash: '0 100',
        lowDash: '0 100',
        goneDash: '0 100',
      };
    }
    const sPct = (stocked / total) * 100;
    const lPct = (low / total) * 100;
    const gPct = (gone / total) * 100;

    return {
      stockedPct: Math.round(sPct),
      lowPct: Math.round(lPct),
      gonePct: Math.round(gPct),
      stockedDash: `${sPct} ${100 - sPct}`,
      lowDash: `${lPct} ${100 - lPct}`,
      goneDash: `${gPct} ${100 - gPct}`,
    };
  }, [total, stocked, low, gone]);

  const stockedOffset = 25; // start at top (90 deg counter-clockwise from 0)
  const lowOffset = stockedOffset - (stocked / (total || 1)) * 100;
  const goneOffset = lowOffset - (low / (total || 1)) * 100;

  return (
    <BentoTile
      title="Pantry Health"
      icon={<Activity size={20} />}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      badge={
        <span
          className="badge"
          style={{
            background: gone > 0 ? 'var(--gone-soft)' : low > 0 ? 'var(--running-low-soft)' : 'var(--stocked-soft)',
            color: gone > 0 ? 'var(--gone-ink)' : low > 0 ? 'var(--running-low-ink)' : 'var(--stocked-ink)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {gone > 0 ? `${gone} Gone` : low > 0 ? `${low} Low` : 'Optimal'}
        </span>
      }
      headerAction={
        <Link
          href="/snacks"
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 1fr) minmax(180px, 1.2fr)',
          gap: 24,
          alignItems: 'center',
          height: '100%',
        }}
        className="pantry-health-content"
      >
        <style>{`
          @keyframes donut-draw {
            from {
              stroke-dasharray: 0 100;
            }
          }
          .donut-segment {
            animation: donut-draw 800ms cubic-bezier(.22, 1, .36, 1) forwards;
            transition: stroke-width 150ms ease-out;
          }
          .donut-segment:hover {
            stroke-width: 14;
            cursor: pointer;
          }
          @media (max-width: 540px) {
            .pantry-health-content {
              grid-template-columns: 1fr !important;
              justify-items: center;
              text-align: center;
            }
          }
        `}</style>

        {/* ── Donut Chart ── */}
        <div
          style={{
            position: 'relative',
            width: 160,
            height: 160,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="var(--surface-2)"
              strokeWidth="10"
            />
            {total > 0 ? (
              <>
                {/* Stocked segment */}
                <circle
                  className="donut-segment"
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="var(--stocked)"
                  strokeWidth="10"
                  strokeDasharray={stockedDash}
                  strokeDashoffset={stockedOffset}
                />
                {/* Low segment */}
                <circle
                  className="donut-segment"
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="var(--running-low)"
                  strokeWidth="10"
                  strokeDasharray={lowDash}
                  strokeDashoffset={lowOffset}
                />
                {/* Gone segment */}
                <circle
                  className="donut-segment"
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="var(--gone)"
                  strokeWidth="10"
                  strokeDasharray={goneDash}
                  strokeDashoffset={goneOffset}
                />
              </>
            ) : null}
          </svg>

          {/* Center stats */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 32,
                fontWeight: 900,
                color: 'var(--ink)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <CountUp end={total} />
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 2,
              }}
            >
              Snacks
            </span>
          </div>
        </div>

        {/* ── Status breakdown links ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {/* Stocked Link */}
          <Link
            href="/snacks?status=stocked"
            className="focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--ink)',
              background: 'var(--surface-2)',
              color: 'var(--ink)',
              textDecoration: 'none',
              transition: 'transform 120ms ease-out, background 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--stocked)',
                  border: '1.5px solid var(--ink)',
                  display: 'inline-block',
                }}
                aria-hidden="true"
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 14 }}>
                <CheckCircle2 size={15} color="var(--stocked)" />
                Stocked
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp end={stocked} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600 }}>({stockedPct}%)</span>
            </div>
          </Link>

          {/* Running Low Link */}
          <Link
            href="/snacks?status=running_low"
            className="focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--ink)',
              background: low > 0 ? 'var(--running-low-soft)' : 'var(--surface-2)',
              color: 'var(--ink)',
              textDecoration: 'none',
              transition: 'transform 120ms ease-out, background 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--running-low)',
                  border: '1.5px solid var(--ink)',
                  display: 'inline-block',
                }}
                aria-hidden="true"
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 14 }}>
                <AlertTriangle size={15} color="var(--running-low)" />
                Low Stock
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp end={low} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600 }}>({lowPct}%)</span>
            </div>
          </Link>

          {/* Gone Link */}
          <Link
            href="/snacks?status=gone"
            className="focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--ink)',
              background: gone > 0 ? 'var(--gone-soft)' : 'var(--surface-2)',
              color: 'var(--ink)',
              textDecoration: 'none',
              transition: 'transform 120ms ease-out, background 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--gone)',
                  border: '1.5px solid var(--ink)',
                  display: 'inline-block',
                }}
                aria-hidden="true"
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 14 }}>
                <XCircle size={15} color="var(--gone)" />
                Gone
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp end={gone} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600 }}>({gonePct}%)</span>
            </div>
          </Link>
        </div>
      </div>
    </BentoTile>
  );
}
