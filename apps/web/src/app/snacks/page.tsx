'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, PackageOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { SnackListResponse, SnackCategory, SnackStatus, Snack } from '@/lib/types';
import { SnackCard } from '@/components/snacks/SnackCard';
import { FilterBar } from '@/components/snacks/FilterBar';
import { Pagination } from '@/components/snacks/Pagination';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { AddSnackModal } from '@/components/admin/AddSnackModal';
import { SnackDetailDrawer } from '@/components/snacks/SnackDetailDrawer';

export default function SnacksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read state from URL query
  const querySearch = searchParams.get('search') || '';
  const category = (searchParams.get('category') as SnackCategory) || undefined;
  const status = (searchParams.get('status') as SnackStatus) || undefined;
  const sortBy = (searchParams.get('sortBy') as 'name' | 'quantity' | 'createdAt') || 'name';
  const pageParsed = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParsed) || pageParsed < 1 ? 1 : pageParsed;

  // Local search input state for smooth typing
  const [search, setSearch] = useState(querySearch);
  const [prevQuerySearch, setPrevQuerySearch] = useState(querySearch);

  if (prevQuerySearch !== querySearch) {
    setPrevQuerySearch(querySearch);
    setSearch(querySearch);
  }

  // Phase 8 Admin & Detail States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);

  // Sync state back to URL query
  const updateUrl = useCallback((newParams: {
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    page?: number;
  }) => {
    startTransition(() => {
      const params = new URLSearchParams();
      const s = newParams.search !== undefined ? newParams.search : querySearch;
      const c = newParams.category !== undefined ? newParams.category : category;
      const st = newParams.status !== undefined ? newParams.status : status;
      const sb = newParams.sortBy !== undefined ? newParams.sortBy : sortBy;
      const p = newParams.page !== undefined ? newParams.page : page;

      if (s) params.set('search', s);
      if (c) params.set('category', c);
      if (st) params.set('status', st);
      if (sb && sb !== 'name') params.set('sortBy', sb);
      if (p && p > 1) params.set('page', p.toString());

      const queryStr = params.toString();
      router.replace(`/snacks${queryStr ? `?${queryStr}` : ''}`, { scroll: false });
    });
  }, [category, page, querySearch, router, sortBy, status]);

  // Debounce search input (300ms) to update URL query
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get('search') || '';
      if (search !== currentQuery) {
        updateUrl({ search, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParams, updateUrl]);

  // TanStack Query
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '12');
  if (querySearch) queryParams.set('search', querySearch);
  if (category) queryParams.set('category', category);
  if (status) queryParams.set('status', status);
  if (sortBy) queryParams.set('sortBy', sortBy);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['snacks', page, querySearch, category, status, sortBy],
    queryFn: () => api.get<SnackListResponse>(`/snacks?${queryParams.toString()}`),
  });

  const handleClearAll = () => {
    setSearch('');
    router.replace('/snacks', { scroll: false });
  };

  const handleCategoryChange = (cat?: SnackCategory) => {
    updateUrl({ category: cat, page: 1 });
  };

  const handleStatusChange = (st?: SnackStatus) => {
    updateUrl({ status: st, page: 1 });
  };

  const handleSortChange = (sort?: 'name' | 'quantity' | 'createdAt') => {
    updateUrl({ sortBy: sort || 'name', page: 1 });
  };

  const handlePageChange = (p: number) => {
    updateUrl({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const snacks = data?.data ?? [];
  const pagination = data?.pagination;
  const hasActiveFilters = Boolean(querySearch || category || status);

  return (
    <div
      style={{
        maxWidth: 1320,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* ── Top Header Row ── */}
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
          <h1
            style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '0 0 4px',
              lineHeight: 1.1,
            }}
          >
            Snacks
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-muted)', margin: 0 }}>
            Browse, consume, and vote for the snacks in the office pantry.
          </p>
        </div>

        {/* Admin "+ Add snack" Button */}
        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="sticker focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              color: 'var(--ink)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow)',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--font-bricolage), sans-serif',
            }}
          >
            <Plus size={18} />
             Add snack
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={handleCategoryChange}
        status={status}
        onStatusChange={handleStatusChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearAll={handleClearAll}
      />

      {/* ── Error State ── */}
      {isError && (
        <ErrorCard
          message={(error as Error)?.message || 'Failed to load pantry snacks.'}
          onRetry={() => refetch()}
        />
      )}

      {/* ── Loading Skeleton Grid ── */}
      {isLoading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !isError && snacks.length === 0 && (
        <div style={{ padding: '40px 0' }}>
          {hasActiveFilters ? (
            <EmptyState
              icon={<Search size={36} color="var(--ink)" />}
              title="No snacks match those filters"
              description="Try adjusting your search terms, changing the category, or clearing the status filter."
              action={
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="sticker focus-ring"
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary)',
                    color: 'var(--ink)',
                    border: '2px solid var(--ink)',
                    boxShadow: 'var(--shadow)',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  Clear all filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<PackageOpen size={36} color="var(--ink)" />}
              title="The pantry's empty. Suspicious."
              description="Looks like there are no snacks registered in the pantry yet."
            />
          )}
        </div>
      )}

      {/* ── Snack Grid ── */}
      {!isLoading && !isError && snacks.length > 0 && (
        <>
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

          {/* ── Pagination ── */}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* ── Admin Add Snack Modal ── */}
      <AddSnackModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {/* ── Snack Detail & Admin Drawer ── */}
      <SnackDetailDrawer
        snack={selectedSnack}
        isOpen={Boolean(selectedSnack)}
        onClose={() => setSelectedSnack(null)}
        onUpdated={() => {
          refetch();
          if (selectedSnack) {
            // refresh selected snack from updated list if still present
            api
              .get<Snack>(`/snacks/${selectedSnack.id}`)
              .then((updated) => setSelectedSnack(updated))
              .catch(() => setSelectedSnack(null));
          }
        }}
      />
    </div>
  );
}
