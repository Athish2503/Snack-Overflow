'use client';

import React, { useState } from 'react';
import { Heart, Minus, Plus, Flame, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Snack } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { CATEGORIES, CategoryIcon, getStockRatio } from '@/lib/snackHelpers';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCart } from '@/contexts/CartContext';
import { ImageCarousel } from '@/components/ui/ImageCarousel';

interface SnackCardProps {
  snack: Snack;
  onUpdated?: () => void;
  onSelect?: (snack: Snack) => void;
}

export function SnackCard({ snack, onUpdated, onSelect }: SnackCardProps) {
  const queryClient = useQueryClient();
  const { addToCart, getItemQuantity } = useCart();
  const [amount, setAmount] = useState(1);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  // Local optimistic vote state
  const [localVote, setLocalVote] = useState<{ id: string; hasVoted: boolean; voteCount: number } | null>(null);
  const optimisticVote = (localVote && localVote.id === snack.id)
    ? localVote
    : { id: snack.id, hasVoted: snack.hasVoted, voteCount: snack.voteCount };

  const isGone = snack.quantity <= 0;
  const isRunningLow = snack.status === 'running_low';
  const categoryMeta = CATEGORIES[snack.category] ?? CATEGORIES.SWEET;
  const ratio = getStockRatio(snack.quantity, snack.lowStockThreshold);
  const inCartQty = getItemQuantity(snack.id);

  const snackImages = (snack.images && snack.images.length > 0)
    ? snack.images
    : (snack.imageUrl ? [snack.imageUrl] : []);

  // Meter color
  const meterColor = isGone
    ? 'var(--gone)'
    : isRunningLow
    ? 'var(--running-low)'
    : 'var(--stocked)';

  // Handle vote toggle
  async function handleVoteToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isVoting) return;
    setIsVoting(true);
    setHeartAnim(true);

    const prevVoted = optimisticVote.hasVoted;
    const prevCount = optimisticVote.voteCount;
    const nextVoted = !prevVoted;
    const nextCount = nextVoted ? prevCount + 1 : Math.max(0, prevCount - 1);

    // Optimistic update
    setLocalVote({ id: snack.id, hasVoted: nextVoted, voteCount: nextCount });

    try {
      if (nextVoted) {
        await api.post(`/snacks/${snack.id}/vote`);
      } else {
        await api.delete(`/snacks/${snack.id}/vote`);
      }
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
    } catch (err) {
      // Rollback
      setLocalVote({ id: snack.id, hasVoted: prevVoted, voteCount: prevCount });
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Vote conflict: your vote was already recorded.');
      } else {
        toast.error('Could not update vote. Please try again.');
      }
    } finally {
      setIsVoting(false);
      setTimeout(() => setHeartAnim(false), 300);
    }
  }

  // Handle consume action
  async function handleConsume() {
    if (isConsuming || isGone) return;
    if (amount <= 0) return;

    setIsConsuming(true);
    try {
      await api.post(`/snacks/${snack.id}/consume`, { amount });
      toast.success(`You consumed ${amount} packet${amount > 1 ? 's' : ''} of ${snack.name}!`);
      setAmount(1);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);

        toast.error('Someone beat you to the last packet! Refreshing inventory...', {
          action: {
            label: 'Refresh',
            onClick: () => {
              queryClient.invalidateQueries({ queryKey: ['snacks'] });
              queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
            },
          },
        });
        queryClient.invalidateQueries({ queryKey: ['snacks'] });
        queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to consume snack.');
      }
    } finally {
      setIsConsuming(false);
    }
  }

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const success = addToCart(snack, amount, rect);
    if (success) {
      toast.success(`Added ${amount}x ${snack.name} to bag!`);
    } else {
      toast.error(`Max available stock in pantry is ${snack.quantity}`);
    }
  };

  return (
    <div
      className={`card sticker ${isShaking ? 'card-conflict-shake' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        opacity: isGone ? 0.78 : 1,
        background: isGone ? 'var(--surface-2)' : 'var(--surface)',
        transition: 'transform 100ms ease, box-shadow 100ms ease',
      }}
    >
      {/* Gone Stamp Overlay */}
      {isGone && (
        <div className="gone-stamp" aria-label="Out of stock">
          GONE
        </div>
      )}

      <div>
        {/* Uniform Snack Image Container with Multi-Image Carousel */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 154,
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--ink)',
            overflow: 'hidden',
            marginBottom: 12,
            background: categoryMeta.bgSoft,
            cursor: onSelect ? 'pointer' : 'default',
          }}
          onClick={() => onSelect?.(snack)}
        >
          <ImageCarousel
            images={snackImages}
            heightClass="h-full"
            fallbackCategory={snack.category}
            alt={snack.name}
            showIndicators={snackImages.length > 1}
            showArrows={snackImages.length > 1}
            overlayBadge={
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    border: '1.5px solid var(--ink)',
                    boxShadow: '1.5px 1.5px 0 var(--ink)',
                  }}
                >
                  <CategoryIcon category={snack.category} size={13} />
                  {categoryMeta.label}
                </span>

                {snack.calories !== null && snack.calories !== undefined && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      color: 'var(--ink)',
                      border: '1.5px solid var(--ink)',
                      boxShadow: '1.5px 1.5px 0 var(--ink)',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                    }}
                  >
                    <Flame size={12} color="var(--primary)" fill="var(--primary)" />
                    {snack.calories} kcal
                  </span>
                )}
              </div>
            }
            topRightBadge={
              <button
                type="button"
                onClick={handleVoteToggle}
                disabled={isVoting}
                className="focus-ring"
                aria-label={`${optimisticVote.hasVoted ? 'Remove vote from' : 'Vote for'} ${snack.name}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 9px',
                  borderRadius: 100,
                  background: optimisticVote.hasVoted ? 'var(--accent-soft)' : 'var(--surface)',
                  border: `1.5px solid ${optimisticVote.hasVoted ? 'var(--accent)' : 'var(--ink)'}`,
                  boxShadow: '1.5px 1.5px 0 var(--ink)',
                  cursor: 'pointer',
                  color: optimisticVote.hasVoted ? 'var(--accent)' : 'var(--ink)',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'all 120ms ease',
                }}
              >
                <Heart
                  size={14}
                  className={heartAnim ? 'heart-pop' : ''}
                  fill={optimisticVote.hasVoted ? 'var(--accent)' : 'none'}
                  stroke={optimisticVote.hasVoted ? 'var(--accent)' : 'currentColor'}
                />
                <span>{optimisticVote.voteCount}</span>
              </button>
            }
          />
        </div>

        {/* Snack Name */}
        <h3
          title={snack.name}
          onClick={() => onSelect?.(snack)}
          style={{
            fontSize: 17,
            fontWeight: 800,
            margin: '0 0 10px',
            color: 'var(--ink)',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 43,
            cursor: onSelect ? 'pointer' : 'default',
          }}
        >
          {snack.name}
        </h3>

        {/* Quantity and stock meter */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isRunningLow && <span className="pulse-dot" title="Running low" />}
              <StatusBadge status={snack.status} />
            </div>

            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {snack.quantity}{' '}
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>
                in stock
              </span>
            </div>
          </div>

          {/* Stock Meter */}
          <div className="stock-meter" role="progressbar" aria-valuenow={ratio} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="stock-meter-fill"
              style={{
                width: '100%',
                transform: `scaleX(${ratio / 100})`,
                background: meterColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom action row: Stepper + Consume button */}
      <div>
        {isGone ? (
          <button
            disabled
            style={{
              width: '100%',
              height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
              border: '2px solid rgba(27,27,47,0.2)',
              color: 'var(--ink-muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'not-allowed',
            }}
          >
            Out of stock
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface-2)',
                border: '2px solid var(--ink)',
                borderRadius: 'var(--radius-sm)',
                height: 44,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setAmount((a) => Math.max(1, a - 1))}
                disabled={amount <= 1 || isConsuming}
                aria-label="Decrease amount"
                className="focus-ring"
                style={{
                  width: 36,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: amount <= 1 || isConsuming ? 'not-allowed' : 'pointer',
                  color: 'var(--ink)',
                  opacity: amount <= 1 ? 0.4 : 1,
                }}
              >
                <Minus size={14} />
              </button>

              <input
                type="number"
                min={1}
                max={snack.quantity}
                value={amount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setAmount(Math.min(Math.max(1, val), snack.quantity));
                  }
                }}
                disabled={isConsuming}
                aria-label="Quantity to consume"
                style={{
                  width: 36,
                  textAlign: 'center',
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontWeight: 800,
                  fontSize: 15,
                  color: 'var(--ink)',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums',
                  padding: 0,
                }}
              />

              <button
                type="button"
                onClick={() => setAmount((a) => Math.min(snack.quantity, a + 1))}
                disabled={amount >= snack.quantity || isConsuming}
                aria-label="Increase amount"
                className="focus-ring"
                style={{
                  width: 36,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: amount >= snack.quantity || isConsuming ? 'not-allowed' : 'pointer',
                  color: 'var(--ink)',
                  opacity: amount >= snack.quantity ? 0.4 : 1,
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add to Bag button with smooth flying animation */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isConsuming || inCartQty >= snack.quantity}
              aria-label={`Add ${amount} ${snack.name} to bag`}
              className="sticker focus-ring"
              style={{
                height: 44,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                background: inCartQty > 0 ? 'var(--primary-soft)' : 'var(--surface-2)',
                color: 'var(--ink)',
                border: '2px solid var(--ink)',
                boxShadow: 'var(--shadow)',
                fontSize: 13,
                fontWeight: 800,
                cursor: inCartQty >= snack.quantity ? 'not-allowed' : 'pointer',
                opacity: inCartQty >= snack.quantity ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontFamily: 'var(--font-bricolage), sans-serif',
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={16} strokeWidth={2.4} />
              <span>{inCartQty > 0 ? `In Bag (${inCartQty})` : 'Bag'}</span>
            </button>

            {/* Consume button */}
            <button
              type="button"
              onClick={handleConsume}
              disabled={isConsuming}
              className="sticker focus-ring"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: 'var(--ink)',
                border: '2px solid var(--ink)',
                boxShadow: 'var(--shadow)',
                fontSize: 14,
                fontWeight: 800,
                cursor: isConsuming ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              {isConsuming ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Consuming...</span>
                </>
              ) : (
                'Consume'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
