'use client';

import React from 'react';
import Link from 'next/link';

interface PantryPulseProps {
  stocked: number;
  runningLow: number;
  gone: number;
}

export function PantryPulse({ stocked, runningLow, gone }: PantryPulseProps) {
  const total = stocked + runningLow + gone;

  // Segment widths in percentage; if total is 0, render empty placeholder
  const stockedPct = total > 0 ? (stocked / total) * 100 : 0;
  const runningLowPct = total > 0 ? (runningLow / total) * 100 : 0;
  const gonePct = total > 0 ? (gone / total) * 100 : 0;

  return (
    <div
      className="sticker"
      style={{
        background: 'var(--surface)',
        border: 'var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: 'var(--ink-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--stocked)',
              display: 'inline-block',
              boxShadow: '0 0 0 2px var(--surface), 0 0 0 4px rgba(46, 178, 122, 0.25)',
            }}
          />
          Pantry Pulse
        </span>

        {/* Clickable quick status filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
        >
          <Link
            href="/snacks?status=stocked"
            className="hover:underline focus-ring"
            style={{
              color: 'var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
            title="Filter by stocked snacks"
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: 'var(--stocked)',
                border: '1px solid var(--ink)',
              }}
            />
            <span>{stocked} ready</span>
          </Link>

          <span style={{ color: 'var(--ink-muted)', opacity: 0.5 }}>·</span>

          <Link
            href="/snacks?status=running_low"
            className="hover:underline focus-ring"
            style={{
              color: 'var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
            title="Filter by running low snacks"
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: 'var(--running-low)',
                border: '1px solid var(--ink)',
              }}
            />
            <span>{runningLow} running low</span>
          </Link>

          <span style={{ color: 'var(--ink-muted)', opacity: 0.5 }}>·</span>

          <Link
            href="/snacks?status=gone"
            className="hover:underline focus-ring"
            style={{
              color: 'var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
            title="Filter by gone snacks"
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: 'var(--gone)',
                border: '1px solid var(--ink)',
              }}
            />
            <span>{gone} gone</span>
          </Link>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 14,
          borderRadius: 100,
          background: 'var(--surface-2)',
          border: '2px solid var(--ink)',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {total === 0 ? (
          <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />
        ) : (
          <>
            {stocked > 0 && (
              <Link
                href="/snacks?status=stocked"
                style={{
                  width: `${stockedPct}%`,
                  height: '100%',
                  background: 'var(--stocked)',
                  borderRight: runningLow > 0 || gone > 0 ? '1.5px solid var(--ink)' : 'none',
                  transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'block',
                }}
                title={`${stocked} ready (${Math.round(stockedPct)}%)`}
                aria-label={`${stocked} ready items`}
              />
            )}
            {runningLow > 0 && (
              <Link
                href="/snacks?status=running_low"
                style={{
                  width: `${runningLowPct}%`,
                  height: '100%',
                  background: 'var(--running-low)',
                  borderRight: gone > 0 ? '1.5px solid var(--ink)' : 'none',
                  transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'block',
                }}
                title={`${runningLow} running low (${Math.round(runningLowPct)}%)`}
                aria-label={`${runningLow} running low items`}
              />
            )}
            {gone > 0 && (
              <Link
                href="/snacks?status=gone"
                style={{
                  width: `${gonePct}%`,
                  height: '100%',
                  background: 'var(--gone)',
                  transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'block',
                }}
                title={`${gone} gone (${Math.round(gonePct)}%)`}
                aria-label={`${gone} gone items`}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
