'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Crown, Trophy, ChevronRight, Flame, Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Snack } from '@/lib/types';
import { CategoryIcon } from '@/lib/snackHelpers';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

interface SnackOfTheWeekHeroProps {
  snack: Snack | null;
  onUpdated?: () => void;
}

export function SnackOfTheWeekHero({ snack, onUpdated }: SnackOfTheWeekHeroProps) {
  const queryClient = useQueryClient();
  const { addToCart, getItemQuantity } = useCart();
  const [imgError, setImgError] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Local optimistic vote state
  const [localVote, setLocalVote] = useState<{ id: string; hasVoted: boolean; voteCount: number } | null>(null);
  const optimisticVote =
    snack && localVote && localVote.id === snack.id
      ? localVote
      : snack
      ? { id: snack.id, hasVoted: snack.hasVoted, voteCount: snack.voteCount }
      : { id: '', hasVoted: false, voteCount: 0 };

  const inCartQty = snack ? getItemQuantity(snack.id) : 0;
  const isGone = snack ? snack.quantity <= 0 : true;

  if (!snack) {
    return (
      <div
        className="sticker"
        style={{
          background: 'var(--accent)',
          border: 'var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#FFF0B8',
            border: '2px solid var(--ink)',
            boxShadow: '2.5px 2.5px 0 var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-8deg)',
            color: 'var(--ink)',
          }}
          aria-hidden="true"
        >
          <Trophy size={22} />
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-bricolage), sans-serif',
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
            color: '#fff',
          }}
        >
          Snack of the Week
        </h2>
        <p style={{ fontSize: 15, margin: 0, opacity: 0.9, maxWidth: 440 }}>
          No votes cast yet this week. Be the first to vote and crown the pantry favorite!
        </p>
        <Link
          href="/snacks"
          className="sticker focus-ring"
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            color: 'var(--ink)',
            border: '2px solid var(--ink)',
            boxShadow: '3px 3px 0 var(--ink)',
            borderRadius: 100,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          Vote for snacks
          <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  const primaryImg =
    snack.images && snack.images.length > 0 ? snack.images[0] : snack.imageUrl;

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
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      {/* Trophy Badge relocated cleanly to top-left corner */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 14,
          left: 18,
          width: 40,
          height: 40,
          borderRadius: 12,
          background: '#FFF0B8',
          border: '2px solid var(--ink)',
          boxShadow: '2.5px 2.5px 0 var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(-8deg)',
          color: 'var(--ink)',
          zIndex: 2,
        }}
        title="Weekly Crown"
      >
        <Trophy size={20} />
      </div>

      {/* Left: Sticker Tile with Snack Image & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', zIndex: 1, paddingLeft: 38 }}>
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 16,
            background: '#ffffff',
            border: '2.5px solid var(--ink)',
            boxShadow: '3px 3px 0 var(--ink)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-3deg)',
            flexShrink: 0,
          }}
        >
          {primaryImg && !imgError ? (
            <img
              src={primaryImg}
              alt={snack.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <CategoryIcon category={snack.category || 'SWEET'} size={38} />
          )}
        </div>

        {/* Middle: Details & Metrics */}
        <div>
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
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 'clamp(20px, 3.2vw, 30px)',
              fontWeight: 900,
              margin: '0 0 10px',
              color: '#ffffff',
              lineHeight: 1.15,
            }}
          >
            {snack.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
            </span>

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
          </div>
        </div>
      </div>

      {/* Right: Inline Actions (Vote & Add to Bag) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          zIndex: 1,
        }}
      >
        {/* Vote Button */}
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

        {/* Add to Bag Button */}
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
              color: '#ffffff',
              border: '2px solid var(--ink)',
              boxShadow: '3px 3px 0 var(--ink)',
              borderRadius: 100,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-bricolage), sans-serif',
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
            }}
          >
            Ask an admin to restock
          </button>
        )}

        {/* Detail Link */}
        <Link
          href={`/snacks?search=${encodeURIComponent(snack.name)}`}
          className="sticker focus-ring"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#ffffff',
            color: 'var(--ink)',
            border: '2px solid var(--ink)',
            boxShadow: '3px 3px 0 var(--ink)',
            textDecoration: 'none',
          }}
          title="View snack details in inventory"
          aria-label={`View details of ${snack.name}`}
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
}
