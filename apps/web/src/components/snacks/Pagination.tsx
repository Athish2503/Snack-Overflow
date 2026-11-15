'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '@/lib/types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) return null;

  // Build page array with ellipses
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 28,
        marginBottom: 20,
      }}
    >
      {/* ── Desktop Pager (md+) ── */}
      <div id="desktop-pager" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="sticker focus-ring"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '2px solid var(--ink)',
            boxShadow: 'var(--shadow)',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            opacity: page <= 1 ? 0.4 : 1,
            color: 'var(--ink)',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page pills */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  width: 36,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-muted)',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                …
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === page;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              className="sticker focus-ring"
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--accent)' : 'var(--surface)',
                color: isActive ? '#ffffff' : 'var(--ink)',
                border: '2px solid var(--ink)',
                boxShadow: isActive ? 'none' : 'var(--shadow)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                transform: isActive ? 'translate(2px, 2px)' : undefined,
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="sticker focus-ring"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '2px solid var(--ink)',
            boxShadow: 'var(--shadow)',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages ? 0.4 : 1,
            color: 'var(--ink)',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Mobile Pager (< md) ── */}
      <div
        id="mobile-pager"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="sticker focus-ring"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '2px solid var(--ink)',
            boxShadow: 'var(--shadow)',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            opacity: page <= 1 ? 0.4 : 1,
            fontWeight: 800,
            fontSize: 14,
            color: 'var(--ink)',
          }}
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="sticker focus-ring"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '2px solid var(--ink)',
            boxShadow: 'var(--shadow)',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages ? 0.4 : 1,
            fontWeight: 800,
            fontSize: 14,
            color: 'var(--ink)',
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) {
          #desktop-pager { display: none !important; }
          #mobile-pager { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
