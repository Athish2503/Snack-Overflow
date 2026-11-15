'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';

export function BrowseAllSnacksBar() {
  return (
    <Link
      href="/snacks"
      className="sticker focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        border: 'var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        textDecoration: 'none',
        color: 'var(--ink)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--surface-2)',
            border: '1.5px solid var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
          aria-hidden="true"
        >
          <Package size={20} strokeWidth={2.4} />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-bricolage), sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--ink)',
          }}
        >
          Browse all snacks
        </span>
      </div>

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--primary)',
          color: 'var(--ink)',
          border: '2px solid var(--ink)',
          boxShadow: '2px 2px 0 var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <ArrowRight size={20} />
      </div>
    </Link>
  );
}
