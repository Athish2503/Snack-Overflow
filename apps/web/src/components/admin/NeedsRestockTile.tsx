'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BentoTile } from './BentoTile';
import { EmojiBurst } from './EmojiBurst';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/lib/snackHelpers';
import { api } from '@/lib/api';
import { AdminNeedsRestockItem, AdminDashboardResponse } from '@/lib/types';

interface NeedsRestockTileProps {
  snacks?: AdminNeedsRestockItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

export function NeedsRestockTile({
  snacks = [],
  isLoading,
  isError,
  onRetry,
  staggerIndex = 1,
}: NeedsRestockTileProps) {
  const queryClient = useQueryClient();
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Record<string, number>>({});
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());

  const handleQuickRestock = async (snack: AdminNeedsRestockItem, amount: number) => {
    setRestockingId(snack.id);

    // Snapshot previous dashboard data for rollback
    const previousData = queryClient.getQueryData<AdminDashboardResponse>(['admin-dashboard']);

    // Optimistic update
    queryClient.setQueryData<AdminDashboardResponse>(['admin-dashboard'], (old) => {
      if (!old) return old;
      const updatedNeeds = old.needsRestock.map((item) => {
        if (item.id === snack.id) {
          const newQty = item.quantity + amount;
          return {
            ...item,
            quantity: newQty,
            status: (newQty === 0 ? 'gone' : 'low') as 'gone' | 'low',
          };
        }
        return item;
      });

      return {
        ...old,
        needsRestock: updatedNeeds,
      };
    });

    const isNowStocked = snack.quantity + amount > snack.lowStockThreshold;
    if (isNowStocked) {
      setCollapsingIds((prev) => new Set(prev).add(snack.id));
    }

    try {
      await api.post(`/snacks/${snack.id}/restock`, { amount });

      // Trigger emoji burst from quantity
      setBursts((prev) => ({ ...prev, [snack.id]: Date.now() }));
      toast.success(`Restocked +${amount} ${snack.name}`);

      // Invalidate relevant queries in the background
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
    } catch {
      // Rollback
      if (previousData) {
        queryClient.setQueryData(['admin-dashboard'], previousData);
      }
      setCollapsingIds((prev) => {
        const next = new Set(prev);
        next.delete(snack.id);
        return next;
      });
      toast.error(`Failed to restock ${snack.name}`);
    } finally {
      setRestockingId(null);
    }
  };

  const visibleSnacks = snacks.filter((s) => !collapsingIds.has(s.id) || s.quantity <= s.lowStockThreshold);

  return (
    <BentoTile
      id="needs-restock"
      title="Needs Restock"
      icon={<AlertTriangle size={20} color="var(--gone)" />}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      badge={
        snacks.length > 0 ? (
          <span
            className="badge"
            style={{
              background: 'var(--gone-soft)',
              color: 'var(--gone-ink)',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {snacks.length}
          </span>
        ) : undefined
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          height: '100%',
          overflowY: 'auto',
          maxHeight: 380,
          paddingRight: 4,
        }}
        aria-live="polite"
      >
        <style>{`
          .restock-row {
            transition: all 420ms cubic-bezier(.22, 1, .36, 1);
          }
          .restock-row.collapsing {
            opacity: 0;
            transform: scaleY(0);
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
            margin: 0;
            border-width: 0;
            overflow: hidden;
          }
          .quick-chip {
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 800;
            border-radius: var(--radius-sm);
            border: 1.5px solid var(--ink);
            background: var(--surface);
            color: var(--ink);
            cursor: pointer;
            transition: transform 120ms ease-out, background 120ms ease-out;
            font-family: var(--font-mono);
            font-variant-numeric: tabular-nums;
            min-height: 28px;
            min-width: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .quick-chip:hover {
            transform: translateY(-1px);
            background: var(--primary);
            color: var(--ink);
          }
          .quick-chip:active {
            transform: translateY(1px);
          }
          .quick-chip:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>

        {visibleSnacks.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center',
              height: '100%',
              minHeight: 180,
              gap: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--stocked-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--stocked-ink)',
                border: '2px solid var(--ink)',
              }}
            >
              <CheckCheck size={24} />
            </div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
              All stocked. Nice pantry.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
              No snacks are currently out of stock or below threshold.
            </p>
          </div>
        ) : (
          visibleSnacks.map((snack) => {
            const isCollapsing = collapsingIds.has(snack.id) && snack.quantity > snack.lowStockThreshold;
            const isRowRestocking = restockingId === snack.id;

            return (
              <div
                key={snack.id}
                className={`restock-row ${isCollapsing ? 'collapsing' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--ink)',
                  background: snack.quantity === 0 ? 'var(--gone-soft)' : 'var(--surface-2)',
                  position: 'relative',
                }}
              >
                {/* Top Row: Thumbnail + Name + Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--ink)',
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {snack.imageUrl ? (
                        <img
                          src={snack.imageUrl}
                          alt={snack.name}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      ) : (
                        <CategoryIcon category={snack.category} size={16} />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={snack.name}
                    >
                      {snack.name}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={snack.status} />
                  </div>
                </div>

                {/* Bottom Row: Quantity + Quick-restock chips */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    paddingTop: 4,
                    borderTop: '1px dashed rgba(27, 27, 47, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 900,
                          color: snack.quantity === 0 ? 'var(--gone-ink)' : 'var(--running-low-ink)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {snack.quantity} left
                      </span>
                      {bursts[snack.id] && <EmojiBurst burstId={bursts[snack.id]} />}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                      (min {snack.lowStockThreshold})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      disabled={isRowRestocking}
                      onClick={() => handleQuickRestock(snack, 5)}
                      className="quick-chip focus-ring"
                      aria-label={`Restock 5 of ${snack.name}`}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      disabled={isRowRestocking}
                      onClick={() => handleQuickRestock(snack, 10)}
                      className="quick-chip focus-ring"
                      aria-label={`Restock 10 of ${snack.name}`}
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      disabled={isRowRestocking}
                      onClick={() => handleQuickRestock(snack, 25)}
                      className="quick-chip focus-ring"
                      aria-label={`Restock 25 of ${snack.name}`}
                    >
                      +25
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </BentoTile>
  );
}
