'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight } from 'lucide-react';
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
      headerAction={
        <Link
          href="/snacks"
          className="focus-ring"
          style={{
            fontSize: 13,
            fontWeight: 800,
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
          gridTemplateColumns: 'minmax(160px, 1fr) minmax(180px, 1.2fr)',
          gap: 20,
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
          .legend-link:hover {
            transform: translateY(-1px);
            background: var(--surface) !important;
            box-shadow: 2px 2px 0 var(--ink);
          }
          @container (max-width: 380px) {
            .pantry-health-content {
              grid-template-columns: 1fr !important;
              justify-items: center;
              text-align: center;
              gap: 16px;
            }
          }
          @media (max-width: 640px) {
            .pantry-health-content {
              grid-template-columns: 1fr !important;
              justify-items: center;
              text-align: center;
              gap: 16px;
            }
          }
        `}</style>

        {/* ── Larger Donut Chart ── */}
        <div
          style={{
            position: 'relative',
            width: 180,
            height: 180,
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
              strokeWidth="9"
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
                  strokeWidth="9"
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
                  strokeWidth="9"
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
                  strokeWidth="9"
                  strokeDasharray={goneDash}
                  strokeDashoffset={goneOffset}
                />
              </>
            ) : null}
          </svg>

          {/* Center total number with mono tabular-nums */}
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
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 36,
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
                fontWeight: 800,
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: 4,
              }}
            >
              Total Snacks
            </span>
          </div>
        </div>

        {/* ── Three Legend Rows: Stocked, Low Stock, Gone with count and percent ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {/* 1. Stocked Legend Row */}
          <Link
            href="/snacks?status=stocked"
            className="legend-link focus-ring"
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
              transition: 'all 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <span style={{ fontSize: 13, fontWeight: 800 }}>Stocked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontWeight: 900,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stocked}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {stockedPct}%
              </span>
            </div>
          </Link>

          {/* 2. Low Stock Legend Row */}
          <Link
            href="/snacks?status=running_low"
            className="legend-link focus-ring"
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
              transition: 'all 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <span style={{ fontSize: 13, fontWeight: 800 }}>Low stock</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontWeight: 900,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {low}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {lowPct}%
              </span>
            </div>
          </Link>

          {/* 3. Gone Legend Row */}
          <Link
            href="/snacks?status=gone"
            className="legend-link focus-ring"
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
              transition: 'all 120ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <span style={{ fontSize: 13, fontWeight: 800 }}>Gone</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontWeight: 900,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {gone}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {gonePct}%
              </span>
            </div>
          </Link>
        </div>
      </div>
    </BentoTile>
  );
}
