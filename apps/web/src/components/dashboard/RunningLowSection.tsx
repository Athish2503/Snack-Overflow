'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Utensils, ChevronRight, Sparkles, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Snack } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { CategoryIcon } from '@/lib/snackHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RunningLowSectionProps {
  snacks: Snack[];
  onUpdated?: () => void;
}

export function RunningLowSection({ snacks, onUpdated }: RunningLowSectionProps) {
  const queryClient = useQueryClient();
  const [consumingId, setConsumingId] = useState<string | null>(null);

  async function handleQuickConsume(snack: Snack) {
    if (consumingId) return;
    setConsumingId(snack.id);

    try {
      await api.post(`/snacks/${snack.id}/consume`, { amount: 1 });
      toast.success(`Consumed 1 packet of ${snack.name}!`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Someone beat you to the last packet!', {
          action: {
            label: 'Refresh',
            onClick: () => {
              queryClient.invalidateQueries({ queryKey: ['snacks'] });
              queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
            },
          },
        });
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to consume.');
      }
    } finally {
      setConsumingId(null);
    }
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '24px',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 20,
              fontWeight: 800,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            Running low
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--running-low-ink)',
              background: 'var(--running-low-soft)',
              padding: '2px 8px',
              borderRadius: 100,
            }}
          >
            {snacks.length} items
          </span>
        </div>

        {snacks.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--ink-muted)',
              fontSize: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={28} color="var(--primary)" />
            <span>Pantry is well stocked! No snacks are running low.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {snacks.slice(0, 5).map((snack) => {
              const isPending = consumingId === snack.id;

              return (
                <div
                  key={snack.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)',
                    gap: 12,
                  }}
                >
                  {/* Left: Thumbnail + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'var(--surface)',
                        border: '1.5px solid var(--ink)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {((snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl) ? (
                        <img
                          src={(snack.images && snack.images.length > 0) ? snack.images[0] : snack.imageUrl!}
                          alt={snack.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <CategoryIcon category={snack.category} size={20} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {snack.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: 'var(--ink-muted)',
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                        }}
                      >
                        <span>{snack.quantity} left</span>
                        {snack.calories !== null && snack.calories !== undefined && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <Flame size={10} color="var(--primary)" />
                            {snack.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Low Tag + Consume Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: 'var(--running-low-soft)',
                        color: 'var(--running-low-ink)',
                      }}
                    >
                      ● Low
                    </span>

                    <button
                      type="button"
                      onClick={() => handleQuickConsume(snack)}
                      disabled={isPending || snack.quantity <= 0}
                      className="sticker focus-ring"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        color: 'var(--ink)',
                        border: '1.5px solid var(--ink)',
                        boxShadow: '2px 2px 0 var(--ink)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Utensils size={12} />
                          Consume
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(27,27,47,0.08)' }}>
        <Link
          href="/snacks?status=running_low"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--primary)',
            textDecoration: 'none',
          }}
        >
          View all running low
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
