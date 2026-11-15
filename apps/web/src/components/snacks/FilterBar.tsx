'use client';

import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { SnackCategory, SnackStatus } from '@/lib/types';
import { CATEGORIES } from '@/lib/snackHelpers';

interface FilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  category?: SnackCategory;
  onCategoryChange: (category?: SnackCategory) => void;
  status?: SnackStatus;
  onStatusChange: (status?: SnackStatus) => void;
  sortBy?: 'name' | 'quantity' | 'createdAt' | 'votes';
  onSortChange: (sort?: 'name' | 'quantity' | 'createdAt' | 'votes') => void;
  onClearAll: () => void;
}

export function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sortBy = 'name',
  onSortChange,
  onClearAll,
}: FilterBarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeFiltersCount = (category ? 1 : 0) + (status ? 1 : 0) + (search ? 1 : 0);

  const statusLabels: Record<SnackStatus, string> = {
    stocked: 'Stocked',
    running_low: 'Running low',
    gone: 'Gone',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Main controls row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Search input */}
        <div
          style={{
            flex: 1,
            minWidth: 220,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--surface)',
            border: '2px solid var(--ink)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <Search size={18} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search snacks..."
            aria-label="Search snacks"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: 15,
              color: 'var(--ink)',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
                padding: 2,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Desktop Filter Dropdowns */}
        <div id="desktop-filters" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Category Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={category || ''}
              onChange={(e) => onCategoryChange(e.target.value ? (e.target.value as SnackCategory) : undefined)}
              aria-label="Filter by category"
              className="sticker focus-ring"
              style={{
                appearance: 'none',
                background: 'var(--surface)',
                border: '2px solid var(--ink)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow)',
                padding: '10px 36px 10px 14px',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <option value="">All Categories</option>
              <option value="SWEET">Sweet</option>
              <option value="SAVOURY">Savoury</option>
              <option value="DRINK">Drink</option>
              <option value="HEALTHY_ISH">Healthy-ish</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={status || ''}
              onChange={(e) => onStatusChange(e.target.value ? (e.target.value as SnackStatus) : undefined)}
              aria-label="Filter by status"
              className="sticker focus-ring"
              style={{
                appearance: 'none',
                background: 'var(--surface)',
                border: '2px solid var(--ink)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow)',
                padding: '10px 36px 10px 14px',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <option value="">All Statuses</option>
              <option value="stocked">Stocked</option>
              <option value="running_low">Running low</option>
              <option value="gone">Gone</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'name' | 'quantity' | 'createdAt' | 'votes')}
              aria-label="Sort snacks"
              className="sticker focus-ring"
              style={{
                appearance: 'none',
                background: 'var(--surface)',
                border: '2px solid var(--ink)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow)',
                padding: '10px 36px 10px 14px',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <option value="name">Sort: Name (A–Z)</option>
              <option value="votes">Sort: Most Voted</option>
              <option value="quantity">Sort: Stock Quantity</option>
              <option value="createdAt">Sort: Recently Added</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* Mobile Filter Trigger Button */}
        <div id="mobile-filter-trigger" style={{ display: 'none' }}>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="sticker focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: activeFiltersCount > 0 ? 'var(--primary)' : 'var(--surface)',
              color: 'var(--ink)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow)',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <SlidersHorizontal size={16} />
            Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </button>
        </div>
      </div>

      {/* ── Active Chips Row ── */}
      {activeFiltersCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {category && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'var(--primary-soft)',
                color: 'var(--ink)',
                fontSize: 12,
                fontWeight: 700,
                border: '1.5px solid var(--primary)',
              }}
            >
              Category: {CATEGORIES[category]?.label || category}
              <button
                type="button"
                onClick={() => onCategoryChange(undefined)}
                aria-label="Remove category filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  color: 'var(--ink)',
                }}
              >
                <X size={13} />
              </button>
            </span>
          )}

          {status && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 700,
                border: '1.5px solid var(--accent)',
              }}
            >
              Status: {statusLabels[status] || status}
              <button
                type="button"
                onClick={() => onStatusChange(undefined)}
                aria-label="Remove status filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  color: 'var(--accent)',
                }}
              >
                <X size={13} />
              </button>
            </span>
          )}

          {search && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: 12,
                fontWeight: 700,
                border: '1.5px solid var(--ink)',
              }}
            >
              Search: &ldquo;{search}&rdquo;
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Remove search filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  color: 'var(--ink)',
                }}
              >
                <X size={13} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--primary)',
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'underline',
              padding: '4px 6px',
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Mobile Filter Bottom Sheet ── */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(27,27,47,0.5)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderTop: 'var(--border)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxHeight: '85dvh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  fontSize: 20,
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                Filter Snacks
              </h3>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Select */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Category
              </label>
              <select
                value={category || ''}
                onChange={(e) => onCategoryChange(e.target.value ? (e.target.value as SnackCategory) : undefined)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--ink)',
                  background: 'var(--surface-2)',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <option value="">All Categories</option>
                <option value="SWEET">Sweet</option>
                <option value="SAVOURY">Savoury</option>
                <option value="DRINK">Drink</option>
                <option value="HEALTHY_ISH">Healthy-ish</option>
              </select>
            </div>

            {/* Status Select */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Status
              </label>
              <select
                value={status || ''}
                onChange={(e) => onStatusChange(e.target.value ? (e.target.value as SnackStatus) : undefined)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--ink)',
                  background: 'var(--surface-2)',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <option value="">All Statuses</option>
                <option value="stocked">Stocked</option>
                <option value="running_low">Running low</option>
                <option value="gone">Gone</option>
              </select>
            </div>

            {/* Sort Select */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as 'name' | 'quantity' | 'createdAt' | 'votes')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--ink)',
                  background: 'var(--surface-2)',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <option value="name">Name (A–Z)</option>
                <option value="votes">Most Voted</option>
                <option value="quantity">Stock Quantity</option>
                <option value="createdAt">Recently Added</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setMobileDrawerOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '2px solid var(--ink)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary)',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--shadow)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Filter Switcher CSS */}
      <style>{`
        @media (max-width: 767px) {
          #desktop-filters { display: none !important; }
          #mobile-filter-trigger { display: block !important; }
        }
      `}</style>
    </div>
  );
}
