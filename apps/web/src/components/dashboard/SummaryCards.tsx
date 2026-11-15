'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';

interface SummaryCounts {
  total: number;
  stocked: number;
  running_low: number;
  gone: number;
}

interface SummaryCardsProps {
  counts: SummaryCounts;
}

export function SummaryCards({ counts }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total',
      count: counts.total,
      label: 'items',
      href: '/snacks',
      icon: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            border: '1.5px solid var(--accent)',
          }}
          aria-hidden="true"
        >
          <Package size={20} strokeWidth={2.5} />
        </span>
      ),
    },
    {
      title: 'Stocked',
      count: counts.stocked,
      label: 'items',
      href: '/snacks?status=stocked',
      icon: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--stocked-soft)',
            color: 'var(--stocked-ink)',
            border: '2px solid var(--stocked)',
          }}
          aria-hidden="true"
        >
          <CheckCircle2 size={20} strokeWidth={2.5} />
        </span>
      ),
    },
    {
      title: 'Running Low',
      count: counts.running_low,
      label: 'items',
      href: '/snacks?status=running_low',
      icon: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--running-low-soft)',
            color: 'var(--running-low-ink)',
            border: '2px solid var(--running-low)',
          }}
          aria-hidden="true"
        >
          <AlertTriangle size={18} strokeWidth={2.5} />
        </span>
      ),
    },
    {
      title: 'Gone',
      count: counts.gone,
      label: 'items',
      href: '/snacks?status=gone',
      icon: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--gone-soft)',
            color: 'var(--gone-ink)',
            border: '2px solid var(--gone)',
          }}
          aria-hidden="true"
        >
          <XCircle size={20} strokeWidth={2.5} />
        </span>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}
    >
      {cards.map((c) => (
        <Link
          key={c.title}
          href={c.href}
          className="sticker focus-ring"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            border: 'var(--border)',
            boxShadow: 'var(--shadow)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textDecoration: 'none',
            color: 'var(--ink)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 120,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-muted)' }}>
              {c.title}
            </span>
            {c.icon}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 32,
                  fontWeight: 900,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp end={c.count} />
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>
                {c.label}
              </span>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              View
              <ChevronRight size={14} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
