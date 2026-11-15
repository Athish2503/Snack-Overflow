'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Crown, Trophy, ChevronRight, Flame, Heart, ShoppingBag, PlusCircle, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Snack } from '@/lib/types';
import { SnackImage } from '@/components/ui/SnackImage';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

export interface SnackOfTheWeekHeroProps {
  snack: (Snack & { unitsConsumedThisWeek?: number }) | null;
  variant?: 'member' | 'admin';
  onUpdated?: () => void;
  onRestockClick?: (snack: Snack) => void;
  isLoading?: boolean;
}

export function SnackOfTheWeekHero({
  snack,
  variant = 'member',
  onUpdated,
  onRestockClick,
  isLoading = false,
}: SnackOfTheWeekHeroProps) {
  const queryClient = useQueryClient();
  const { addToCart, getItemQuantity } = useCart();
  const [isVoting, setIsVoting] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Local optimistic vote state
  const [localVote, setLocalVote] = useState<{ id: string; hasVoted: boolean; voteCount: number } | null>(null);
  const optimisticVote =
    snack && localVote && localVote.id === snack.id
      ? localVote
      : snack
      ? { id: snack.id, hasVoted: !!snack.hasVoted, voteCount: snack.voteCount || 0 }
      : { id: '', hasVoted: false, voteCount: 0 };

  const inCartQty = snack ? getItemQuantity(snack.id) : 0;
  const isGone = snack ? snack.quantity <= 0 : true;
  const isLow = snack ? !isGone && snack.quantity <= snack.lowStockThreshold : false;

  // 1. Loading Skeleton State (exact height to prevent layout shift)
  if (isLoading) {
    return (
      <div
        className="sticker hero-skeleton"
        style={{
          background: 'var(--surface-2)',
          border: 'var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-lg)',
          minHeight: 168,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 16,
            background: 'var(--border-subtle)',
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: 140, height: 16, borderRadius: 4, background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '60%', height: 28, borderRadius: 6, background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 80, height: 24, borderRadius: 100, background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: 80, height: 24, borderRadius: 100, background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State (no votes yet this week)
  if (!snack || optimisticVote.voteCount <= 0) {
    return (
      <div
        className="sticker hero-empty-card"
        style={{
          background: 'var(--accent)',
          border: 'var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 12,
          minHeight: 168,
        }}
      >
        {/* Trophy Sticker anchored top-right half outside the card with slow idle wiggle */}
        <div
          className="hero-trophy-sticker"
          aria-hidden="true"
          title="Snack of the Week"
        >
          <Trophy size={22} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.9 }}>
          <Crown size={16} />
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            Snack of the Week
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-bricolage), sans-serif',
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: 900,
            margin: 0,
            color: '#fff',
          }}
        >
          No votes yet, be the first to crown a snack
        </h2>
        <p style={{ fontSize: 14, margin: 0, opacity: 0.92, maxWidth: 440 }}>
          {variant === 'admin'
            ? 'Pantry members haven’t cast any votes yet this week. Stock favorite snacks to encourage voting!'
            : 'Cast your vote in the pantry catalog to crown this week’s pantry champion!'}
        </p>

        <Link
          href="/snacks"
          className="sticker focus-ring"
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--primary)',
            color: 'var(--ink)',
            border: '2px solid var(--ink)',
            boxShadow: '3px 3px 0 var(--ink)',
            borderRadius: 100,
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          {variant === 'admin' ? 'View Inventory' : 'Vote for snacks'}
          <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  const primaryImg = snack.images && snack.images.length > 0 ? snack.images[0] : snack.imageUrl;

  const handleVoteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;
    setIsVoting(true);
    setHeartAnim(true);

    const prevVoted = optimisticVote.hasVoted;
    const prevCount = optimisticVote.voteCount;
    const nextVoted = !prevVoted;
    const nextCount = nextVoted ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLocalVote({ id: snack.id, hasVoted: nextVoted, voteCount: nextCount });

    try {
      if (nextVoted) {
        await api.post(`/snacks/${snack.id}/vote`);
        toast.success(`Voted for "${snack.name}"!`);
      } else {
        await api.delete(`/snacks/${snack.id}/vote`);
        toast.info(`Removed vote for "${snack.name}"`);
      }
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      onUpdated?.();
    } catch {
      setLocalVote({ id: snack.id, hasVoted: prevVoted, voteCount: prevCount });
      toast.error('Could not update vote. Please try again.');
    } finally {
      setIsVoting(false);
      setTimeout(() => setHeartAnim(false), 300);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGone) return;

    const imgContainer = (e.currentTarget.closest('.hero-card') || e.currentTarget) as HTMLElement;
    const sourceRect = imgContainer.getBoundingClientRect();

    const success = addToCart(snack, 1, sourceRect);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 700);
    } else {
      toast.error(`Max available stock in pantry is ${snack.quantity}`);
    }
  };

  let bagBtnText = 'Add to bag';
  if (justAdded) bagBtnText = 'In bag ✓';
  else if (inCartQty > 0) bagBtnText = `In bag · ${inCartQty}`;

  return (
    <div
      className="sticker hero-card"
      style={{
        background: 'var(--accent)',
        border: 'var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'visible', // allows trophy to sit half outside the card
      }}
    >
      <style>{`
        /* Trophy slow idle wiggle (once every 6s, paused on reduce-motion) */
        @keyframes trophy-wiggle {
          0%, 88%, 100% {
            transform: rotate(10deg) scale(1);
          }
          92% {
            transform: rotate(20deg) scale(1.08);
          }
          96% {
            transform: rotate(2deg) scale(1.08);
          }
        }

        .hero-trophy-sticker {
          position: absolute;
          top: -14px;
          right: -14px;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #FFF0B8;
          border: 2.5px solid var(--ink);
          box-shadow: 3px 3px 0 var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
          z-index: 10;
          pointer-events: none;
          transform: rotate(10deg);
          animation: trophy-wiggle 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-trophy-sticker {
            animation: none !important;
          }
        }

        /* Responsive Hero Layout */
        .hero-inner-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
        }

        .hero-info-section {
          display: flex;
          align-items: center;
          gap: 20px;
          flex: 1;
          min-width: 0;
        }

        .hero-actions-section {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          margin-top: 0;
          padding-right: 18px; /* guaranteed >12px clearance from top-right trophy sticker */
        }

        .hero-photo-wrapper {
          width: 104px;
          height: 104px;
          border-radius: 18px;
          border: 2.5px solid var(--ink);
          box-shadow: 3.5px 3.5px 0 var(--ink);
          overflow: hidden;
          background: #ffffff;
          transform: rotate(-3deg);
          flex-shrink: 0;
        }

        /* Below lg (< 1024px): Stack photo and full-width buttons */
        @media (max-width: 1023px) {
          .hero-inner-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .hero-info-section {
            width: 100%;
            gap: 16px;
          }
          .hero-photo-wrapper {
            width: 76px;
            height: 76px;
            border-radius: 14px;
          }
          .hero-actions-section {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
            padding-right: 0;
          }
        }
      `}</style>

      {/* Trophy Sticker anchored to top-right corner half outside the card */}
      <div
        className="hero-trophy-sticker"
        aria-hidden="true"
        title="Weekly Crown"
      >
        <Trophy size={22} />
      </div>

      <div className="hero-inner-container">
        {/* Left / Middle: Photo Tile + Metadata & Chips */}
        <div className="hero-info-section">
          {/* Photo Tile with <SnackImage /> fallback */}
          <div className="hero-photo-wrapper">
            <SnackImage
              src={primaryImg}
              alt={snack.name}
              category={snack.category}
              width="100%"
              height="100%"
              iconSize={42}
            />
          </div>

          {/* Details & Chips */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1,
                opacity: 0.95,
                marginBottom: 4,
              }}
            >
              <Crown size={14} />
              Snack of the Week
            </div>

            <h2
              title={snack.name}
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: 900,
                margin: '0 0 10px',
                color: '#ffffff',
                lineHeight: 1.15,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {snack.name}
            </h2>

            {/* Chips row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Votes Chip */}
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {optimisticVote.voteCount} {optimisticVote.voteCount === 1 ? 'vote' : 'votes'}
                {variant === 'admin' ? ' this week' : ''}
              </span>

              {/* Calories Chip */}
              {snack.calories !== null && snack.calories !== undefined && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: 100,
                    padding: '4px 12px',
                  }}
                >
                  <Flame size={13} fill="#ffffff" />
                  {snack.calories} kcal
                </span>
              )}

              {/* Admin-only Chips */}
              {variant === 'admin' && (
                <>
                  {/* Stock Status Badge + "N left" */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 100,
                      padding: '4px 12px',
                      background: isGone
                        ? '#FFD9D9'
                        : isLow
                        ? '#FFF0B8'
                        : '#D1FADF',
                      color: isGone
                        ? 'var(--bad)'
                        : isLow
                        ? '#8A5D00'
                        : 'var(--ok)',
                      border: '1.5px solid var(--ink)',
                      boxShadow: '1.5px 1.5px 0 var(--ink)',
                    }}
                  >
                    {isGone ? (
                      <XCircle size={13} />
                    ) : isLow ? (
                      <AlertTriangle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    {snack.quantity} left ({isGone ? 'Gone' : isLow ? 'Low stock' : 'Stocked'})
                  </span>

                  {/* Units Consumed This Week Chip */}
                  {snack.unitsConsumedThisWeek !== undefined && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        fontSize: 12,
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.22)',
                        color: '#ffffff',
                        border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: 100,
                        padding: '4px 12px',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      title="Units consumed across the pantry in the last 7 days"
                    >
                      <TrendingUp size={13} />
                      {snack.unitsConsumedThisWeek} consumed this week
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right / Bottom: Actions Section (clearance from trophy sticker preserved) */}
        <div className="hero-actions-section">
          {variant === 'member' ? (
            <>
              {/* Member Action 1: Vote Button */}
              <button
                type="button"
                onClick={handleVoteToggle}
                disabled={isVoting}
                className="sticker focus-ring"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: optimisticVote.hasVoted ? '#FFE4ED' : '#ffffff',
                  color: optimisticVote.hasVoted ? 'var(--primary)' : 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: '3px 3px 0 var(--ink)',
                  borderRadius: 100,
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                  minHeight: 44,
                }}
                aria-label={optimisticVote.hasVoted ? 'Remove vote' : 'Vote for Snack of the Week'}
              >
                <Heart
                  size={16}
                  className={heartAnim ? 'heart-pop' : ''}
                  fill={optimisticVote.hasVoted ? 'var(--primary)' : 'none'}
                  stroke={optimisticVote.hasVoted ? 'var(--primary)' : 'currentColor'}
                />
                <span>{optimisticVote.hasVoted ? 'Voted' : 'Vote'} · {optimisticVote.voteCount}</span>
              </button>

              {/* Member Action 2: Add to Bag (Tangerine primary, INK text) */}
              {!isGone ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="sticker focus-ring"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--primary)',
                    color: 'var(--ink)',
                    border: '2px solid var(--ink)',
                    boxShadow: '3px 3px 0 var(--ink)',
                    borderRadius: 100,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minHeight: 44,
                  }}
                >
                  <ShoppingBag size={16} />
                  {bagBtnText}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="sticker"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    border: '2px solid rgba(255,255,255,0.6)',
                    borderRadius: 100,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'not-allowed',
                    minHeight: 44,
                  }}
                >
                  Gone · Ask admin
                </button>
              )}

              {/* Member Action 3: View Snack Details */}
              <Link
                href={`/snacks?search=${encodeURIComponent(snack.name)}`}
                className="sticker focus-ring"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: '3px 3px 0 var(--ink)',
                  textDecoration: 'none',
                }}
                title="View snack in inventory"
                aria-label={`View details of ${snack.name}`}
              >
                <ChevronRight size={20} />
              </Link>
            </>
          ) : (
            <>
              {/* Admin Action 1: Restock shortcut when low or gone */}
              {(isLow || isGone) && onRestockClick && (
                <button
                  type="button"
                  onClick={() => onRestockClick(snack)}
                  className="sticker focus-ring"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--primary)',
                    color: 'var(--ink)',
                    border: '2px solid var(--ink)',
                    boxShadow: '3px 3px 0 var(--ink)',
                    borderRadius: 100,
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                  title="Quick restock this low/gone champion snack"
                >
                  <PlusCircle size={16} />
                  Restock
                </button>
              )}

              {/* Admin Action 2: View Snack in inventory */}
              <Link
                href={`/snacks?search=${encodeURIComponent(snack.name)}`}
                className="sticker focus-ring"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ffffff',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: '3px 3px 0 var(--ink)',
                  borderRadius: 100,
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  minHeight: 44,
                }}
                title="View snack details in inventory"
              >
                <span>View snack</span>
                <ChevronRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
