'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, Cookie, ArrowLeft, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { SnackListResponse, Snack } from '@/lib/types';
import { SnackCard } from '@/components/snacks/SnackCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { SnackDetailDrawer } from '@/components/snacks/SnackDetailDrawer';
import { useCart } from '@/contexts/CartContext';

export default function FavoritesPage() {
  const { openCart, totalItems } = useCart();
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['snacks', 'favorites'],
    queryFn: () => api.get<SnackListResponse>('/snacks?favoritesOnly=true&limit=50'),
  });

  const snacks = data?.data ?? [];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link
              href="/snacks"
              className="focus-ring"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--ink-muted)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to all snacks</span>
            </Link>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 900,
              color: 'var(--ink)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Heart size={28} className="text-[var(--accent)] fill-[var(--accent)]" />
            <span>My Favorite Snacks</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)', fontSize: 14 }}>
            All the pantry snacks you&apos;ve voted for. Add them directly to your bag or consume on the spot.
          </p>
        </div>

        {totalItems > 0 && (
          <button
            type="button"
            onClick={openCart}
            className="sticker focus-ring cursor-pointer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              color: 'var(--ink)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow)',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <ShoppingBag size={18} strokeWidth={2.4} />
            <span>Open Pantry Bag ({totalItems})</span>
          </button>
        )}
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── Error State ── */}
      {isError && (
        <ErrorCard
          message={error instanceof Error ? error.message : 'Could not load your favorites.'}
          onRetry={() => refetch()}
        />
      )}

      {/* ── Empty State ── */}
      {!isLoading && !isError && snacks.length === 0 && (
        <EmptyState
          icon={<Heart size={36} color="var(--accent)" />}
          title="No favorites saved yet"
          description="Click the heart on any snack card in the pantry to pin it to your favorites list!"
          action={
            <Link
              href="/snacks"
              className="sticker focus-ring"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: 'var(--ink)',
                border: '2px solid var(--ink)',
                boxShadow: 'var(--shadow)',
                fontWeight: 800,
                fontSize: 14,
                textDecoration: 'none',
                marginTop: 8,
              }}
            >
              <Cookie size={16} />
              <span>Browse Pantry Snacks</span>
            </Link>
          }
        />
      )}

      {/* ── Favorites Grid ── */}
      {!isLoading && !isError && snacks.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {snacks.map((snack) => (
            <SnackCard
              key={snack.id}
              snack={snack}
              onUpdated={() => refetch()}
              onSelect={(s) => setSelectedSnack(s)}
            />
          ))}
        </div>
      )}

      {/* ── Snack Detail Drawer ── */}
      {selectedSnack && (
        <SnackDetailDrawer
          snack={selectedSnack}
          isOpen={!!selectedSnack}
          onClose={() => setSelectedSnack(null)}
          onUpdated={() => refetch()}
        />
      )}
    </div>
  );
}
