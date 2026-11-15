'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ChevronRight, Trophy, ShoppingBag } from 'lucide-react';
import { Snack } from '@/lib/types';
import { CategoryIcon } from '@/lib/snackHelpers';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface PicksAndLovedProps {
  userPicks: Snack[];
  mostLoved: Snack[];
  onSelect?: (snack: Snack) => void;
}

export function PicksAndLovedSection({
  userPicks,
  mostLoved,
  onSelect,
}: PicksAndLovedProps) {
  const { addToCart, getItemQuantity } = useCart();

  const handleAdd = (e: React.MouseEvent, snack: Snack) => {
    e.stopPropagation();
    const cardEl = (e.currentTarget.closest('.pick-card') || e.currentTarget) as HTMLElement;
    const sourceRect = cardEl.getBoundingClientRect();
    const success = addToCart(snack, 1, sourceRect);
    if (!success) {
      toast.error(`Max available stock is ${snack.quantity}`);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
      }}
    >
      {/* ── Left Column: Your picks (snacks you've voted for) ── */}
      <div
        className="sticker"
        style={{
          background: 'var(--surface)',
          border: 'var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--ink)',
                margin: '0 0 2px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Heart size={18} fill="var(--primary)" color="var(--primary)" />
              Your picks
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
              Snacks you&apos;ve voted for &amp; their stock
            </p>
          </div>

          <Link
            href="/favorites"
            className="hover:underline focus-ring"
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            All favorites <ChevronRight size={14} />
          </Link>
        </div>

        {userPicks.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1.5px dashed var(--ink-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '28px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                border: '1.5px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Heart size={20} />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              No votes yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, maxWidth: 260 }}>
              Tap a heart on any snack to cast your vote and pin your favourites here!
            </p>
            <Link
              href="/snacks"
              className="sticker focus-ring"
              style={{
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--primary)',
                color: '#ffffff',
                border: '1.5px solid var(--ink)',
                boxShadow: '2px 2px 0 var(--ink)',
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Explore snacks
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {userPicks.slice(0, 4).map((snack) => {
              const inCart = getItemQuantity(snack.id);
              const primaryImg =
                snack.images && snack.images.length > 0 ? snack.images[0] : snack.imageUrl;
              const isGone = snack.quantity <= 0;
              const isLow = snack.status === 'running_low';

              return (
                <div
                  key={snack.id}
                  className="sticker pick-card"
                  onClick={() => onSelect?.(snack)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--ink)',
                    background: 'var(--surface-2)',
                    boxShadow: '1.5px 1.5px 0 var(--ink)',
                    cursor: onSelect ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border: '1.5px solid var(--ink)',
                        overflow: 'hidden',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={snack.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <CategoryIcon category={snack.category} size={22} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 800,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {snack.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            color: isGone
                              ? 'var(--gone)'
                              : isLow
                              ? 'var(--running-low)'
                              : 'var(--stocked)',
                          }}
                        >
                          {isGone ? 'Gone' : `${snack.quantity} in pantry`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isGone ? (
                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, snack)}
                      className="sticker focus-ring"
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: inCart > 0 ? 'var(--primary-soft)' : 'var(--primary)',
                        color: inCart > 0 ? 'var(--ink)' : '#ffffff',
                        border: '1.5px solid var(--ink)',
                        boxShadow: '1.5px 1.5px 0 var(--ink)',
                        borderRadius: 100,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <ShoppingBag size={13} />
                      <span>{inCart > 0 ? inCart : '+'}</span>
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink-muted)',
                        padding: '4px 8px',
                        background: 'var(--surface)',
                        borderRadius: 100,
                        border: '1px solid var(--border)',
                      }}
                    >
                      Out of stock
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right Column: Most loved (Top 3 Social Proof) ── */}
      <div
        className="sticker"
        style={{
          background: 'var(--surface)',
          border: 'var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 18,
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '0 0 2px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trophy size={18} fill="#FACC15" color="var(--ink)" />
            Most loved
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
            Top voted pantry legends across the team
          </p>
        </div>

        {mostLoved.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1.5px dashed var(--ink-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '28px 16px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
              No votes cast yet this period.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mostLoved.slice(0, 3).map((snack, idx) => {
              const rankMedals = ['🥇', '🥈', '🥉'];
              const primaryImg =
                snack.images && snack.images.length > 0 ? snack.images[0] : snack.imageUrl;
              const inCart = getItemQuantity(snack.id);
              const isGone = snack.quantity <= 0;

              return (
                <div
                  key={snack.id}
                  className="sticker pick-card"
                  onClick={() => onSelect?.(snack)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--ink)',
                    background: idx === 0 ? '#FFFBEB' : 'var(--surface-2)',
                    boxShadow: '1.5px 1.5px 0 var(--ink)',
                    cursor: onSelect ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }} aria-label={`Rank ${idx + 1}`}>
                      {rankMedals[idx] || `${idx + 1}.`}
                    </span>

                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border: '1.5px solid var(--ink)',
                        overflow: 'hidden',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={snack.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <CategoryIcon category={snack.category} size={22} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 800,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {snack.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Heart size={12} fill="var(--primary)" />
                          {snack.voteCount} {snack.voteCount === 1 ? 'vote' : 'votes'}
                        </span>
                        {snack.calories && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--ink-muted)',
                              fontFamily: 'var(--font-jetbrains-mono), monospace',
                            }}
                          >
                            · {snack.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isGone ? (
                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, snack)}
                      className="sticker focus-ring"
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: inCart > 0 ? 'var(--primary-soft)' : 'var(--primary)',
                        color: inCart > 0 ? 'var(--ink)' : '#ffffff',
                        border: '1.5px solid var(--ink)',
                        boxShadow: '1.5px 1.5px 0 var(--ink)',
                        borderRadius: 100,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <ShoppingBag size={13} />
                      <span>{inCart > 0 ? inCart : '+'}</span>
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink-muted)',
                        padding: '4px 8px',
                        background: 'var(--surface)',
                        borderRadius: 100,
                        border: '1px solid var(--border)',
                      }}
                    >
                      Gone
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
