'use client';

import React, { useState } from 'react';
import { ThumbsUp, Bookmark, Minus, Plus, Flame, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Snack } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { CATEGORIES, CategoryIcon, getStockRatio } from '@/lib/snackHelpers';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCart } from '@/contexts/CartContext';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { fireConfetti, FUNNY_CONSUME_QUIPS, getRandomQuip } from '@/lib/confetti';

interface SnackCardProps {
  snack: Snack;
  onUpdated?: () => void;
  onSelect?: (snack: Snack) => void;
}

export function SnackCard({ snack, onUpdated, onSelect }: SnackCardProps) {
  const queryClient = useQueryClient();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const [amount, setAmount] = useState(1);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [isAddPressed, setIsAddPressed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Local optimistic vote state (Public popularity count)
  const [localVote, setLocalVote] = useState<{ id: string; hasVoted: boolean; voteCount: number } | null>(null);
  const optimisticVote = (localVote && localVote.id === snack.id)
    ? localVote
    : { id: snack.id, hasVoted: snack.hasVoted, voteCount: snack.voteCount };

  // Local optimistic favorite state (Personal bookmark)
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [localFav, setLocalFav] = useState<{ id: string; isFavorite: boolean } | null>(null);
  const optimisticFav = (localFav && localFav.id === snack.id)
    ? localFav.isFavorite
    : Boolean(snack.isFavorite);

  const isGone = snack.quantity <= 0;
  const isRunningLow = snack.status === 'running_low';

  // Calculate if restocked within last 24 hours
  const isRestockedRecently = React.useState(() => {
    if (isGone || !snack.updatedAt) return false;
    const updatedTime = new Date(snack.updatedAt).getTime();
    const createdTime = new Date(snack.createdAt).getTime();
    if (updatedTime - createdTime < 1000) return false;
    return Date.now() - updatedTime < 24 * 60 * 60 * 1000;
  })[0];
  const categoryMeta = CATEGORIES[snack.category] ?? CATEGORIES.SWEET;
  const ratio = getStockRatio(snack.quantity, snack.lowStockThreshold);
  const inCartQty = getItemQuantity(snack.id);
  const availableStock = Math.max(0, snack.quantity - inCartQty);

  const snackImages = (snack.images && snack.images.length > 0)
    ? snack.images
    : (snack.imageUrl ? [snack.imageUrl] : []);

  // Sync stepper when item is already in bag vs new
  // If item is in bag, stepper displays and controls the bag quantity
  const currentStepperValue = inCartQty > 0 ? inCartQty : amount;
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

  // Handle personal favorite bookmark toggle
  async function handleFavoriteToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isFavoriting) return;
    setIsFavoriting(true);

    const prevFav = optimisticFav;
    const nextFav = !prevFav;

    // Optimistic update
    setLocalFav({ id: snack.id, isFavorite: nextFav });

    try {
      if (nextFav) {
        await api.post(`/snacks/${snack.id}/favorite`);
        toast.success(`Saved "${snack.name}" to your favorites!`);
      } else {
        await api.delete(`/snacks/${snack.id}/favorite`);
        toast.info(`Removed "${snack.name}" from your favorites.`);
      }
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      onUpdated?.();
    } catch {
      // Rollback
      setLocalFav({ id: snack.id, isFavorite: prevFav });
      toast.error('Could not update favorites. Please try again.');
    } finally {
      setIsFavoriting(false);
    }
  }

  // Handle consume action
  async function handleConsume(e?: React.MouseEvent) {
    if (isConsuming || isGone) return;
    if (amount <= 0) return;

    // Trigger confetti from the clicked button position
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      fireConfetti({ x: rect.left + rect.width / 2, y: rect.top });
    } else {
      fireConfetti();
    }

    setIsConsuming(true);
    try {
      await api.post(`/snacks/${snack.id}/consume`, { amount });
      const funnyQuip = getRandomQuip(FUNNY_CONSUME_QUIPS);
      toast.success(`Consumed ${amount} packet${amount > 1 ? 's' : ''} of ${snack.name}!`, {
        description: funnyQuip,
        duration: 3500,
      });
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
    if (isGone || availableStock <= 0) return;

    setIsAddPressed(true);
    setTimeout(() => setIsAddPressed(false), 150);

    // Measure visible image rect from center of carousel
    const imageContainer = e.currentTarget.closest('.snack-card')?.querySelector('.snack-image-carousel') as HTMLElement | null;
    let sourceRect: DOMRect | null = null;
    if (imageContainer) {
      sourceRect = imageContainer.getBoundingClientRect();
    } else {
      sourceRect = e.currentTarget.getBoundingClientRect();
    }

    const qtyToAdd = inCartQty > 0 ? 1 : amount;
    const success = addToCart(snack, qtyToAdd, sourceRect);
    if (success) {
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
      }, 700);
    } else {
      toast.error(`Max available stock in pantry is ${snack.quantity}`);
    }
  };

  const handleStepperDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConsuming) return;
    if (inCartQty > 0) {
      updateQuantity(snack.id, inCartQty - 1);
    } else {
      setAmount((a) => Math.max(1, a - 1));
    }
  };

  const handleStepperIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConsuming) return;
    if (inCartQty > 0) {
      if (inCartQty < snack.quantity) {
        updateQuantity(snack.id, inCartQty + 1);
      }
    } else {
      if (amount < availableStock) {
        setAmount((a) => a + 1);
      }
    }
  };

  // Determine button label and appearance
  // idle "Add to bag" -> pressed -> "In bag ✓" (700ms) -> "In bag · N"
  let bagButtonText = 'Add to bag';
  if (justAdded) {
    bagButtonText = 'In bag ✓';
  } else if (inCartQty > 0) {
    bagButtonText = `In bag · ${inCartQty}`;
  }

  // Quip list for casual professional comedic gone state
  const goneQuips = [
    'Restock pending coffee run ☕',
    'Gone faster than a sprint deadline 💨',
    '404: Snack Not Found 🔍',
    'Someone devoured the stash 🦝',
    'Blame the late-night engineers 🦉',
    'Pantry vacuumed clean 🧹',
  ];
  // Deterministic quip selection based on snack ID
  const quipIndex = snack.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % goneQuips.length;
  const goneQuip = goneQuips[quipIndex];

  return (
    <div className="snack-card-container">
      <div
        className={`card sticker snack-card ${isShaking ? 'card-conflict-shake' : ''}`}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
          opacity: isGone ? 0.85 : 1,
          background: isGone ? 'var(--surface-2)' : 'var(--surface)',
        }}
      >
        {/* Gone Stamp Overlay */}
        {isGone && (
          <div className="gone-stripes-banner" aria-label="Out of stock">
            <div className="gone-stripes-tape">
              <span>GONE</span>
            </div>
            <div className="gone-stripes-quip">
              {goneQuip}
            </div>
          </div>
        )}

        <div>
          {/* Uniform Snack Image Container with Multi-Image Carousel */}
          <div
            className="snack-image-carousel"
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
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', maxWidth: '100%' }}>
                  {isRestockedRecently && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#10B981',
                        color: '#ffffff',
                        border: '1.5px solid var(--ink)',
                        boxShadow: '1.5px 1.5px 0 var(--ink)',
                        whiteSpace: 'nowrap',
                      }}
                      title="Restocked in the last 24 hours"
                    >
                      ✨ Restocked
                    </span>
                  )}

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
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    <CategoryIcon category={snack.category} size={13} />
                    <span>{categoryMeta.label}</span>
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Flame size={12} color="var(--primary)" fill="var(--primary)" />
                      {snack.calories} kcal
                    </span>
                  )}
                </div>
              }
              topRightBadge={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Personal Bookmark: Favorite toggle */}
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={isFavoriting}
                    className="focus-ring"
                    aria-label={`${optimisticFav ? 'Remove from' : 'Save to'} favorites`}
                    title={optimisticFav ? 'Favorited' : 'Bookmark as favorite'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 100,
                      background: optimisticFav ? 'var(--accent)' : 'var(--surface)',
                      border: `1.5px solid ${optimisticFav ? 'var(--accent)' : 'var(--ink)'}`,
                      boxShadow: '1.5px 1.5px 0 var(--ink)',
                      cursor: 'pointer',
                      color: optimisticFav ? '#ffffff' : 'var(--ink)',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <Bookmark
                      size={13}
                      fill={optimisticFav ? '#ffffff' : 'none'}
                      stroke={optimisticFav ? '#ffffff' : 'currentColor'}
                    />
                  </button>

                  {/* Public Popularity Signal: Vote count toggle */}
                  <button
                    type="button"
                    onClick={handleVoteToggle}
                    disabled={isVoting}
                    className="focus-ring"
                    aria-label={`${optimisticVote.hasVoted ? 'Remove vote from' : 'Vote for'} ${snack.name}`}
                    title={optimisticVote.hasVoted ? 'You voted for this snack' : 'Vote to stock more'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 100,
                      background: optimisticVote.hasVoted ? 'var(--primary-soft)' : 'var(--surface)',
                      border: `1.5px solid ${optimisticVote.hasVoted ? 'var(--primary)' : 'var(--ink)'}`,
                      boxShadow: '1.5px 1.5px 0 var(--ink)',
                      cursor: 'pointer',
                      color: optimisticVote.hasVoted ? 'var(--primary)' : 'var(--ink)',
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <ThumbsUp
                      size={13}
                      className={heartAnim ? 'heart-pop' : ''}
                      fill={optimisticVote.hasVoted ? 'var(--primary)' : 'none'}
                      stroke={optimisticVote.hasVoted ? 'var(--primary)' : 'currentColor'}
                    />
                    <span>{optimisticVote.voteCount}</span>
                  </button>
                </div>
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

        {/* Action Row: Row 1 (Stepper + Add to bag), Row 2 (Consume now) */}
        <div>
          {isGone ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                disabled
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '2px solid rgba(27,27,47,0.2)',
                  color: 'var(--ink-muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'not-allowed',
                }}
              >
                Ask an admin to restock
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {/* Row 1: Quantity stepper + Primary "Add to bag" button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
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
                    onClick={handleStepperDecrease}
                    disabled={currentStepperValue <= (inCartQty > 0 ? 0 : 1) || isConsuming}
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
                      cursor: currentStepperValue <= (inCartQty > 0 ? 0 : 1) || isConsuming ? 'not-allowed' : 'pointer',
                      color: 'var(--ink)',
                      opacity: currentStepperValue <= (inCartQty > 0 ? 0 : 1) ? 0.4 : 1,
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <span
                    aria-label="Quantity"
                    style={{
                      width: 36,
                      textAlign: 'center',
                      background: 'transparent',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontWeight: 800,
                      fontSize: 15,
                      color: 'var(--ink)',
                      userSelect: 'none',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {currentStepperValue}
                  </span>

                  <button
                    type="button"
                    onClick={handleStepperIncrease}
                    disabled={
                      (inCartQty > 0 ? inCartQty >= snack.quantity : availableStock <= 0 || amount >= availableStock) ||
                      isConsuming
                    }
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
                      cursor:
                        (inCartQty > 0 ? inCartQty >= snack.quantity : availableStock <= 0 || amount >= availableStock) ||
                        isConsuming
                          ? 'not-allowed'
                          : 'pointer',
                      color: 'var(--ink)',
                      opacity:
                        (inCartQty > 0 ? inCartQty >= snack.quantity : availableStock <= 0 || amount >= availableStock)
                          ? 0.4
                          : 1,
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Primary "Add to bag" button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isConsuming || availableStock <= 0}
                  aria-label={bagButtonText}
                  className="sticker focus-ring min-w-0"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 44,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: justAdded ? 'var(--stocked)' : inCartQty > 0 ? 'var(--primary-soft)' : 'var(--primary)',
                    color: 'var(--ink)',
                    border: '2px solid var(--ink)',
                    boxShadow: isAddPressed ? 'var(--shadow-press)' : 'var(--shadow)',
                    transform: isAddPressed ? 'translate(2px, 2px)' : undefined,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: availableStock <= 0 ? 'not-allowed' : 'pointer',
                    opacity: availableStock <= 0 && inCartQty === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-bricolage), sans-serif',
                    transition: 'all 120ms ease',
                  }}
                >
                  <ShoppingBag size={15} strokeWidth={2.4} className="shrink-0" />
                  <span className="truncate">{bagButtonText}</span>
                </button>
              </div>

              {/* Row 2: Full-width secondary outline "Consume now" */}
              <button
                type="button"
                onClick={(e) => handleConsume(e)}
                disabled={isConsuming || snack.quantity <= 0}
                className="sticker focus-ring min-w-0"
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--shadow)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isConsuming || snack.quantity <= 0 ? 'not-allowed' : 'pointer',
                  opacity: snack.quantity <= 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  transition: 'all 100ms ease',
                }}
              >
                {isConsuming ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="truncate">Consuming...</span>
                  </>
                ) : (
                  <span className="truncate">Consume now</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
