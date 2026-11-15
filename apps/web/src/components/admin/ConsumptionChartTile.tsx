'use client';

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { BentoTile } from './BentoTile';
import { CountUp } from '@/components/ui/CountUp';
import { AdminConsumptionDay } from '@/lib/types';

interface ConsumptionChartTileProps {
  days?: AdminConsumptionDay[];
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
  isLoading,
  isError,
  onRetry,
  staggerIndex = 4,
}: ConsumptionChartTileProps) {
  const { totalUnits, maxUnits } = useMemo(() => {
    let sum = 0;
    let max = 1;
    for (const d of days) {
      sum += d.units;
      if (d.units > max) max = d.units;
    }
    return { totalUnits: sum, maxUnits: max };
  }, [days]);

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
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 900,
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <CountUp end={totalUnits} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)' }}>units</span>
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
        .consumption-bar {
          transform-origin: bottom;
          animation: bar-grow 600ms cubic-bezier(.22, 1, .36, 1) forwards;
          transition: background 120ms ease-out, transform 120ms ease-out;
        }
        .consumption-bar:hover {
          filter: brightness(0.95);
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
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          height: 100,
          paddingTop: 10,
          width: '100%',
        }}
      >
        {days.map((d, i) => {
          const heightPct = Math.max(Math.round((d.units / maxUnits) * 80), 8);
          const isToday = i === days.length - 1;

          return (
            <div
              key={d.date}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                gap: 6,
                minWidth: 0,
              }}
            >
              {/* Unit Count above bar */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: d.units > 0 ? 'var(--ink)' : 'var(--ink-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {d.units}
              </span>

              {/* Bar */}
              <div
                className="consumption-bar"
                style={{
                  width: '100%',
                  maxWidth: 36,
                  height: `${heightPct}%`,
                  borderRadius: '6px 6px 2px 2px',
                  border: '1.5px solid var(--ink)',
                  background: isToday
                    ? 'var(--primary)'
                    : d.units > 0
                    ? 'var(--accent)'
                    : 'var(--surface-2)',
                  boxShadow: '1px 1px 0 var(--ink)',
                  animationDelay: `${i * 40}ms`,
                  cursor: 'pointer',
                }}
                title={`${d.date}: ${d.units} units consumed`}
              />

              {/* Day label */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isToday ? 900 : 700,
                  color: isToday ? 'var(--primary)' : 'var(--ink-muted)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {isToday ? 'Today' : formatDayLabel(d.date)}
              </span>
            </div>
          );
        })}
      </div>
    </BentoTile>
  );
}
