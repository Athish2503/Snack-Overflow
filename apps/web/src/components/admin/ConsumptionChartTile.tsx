'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { BentoTile } from './BentoTile';
import { CountUp } from '@/components/ui/CountUp';
import { AdminConsumptionDay } from '@/lib/types';

interface ConsumptionChartTileProps {
  days?: AdminConsumptionDay[];
  average?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

function formatDayLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  } catch {
    return dateStr.slice(5);
  }
}

export function ConsumptionChartTile({
  days = [],
  average,
  isLoading,
  isError,
  onRetry,
  staggerIndex = 4,
}: ConsumptionChartTileProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { totalUnits, maxUnits, computedAverage, maxIdx } = useMemo(() => {
    let sum = 0;
    let max = 1;
    let mIdx = 0;
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      sum += d.units;
      if (d.units > max) {
        max = d.units;
        mIdx = i;
      }
    }
    const avg = average !== undefined ? average : Math.round((sum / Math.max(1, days.length)) * 10) / 10;
    return { totalUnits: sum, maxUnits: max, computedAverage: avg, maxIdx: mIdx };
  }, [days, average]);

  // Average line height percentage
  const avgLinePct = Math.min(95, Math.max(5, (computedAverage / maxUnits) * 85));

  return (
    <BentoTile
      title="Consumption, Last 7 Days"
      icon={<BarChart3 size={20} />}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      badge={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 16,
              fontWeight: 900,
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <CountUp end={totalUnits} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)' }}>total units</span>
        </div>
      }
    >
      <style>{`
        @keyframes bar-grow {
          0% {
            transform: scaleY(0);
          }
          100% {
            transform: scaleY(1);
          }
        }
        .consumption-bar-track {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          flex: 1;
        }
        .consumption-bar {
          width: 100%;
          max-width: 44px;
          border-radius: 6px 6px 0 0;
          border: 2px solid var(--ink);
          border-bottom: none;
          transform-origin: bottom;
          animation: bar-grow 600ms cubic-bezier(.22, 1, .36, 1) forwards;
          transition: filter 120ms ease-out, background 120ms ease-out;
          cursor: pointer;
          position: relative;
        }
        .consumption-bar:hover,
        .consumption-bar:focus {
          filter: brightness(0.92);
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .consumption-bar {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          minHeight: 200,
          position: 'relative',
          paddingTop: 16,
        }}
      >
        {/* Chart plot area with relative dashed average line */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '2.5px solid var(--ink)',
            paddingBottom: 2,
          }}
        >
          {/* Dashed Average Line */}
          {computedAverage > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${avgLinePct}%`,
                borderBottom: '2px dashed rgba(27, 27, 47, 0.4)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--ink-muted)',
                  background: 'var(--surface)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle)',
                  transform: 'translateY(50%)',
                }}
              >
                avg {computedAverage}/day
              </span>
            </div>
          )}

          {/* Day Bars */}
          {days.map((d, idx) => {
            const heightPct = d.units === 0 ? 3 : Math.max(8, Math.round((d.units / maxUnits) * 88));
            const isToday = idx === days.length - 1;
            const isMax = idx === maxIdx && d.units > 0;
            const isHovered = hoveredIdx === idx;
            const showValueLabel = isHovered || isMax;

            return (
              <div
                key={d.date}
                className="consumption-bar-track"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Value Label: only on hover/focus and on the maximum bar */}
                {showValueLabel && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `calc(${heightPct}% + 4px)`,
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: 11,
                      fontWeight: 900,
                      color: 'var(--ink)',
                      background: 'var(--surface)',
                      border: '1.5px solid var(--ink)',
                      boxShadow: '1.5px 1.5px 0 var(--ink)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      zIndex: 10,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {d.units}
                  </div>
                )}

                {/* Bar */}
                <div
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.units} units consumed on ${d.date}`}
                  className="consumption-bar focus-ring"
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  style={{
                    height: `${heightPct}%`,
                    background: d.units === 0 ? 'var(--border-subtle)' : isToday ? 'var(--primary)' : 'var(--accent)',
                    minHeight: d.units === 0 ? 4 : 8,
                  }}
                  title={`${d.date}: ${d.units} units consumed`}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            paddingTop: 8,
          }}
        >
          {days.map((d, idx) => {
            const isToday = idx === days.length - 1;
            return (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: isToday ? 900 : 700,
                  color: isToday ? 'var(--primary)' : 'var(--ink-muted)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {isToday ? 'Today' : formatDayLabel(d.date)}
              </div>
            );
          })}
        </div>
      </div>
    </BentoTile>
  );
}
