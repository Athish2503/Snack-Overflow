'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, ArrowDown, Plus } from 'lucide-react';

interface AdminControlHeaderProps {
  adminName: string;
  goneCount: number;
  lowCount: number;
  dataUpdatedAt?: number;
  onAddSnackClick: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function AdminControlHeader({
  adminName,
  goneCount,
  lowCount,
  onAddSnackClick,
}: AdminControlHeaderProps) {
  const needsAttention = goneCount > 0 || lowCount > 0;

  const scrollToNeedsRestock = () => {
    const el = document.getElementById('needs-restock');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const alertParts: string[] = [];
  if (goneCount > 0) alertParts.push(`${goneCount} gone`);
  if (lowCount > 0) alertParts.push(`${lowCount} below threshold`);
  const alertText = alertParts.join(', ');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '0 0 4px',
              lineHeight: 1.15,
            }}
          >
            {getGreeting()}, {adminName} 👋
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            Pantry Control Room • Live Overview
          </p>
        </div>

        {/* Right Header Actions: Alert Banner + Primary + Add snack Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Alert banner / Telemetry pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--ink)',
              boxShadow: '3px 3px 0 var(--ink)',
              background: needsAttention ? 'var(--gone-soft)' : 'var(--stocked-soft)',
              color: needsAttention ? 'var(--gone-ink)' : 'var(--stocked-ink)',
              fontSize: 13,
              fontWeight: 800,
              minHeight: 44,
              flexWrap: 'wrap',
              maxWidth: '100%',
            }}
          >
            {needsAttention ? (
              <>
                <AlertCircle size={18} strokeWidth={2.8} />
                <span>{alertText}</span>
                <button
                  type="button"
                  onClick={scrollToNeedsRestock}
                  className="sticker focus-ring"
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 900,
                    background: 'var(--primary)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    minHeight: 32,
                    marginLeft: 4,
                  }}
                >
                  Restock now
                  <ArrowDown size={14} strokeWidth={3} />
                </button>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} strokeWidth={2.8} />
                <span>All items stocked</span>
              </>
            )}
          </div>

          {/* Primary + Add snack Button */}
          <button
            type="button"
            onClick={onAddSnackClick}
            className="sticker focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--primary)',
              color: 'var(--ink)',
              border: '2px solid var(--ink)',
              boxShadow: '3.5px 3.5px 0 var(--ink)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <Plus size={18} strokeWidth={3} />
            <span> Add snack</span>
          </button>
        </div>
      </div>
    </div>
  );
}
