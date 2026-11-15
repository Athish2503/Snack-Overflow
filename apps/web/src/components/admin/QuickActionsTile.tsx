'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, ShoppingBag, History, Archive } from 'lucide-react';
import { BentoTile } from './BentoTile';
import { AddSnackModal } from './AddSnackModal';
import { RestockModal } from './RestockModal';
import { AdminNeedsRestockItem, Snack } from '@/lib/types';

interface QuickActionsTileProps {
  needsRestockSnacks?: AdminNeedsRestockItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

export function QuickActionsTile({
  needsRestockSnacks = [],
  isLoading,
  isError,
  onRetry,
  staggerIndex = 6,
}: QuickActionsTileProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // If there's a snack in needsRestock, use the most urgent one as default for the modal
  const defaultRestockSnack: Snack | null =
    needsRestockSnacks.length > 0
      ? ({
          id: needsRestockSnacks[0].id,
          name: needsRestockSnacks[0].name,
          category: needsRestockSnacks[0].category,
          quantity: needsRestockSnacks[0].quantity,
          lowStockThreshold: needsRestockSnacks[0].lowStockThreshold,
          imageUrl: needsRestockSnacks[0].imageUrl,
          status: needsRestockSnacks[0].status,
          voteCount: 0,
          hasVoted: false,
          createdAt: '',
          updatedAt: '',
        } as Snack)
      : null;

  return (
    <>
      <BentoTile
        title="Quick Actions"
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        staggerIndex={staggerIndex}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            height: '100%',
            alignContent: 'center',
          }}
        >
          <style>{`
            .quick-action-btn {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 12px;
              border-radius: var(--radius-md);
              border: 2px solid var(--ink);
              box-shadow: 2px 2px 0 var(--ink);
              font-size: 13px;
              font-weight: 800;
              color: var(--ink);
              cursor: pointer;
              text-decoration: none;
              transition: transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out;
              min-height: 44px;
              min-width: 0;
            }
            .quick-action-btn span {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .quick-action-btn:hover {
              transform: translate(-1px, -1px);
              box-shadow: 3px 3px 0 var(--ink);
            }
            .quick-action-btn:active {
              transform: translate(1px, 1px);
              box-shadow: 1px 1px 0 var(--ink);
            }
          `}</style>

          {/* + Add Snack */}
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="quick-action-btn focus-ring"
            style={{ background: 'var(--primary)', color: 'var(--ink)' }}
          >
            <PlusCircle size={18} strokeWidth={2.6} />
            <span>Add Snack</span>
          </button>

          {/* Restock */}
          <button
            type="button"
            onClick={() => {
              if (defaultRestockSnack) {
                setIsRestockOpen(true);
              } else {
                // If everything is stocked, link to all snacks
                router.push('/snacks');
              }
            }}
            className="quick-action-btn focus-ring"
            style={{ background: 'var(--stocked-soft)', color: 'var(--stocked-ink)' }}
          >
            <ShoppingBag size={18} strokeWidth={2.6} />
            <span>Restock</span>
          </button>

          {/* Activity Log */}
          <Link
            href="/activity"
            className="quick-action-btn focus-ring"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <History size={18} strokeWidth={2.6} />
            <span>Activity Log</span>
          </Link>

          {/* All / Archived Snacks */}
          <Link
            href="/snacks"
            className="quick-action-btn focus-ring"
            style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}
          >
            <Archive size={18} strokeWidth={2.6} />
            <span>All Snacks</span>
          </Link>
        </div>
      </BentoTile>

      {/* Add Snack Modal */}
      <AddSnackModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Restock Modal */}
      {defaultRestockSnack && (
        <RestockModal
          isOpen={isRestockOpen}
          onClose={() => setIsRestockOpen(false)}
          snack={defaultRestockSnack}
        />
      )}
    </>
  );
}
