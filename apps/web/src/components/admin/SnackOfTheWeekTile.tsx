'use client';

import React, { useState } from 'react';
import { Crown, Flame, ThumbsUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BentoTile } from './BentoTile';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/lib/snackHelpers';
import { api } from '@/lib/api';
import { Snack } from '@/lib/types';

interface SnackOfTheWeekTileProps {
  snack: Snack | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

export function SnackOfTheWeekTile({
  snack,
  isLoading,
  isError,
  onRetry,
  staggerIndex = 3,
}: SnackOfTheWeekTileProps) {
  const queryClient = useQueryClient();
  const [isRestocking, setIsRestocking] = useState(false);

  const handleQuickRestock = async () => {
    if (!snack) return;
    setIsRestocking(true);
    try {
      await api.post(`/snacks/${snack.id}/restock`, { amount: 10 });
      toast.success(`Restocked +10 ${snack.name}`);
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
    } catch {
      toast.error(`Failed to restock ${snack.name}`);
    } finally {
      setIsRestocking(false);
    }
  };

  const isLowOrGone = snack ? snack.quantity <= snack.lowStockThreshold : false;

  return (
    <BentoTile
      title="Snack of the Week"
      icon={<Crown size={20} color="var(--primary)" />}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      staggerIndex={staggerIndex}
      badge={
        <span
          className="badge"
          style={{
            background: 'var(--primary-soft)',
            color: 'var(--ink)',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          Most Voted
        </span>
      }
    >
      {!snack ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 110,
            color: 'var(--ink-muted)',
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          No votes cast yet this week. Team hasn&apos;t picked a champion yet!
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            height: '100%',
            minHeight: 110,
          }}
        >
          {/* Left: Thumbnail & Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0 var(--ink)',
                overflow: 'hidden',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {snack.imageUrl ? (
                <img
                  src={snack.imageUrl}
                  alt={snack.name}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <CategoryIcon category={snack.category} size={32} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 900,
                  color: 'var(--ink)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {snack.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Vote Count Chip */}
                <span
                  className="badge"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    fontWeight: 800,
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ThumbsUp size={12} strokeWidth={2.8} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                    {snack.voteCount}
                  </span>{' '}
                  votes
                </span>

                {/* Calories Chip */}
                {snack.calories !== null && snack.calories !== undefined && (
                  <span
                    className="badge"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--ink)',
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Flame size={12} color="var(--primary)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                      {snack.calories}
                    </span>{' '}
                    kcal
                  </span>
                )}

                {/* Stock Status */}
                <StatusBadge status={snack.status} />
              </div>
            </div>
          </div>

          {/* Right: Low/Gone Restock shortcut */}
          {isLowOrGone && (
            <div style={{ flexShrink: 0 }}>
              <button
                type="button"
                disabled={isRestocking}
                onClick={handleQuickRestock}
                className="sticker focus-ring"
                style={{
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  background: 'var(--primary)',
                  color: 'var(--ink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  minHeight: 40,
                }}
              >
                <Plus size={14} strokeWidth={3} />
                {isRestocking ? 'Restocking...' : 'Restock +10'}
              </button>
            </div>
          )}
        </div>
      )}
    </BentoTile>
  );
}
