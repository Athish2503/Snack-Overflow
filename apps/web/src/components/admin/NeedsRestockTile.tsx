'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCheck, PlusCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BentoTile } from './BentoTile';
import { EmojiBurst } from './EmojiBurst';
import { StatusBadge } from '@/components/ui/Badge';
import { SnackImage } from '@/components/ui/SnackImage';
import { RestockModal } from './RestockModal';
import { api } from '@/lib/api';
import { AdminNeedsRestockItem, AdminDashboardResponse, Snack } from '@/lib/types';

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
  const [confirmChip, setConfirmChip] = useState<{ id: string; amount: number } | null>(null);
  const [isRestockAnyOpen, setIsRestockAnyOpen] = useState(false);

  // Revert confirm chip after 3s
  useEffect(() => {
    if (!confirmChip) return;
    const timer = setTimeout(() => {
      setConfirmChip(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmChip]);

  const handleQuickRestock = async (snack: AdminNeedsRestockItem, amount: number) => {
    // If amount >= 25 and not yet confirmed, require a second tap
    if (amount >= 25 && (!confirmChip || confirmChip.id !== snack.id || confirmChip.amount !== amount)) {
      setConfirmChip({ id: snack.id, amount });
      return;
    }
    setConfirmChip(null);
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
  // Show top 4 by urgency without inner scrollbars
  const top4Snacks = visibleSnacks.slice(0, 4);

  return (
    <>
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
            justifyContent: 'space-between',
            height: '100%',
            gap: 12,
          }}
          aria-live="polite"
        >
          <style>{`
            .restock-row-grid {
              display: grid;
              grid-template-rows: 1fr;
              transition: grid-template-rows 420ms cubic-bezier(.22, 1, .36, 1), opacity 320ms ease;
            }
            .restock-row-grid.collapsing {
              grid-template-rows: 0fr;
              opacity: 0;
              margin: 0 !important;
              padding: 0 !important;
              border-width: 0 !important;
              pointer-events: none;
            }
            .restock-row-content {
              overflow: hidden;
              display: flex;
              flex-direction: column;
              gap: 6px;
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
              font-family: var(--font-jetbrains-mono), monospace;
              font-variant-numeric: tabular-nums;
              min-height: 28px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              white-space: nowrap;
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
            .quick-chip-smart {
              background: #FFF0B8;
              color: var(--ink);
              font-weight: 900;
              border: 1.5px solid var(--ink);
            }
            .quick-chip-confirm {
              background: var(--primary);
              color: var(--ink);
              font-weight: 900;
              animation: pulse 1s ease-in-out infinite;
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
                flex: 1,
                minHeight: 200,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top4Snacks.map((snack) => {
                const isCollapsing = collapsingIds.has(snack.id) && snack.quantity > snack.lowStockThreshold;
                const isRowRestocking = restockingId === snack.id;

                // Smart restock math from backend or formula fallback
                const smartAmount = snack.suggestedRestock?.amount ?? Math.max(1, 2 * snack.lowStockThreshold - snack.quantity);
                const smartTarget = snack.suggestedRestock?.target ?? (snack.quantity + smartAmount);

                const isConfirming25 = confirmChip?.id === snack.id && confirmChip.amount === 25;

                return (
                  <div
                    key={snack.id}
                    className={`restock-row-grid ${isCollapsing ? 'collapsing' : ''}`}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--ink)',
                      background: snack.quantity === 0 ? 'var(--gone-soft)' : 'var(--surface-2)',
                      padding: isCollapsing ? 0 : '10px 12px',
                    }}
                  >
                    <div className="restock-row-content">
                      {/* Line 1: Full snack name (2-line clamp, title) + status badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-sm)',
                              border: '1.5px solid var(--ink)',
                              overflow: 'hidden',
                              background: 'var(--surface)',
                              flexShrink: 0,
                            }}
                          >
                            <SnackImage
                              src={snack.imageUrl}
                              alt={snack.name}
                              category={snack.category}
                              width="100%"
                              height="100%"
                              iconSize={18}
                            />
                          </div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 800,
                              color: 'var(--ink)',
                              lineHeight: 1.25,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                            }}
                            title={snack.name}
                          >
                            {snack.name}
                          </h3>
                        </div>
                        <div style={{ flexShrink: 0, marginTop: 1 }}>
                          <StatusBadge status={snack.status} />
                        </div>
                      </div>

                      {/* Line 2: "N left · min M" in mono on ONE line */}
                      <div
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                          fontSize: 12,
                          fontWeight: 800,
                          color: snack.quantity === 0 ? 'var(--gone-ink)' : 'var(--running-low-ink)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          whiteSpace: 'nowrap',
                          marginTop: 2,
                        }}
                      >
                        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                          {snack.quantity} left
                          {bursts[snack.id] && <EmojiBurst burstId={bursts[snack.id]} />}
                        </span>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>&middot;</span>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>min {snack.lowStockThreshold}</span>
                      </div>

                      {/* Line 3: Chips (+X -> Y smart chip first, then +5, +10, +25 with confirm) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          flexWrap: 'wrap',
                          marginTop: 2,
                        }}
                      >
                        {/* Smart chip +X -> Y */}
                        <button
                          type="button"
                          disabled={isRowRestocking}
                          onClick={() => handleQuickRestock(snack, smartAmount)}
                          className="quick-chip quick-chip-smart focus-ring"
                          title={`Add ${smartAmount} to reach target of ${smartTarget}`}
                          aria-label={`Restock +${smartAmount} to reach ${smartTarget} for ${snack.name}`}
                        >
                          +{smartAmount} &rarr; {smartTarget}
                        </button>

                        {/* +5 chip */}
                        <button
                          type="button"
                          disabled={isRowRestocking}
                          onClick={() => handleQuickRestock(snack, 5)}
                          className="quick-chip focus-ring"
                          aria-label={`Restock 5 of ${snack.name}`}
                        >
                          +5
                        </button>

                        {/* +10 chip */}
                        <button
                          type="button"
                          disabled={isRowRestocking}
                          onClick={() => handleQuickRestock(snack, 10)}
                          className="quick-chip focus-ring"
                          aria-label={`Restock 10 of ${snack.name}`}
                        >
                          +10
                        </button>

                        {/* +25 chip (with 3-second confirm tap) */}
                        <button
                          type="button"
                          disabled={isRowRestocking}
                          onClick={() => handleQuickRestock(snack, 25)}
                          className={`quick-chip ${isConfirming25 ? 'quick-chip-confirm' : ''} focus-ring`}
                          aria-label={`Restock 25 of ${snack.name}`}
                        >
                          {isConfirming25 ? 'Confirm +25' : '+25'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: View all (N) + Restock any snack link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {visibleSnacks.length > 4 ? (
              <Link
                href="/snacks?status=running_low"
                style={{
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>View all ({visibleSnacks.length})</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                {visibleSnacks.length} urgent item{visibleSnacks.length === 1 ? '' : 's'}
              </span>
            )}

            {/* Restock any snack shortcut */}
            <button
              type="button"
              onClick={() => setIsRestockAnyOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 6px',
              }}
            >
              <PlusCircle size={15} />
              <span>Restock any snack</span>
            </button>
          </div>
        </div>
      </BentoTile>

      {/* Restock any snack modal with picker */}
      <RestockModal
        isOpen={isRestockAnyOpen}
        onClose={() => setIsRestockAnyOpen(false)}
        snack={top4Snacks.length > 0 ? (top4Snacks[0] as unknown as Snack) : null}
      />
    </>
  );
}
