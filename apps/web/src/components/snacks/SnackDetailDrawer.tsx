'use client';

import React, { useState, useEffect } from 'react';
import { X, ThumbsUp, Bookmark, Minus, Plus, ShoppingBag, ShoppingCart, Pencil, Trash2, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Snack } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { CATEGORIES, CategoryIcon, getStockRatio } from '@/lib/snackHelpers';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { RestockModal } from '@/components/admin/RestockModal';
import { EditSnackModal } from '@/components/admin/EditSnackModal';
import { ArchiveConfirmDialog } from '@/components/admin/ArchiveConfirmDialog';
import { fireConfetti, FUNNY_CONSUME_QUIPS, getRandomQuip } from '@/lib/confetti';

interface SnackDetailDrawerProps {
  snack: Snack | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function SnackDetailDrawer({
  snack,
  isOpen,
  onClose,
  onUpdated,
}: SnackDetailDrawerProps) {
  const { user } = useAuth();
  const { addToCart, getItemQuantity } = useCart();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(1);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  // Admin modal controls
  const [showRestock, setShowRestock] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !snack) return null;

  const inCartQty = getItemQuantity(snack.id);
  const isGone = snack.quantity <= 0;
  const isRunningLow = snack.status === 'running_low';
  const categoryMeta = CATEGORIES[snack.category] ?? CATEGORIES.SWEET;
  const ratio = getStockRatio(snack.quantity, snack.lowStockThreshold);

  const snackImages = (snack.images && snack.images.length > 0)
    ? snack.images
    : (snack.imageUrl ? [snack.imageUrl] : []);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const success = addToCart(snack, amount, rect);
    if (success) {
      toast.success(`Added ${amount}x ${snack.name} to bag!`);
    } else {
      toast.error(`Max available in pantry is ${snack.quantity}`);
    }
  };

  const meterColor = isGone
    ? 'var(--gone)'
    : isRunningLow
    ? 'var(--running-low)'
    : 'var(--stocked)';

  async function handleVoteToggle() {
    if (!snack || isVoting) return;
    setIsVoting(true);

    try {
      if (snack.hasVoted) {
        await api.delete(`/snacks/${snack.id}/vote`);
        toast.success(`Removed vote for ${snack.name}`);
      } else {
        await api.post(`/snacks/${snack.id}/vote`);
        toast.success(`Voted for ${snack.name}!`);
      }
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
    } catch {
      toast.error('Could not update vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  }

  async function handleFavoriteToggle() {
    if (!snack || isFavoriting) return;
    setIsFavoriting(true);

    try {
      if (snack.isFavorite) {
        await api.delete(`/snacks/${snack.id}/favorite`);
        toast.success(`Removed ${snack.name} from Favorites`);
      } else {
        await api.post(`/snacks/${snack.id}/favorite`);
        toast.success(`Saved ${snack.name} to Favorites!`);
      }
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
    } catch {
      toast.error('Could not update favorites. Please try again.');
    } finally {
      setIsFavoriting(false);
    }
  }

  async function handleConsume(e?: React.MouseEvent) {
    if (!snack || isConsuming || isGone) return;

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
      toast.success(`You consumed ${amount} packet${amount > 1 ? 's' : ''} of ${snack.name}!`, {
        description: funnyQuip,
        duration: 3500,
      });
      setAmount(1);
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
        toast.error(err instanceof ApiError ? err.message : 'Failed to consume snack.');
      }
    } finally {
      setIsConsuming(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${snack.name} details`}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(27, 27, 47, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 80,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Drawer Container */}
        <div
          id="detail-drawer"
          className="sticker"
          style={{
            width: '100%',
            maxWidth: 480,
            height: '100dvh',
            background: 'var(--surface)',
            borderLeft: 'var(--border)',
            boxShadow: 'var(--shadow-hover)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '28px 32px 40px',
            position: 'relative',
            animation: 'drawerSlideIn 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close snack details"
            className="sticker focus-ring"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
              border: '2px solid var(--ink)',
              boxShadow: '2px 2px 0 var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ink)',
              zIndex: 10,
            }}
          >
            <X size={20} />
          </button>

          {/* Photographic Image Carousel Banner */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              border: '2.5px solid var(--ink)',
              boxShadow: '3px 3px 0 var(--ink)',
              overflow: 'hidden',
              marginTop: 16,
              marginBottom: 20,
              background: categoryMeta.bgSoft,
              flexShrink: 0,
            }}
          >
            <ImageCarousel
              images={snackImages}
              heightClass="h-[210px]"
              alt={snack.name}
              fallbackCategory={snack.category}
              showIndicators={snackImages.length > 1}
              showArrows={snackImages.length > 1}
            />
          </div>

          {/* Title & Badges */}
          <div style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 24,
                fontWeight: 900,
                color: 'var(--ink)',
                margin: '0 0 10px',
                lineHeight: 1.2,
              }}
            >
              {snack.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 100,
                  background: categoryMeta.bgSoft,
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                }}
              >
                <CategoryIcon category={snack.category} size={14} />
                {categoryMeta.label}
              </span>

              {snack.calories !== null && snack.calories !== undefined && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 100,
                    background: 'var(--surface-2)',
                    color: 'var(--ink)',
                    border: '1.5px solid var(--ink)',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                  }}
                >
                  <Flame size={13} color="var(--primary)" fill="var(--primary)" />
                  {snack.calories} kcal
                </span>
              )}

              <StatusBadge status={snack.status} />
            </div>
          </div>

          {/* Stock Meter & Scale */}
          <div
            style={{
              background: 'var(--surface-2)',
              border: '2px solid var(--ink)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)' }}>
                Stock Status
              </span>
              <div
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'var(--ink)',
                }}
              >
                {snack.quantity}{' '}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-muted)' }}>
                  packets left
                </span>
              </div>
            </div>

            {/* Meter pill */}
            <div className="stock-meter" style={{ height: 14 }}>
              <div
                className="stock-meter-fill"
                style={{
                  width: '100%',
                  transform: `scaleX(${ratio / 100})`,
                  background: meterColor,
                }}
              />
            </div>

            {/* Scale numbers */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--ink-muted)',
                marginTop: 6,
              }}
            >
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30+</span>
            </div>
          </div>

          {/* Member Actions: Consume Stepper & Vote */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Consume
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Stepper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface-2)',
                  border: '2.5px solid var(--ink)',
                  borderRadius: 'var(--radius-sm)',
                  height: 48,
                  overflow: 'hidden',
                  width: 140,
                }}
              >
                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.max(1, a - 1))}
                  disabled={amount <= 1 || isConsuming}
                  aria-label="Decrease amount"
                  className="focus-ring"
                  style={{
                    width: 44,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: amount <= 1 ? 'not-allowed' : 'pointer',
                    opacity: amount <= 1 ? 0.4 : 1,
                  }}
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  min={1}
                  max={snack.quantity}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value, 10) || 1)}
                  disabled={isConsuming}
                  aria-label="Consume amount"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontWeight: 800,
                    fontSize: 18,
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.min(snack.quantity, a + 1))}
                  disabled={amount >= snack.quantity || isConsuming}
                  aria-label="Increase amount"
                  className="focus-ring"
                  style={{
                    width: 44,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: amount >= snack.quantity ? 'not-allowed' : 'pointer',
                    opacity: amount >= snack.quantity ? 0.4 : 1,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isConsuming || isGone || inCartQty >= snack.quantity}
                className="sticker focus-ring"
                style={{
                  height: 48,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: inCartQty > 0 ? 'var(--primary-soft)' : 'var(--surface-2)',
                  color: 'var(--ink)',
                  border: '2.5px solid var(--ink)',
                  boxShadow: 'var(--shadow)',
                  fontSize: 14,
                  fontWeight: 900,
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  cursor: isGone || inCartQty >= snack.quantity ? 'not-allowed' : 'pointer',
                  opacity: isGone || inCartQty >= snack.quantity ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <ShoppingBag size={18} strokeWidth={2.4} />
                <span>{inCartQty > 0 ? `In Bag (${inCartQty})` : 'Add to Bag'}</span>
              </button>

              {/* Consume Button */}
              <button
                type="button"
                onClick={(e) => handleConsume(e)}
                disabled={isConsuming || isGone}
                className="sticker focus-ring"
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary)',
                  color: 'var(--ink)',
                  border: '2.5px solid var(--ink)',
                  boxShadow: 'var(--shadow)',
                  fontSize: 15,
                  fontWeight: 900,
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  cursor: isConsuming || isGone ? 'not-allowed' : 'pointer',
                  opacity: isGone ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {isConsuming ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Consuming...</span>
                  </>
                ) : isGone ? (
                  'Out of stock'
                ) : (
                  'Consume'
                )}
              </button>
            </div>

            {/* Actions: Public Vote & Personal Bookmark (Favorites) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Vote Button (Public popularity signal) */}
              <button
                type="button"
                onClick={handleVoteToggle}
                disabled={isVoting}
                className="sticker focus-ring"
                aria-label={snack.hasVoted ? 'Remove vote' : 'Vote for snack'}
                title="Public vote — helps decide Snack of the Week"
                style={{
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  background: snack.hasVoted ? '#fed7aa' : 'var(--surface)',
                  color: snack.hasVoted ? '#9a3412' : 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--shadow)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ThumbsUp
                  size={16}
                  fill={snack.hasVoted ? '#ea580c' : 'none'}
                  stroke={snack.hasVoted ? '#ea580c' : 'currentColor'}
                />
                <span>
                  {snack.hasVoted ? 'Voted' : 'Vote'} ({snack.voteCount})
                </span>
              </button>

              {/* Favorite Button (Personal bookmark) */}
              <button
                type="button"
                onClick={handleFavoriteToggle}
                disabled={isFavoriting}
                className="sticker focus-ring"
                aria-label={snack.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                title="Personal favorite — saves to your private Favorites tab"
                style={{
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  background: snack.isFavorite ? 'var(--accent-soft)' : 'var(--surface)',
                  color: snack.isFavorite ? 'var(--accent)' : 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--shadow)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Bookmark
                  size={16}
                  fill={snack.isFavorite ? 'var(--accent)' : 'none'}
                  stroke={snack.isFavorite ? 'var(--accent)' : 'currentColor'}
                />
                <span>
                  {snack.isFavorite ? 'Saved' : 'Favorite'}
                </span>
              </button>
            </div>
          </div>

          {/* ADMIN ACTIONS SECTION (Only visible to ADMIN) */}
          {user?.role === 'ADMIN' && (
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 24,
                borderTop: '2px dashed var(--ink)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Admin Actions
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 0.8,
                    background: 'var(--accent)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 100,
                  }}
                >
                  ADMIN
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                {/* Restock */}
                <button
                  type="button"
                  onClick={() => setShowRestock(true)}
                  className="sticker focus-ring"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '14px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    border: '2px solid var(--ink)',
                    boxShadow: 'var(--shadow)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <ShoppingCart size={20} style={{ color: 'var(--accent)' }} />
                  <span>Restock</span>
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="sticker focus-ring"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '14px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    border: '2px solid var(--ink)',
                    boxShadow: 'var(--shadow)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={20} style={{ color: 'var(--primary)' }} />
                  <span>Edit</span>
                </button>

                {/* Archive */}
                <button
                  type="button"
                  onClick={() => setShowArchive(true)}
                  className="sticker focus-ring"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '14px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--gone-soft)',
                    border: '2px solid var(--gone)',
                    boxShadow: '3px 3px 0 var(--gone)',
                    color: 'var(--gone-ink)',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={20} style={{ color: 'var(--gone)' }} />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      <RestockModal
        isOpen={showRestock}
        onClose={() => setShowRestock(false)}
        snack={snack}
        onUpdated={onUpdated}
      />

      <EditSnackModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        snack={snack}
        onUpdated={onUpdated}
      />

      <ArchiveConfirmDialog
        isOpen={showArchive}
        onClose={() => {
          setShowArchive(false);
          onClose();
        }}
        snack={snack}
        onArchived={onUpdated}
      />

      <style>{`
        @keyframes drawerSlideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (max-width: 640px) {
          #detail-drawer {
            max-width: 100% !important;
            height: 88dvh !important;
            margin-top: auto !important;
            border-left: none !important;
            border-top: var(--border) !important;
            border-radius: 24px 24px 0 0 !important;
            animation: sheetSlideUp 240ms cubic-bezier(0.22, 1, 0.36, 1) !important;
          }

          @keyframes sheetSlideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </>
  );
}
