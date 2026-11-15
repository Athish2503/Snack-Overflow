'use client';

import React, { useState } from 'react';
import { Minus, Plus, ShoppingCart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Snack } from '@/lib/types';
import { CategoryIcon } from '@/lib/snackHelpers';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  snack: Snack | null;
  onUpdated?: () => void;
}

export function RestockModal({ isOpen, onClose, snack, onUpdated }: RestockModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!snack) return null;

  const projectedQuantity = snack.quantity + amount;

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!snack || amount <= 0) return;

    setIsLoading(true);
    setServerError('');

    try {
      await api.post(`/snacks/${snack.id}/restock`, { amount });
      toast.success(`Restocked ${amount} packet${amount > 1 ? 's' : ''} of ${snack.name}!`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Failed to restock snack.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Restock Inventory"
      description={`Add stock to ${snack.name}`}
      maxWidth={460}
    >
      <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {serverError && (
          <div
            className="error-area"
            role="alert"
            style={{
              background: 'var(--gone-soft)',
              border: '2px solid var(--gone)',
              color: 'var(--gone-ink)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Snack Info Preview Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-2)',
            border: '2px solid var(--ink)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
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
            {snack.imageUrl ? (
              <img
                src={snack.imageUrl}
                alt={snack.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <CategoryIcon category={snack.category} size={24} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {snack.name}
            </h3>
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-muted)',
                marginTop: 2,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              Current: <strong>{snack.quantity}</strong> → Projected:{' '}
              <strong style={{ color: 'var(--stocked-ink)' }}>{projectedQuantity}</strong>
            </div>
          </div>
        </div>

        {/* Amount Stepper */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            Amount to Add
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '2.5px solid var(--ink)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow)',
              height: 52,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setAmount((a) => Math.max(1, a - 1))}
              disabled={amount <= 1 || isLoading}
              aria-label="Decrease restock amount"
              className="focus-ring"
              style={{
                width: 52,
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
              <Minus size={18} />
            </button>

            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={isLoading}
              aria-label="Restock quantity"
              style={{
                flex: 1,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontWeight: 900,
                fontSize: 22,
                color: 'var(--ink)',
                outline: 'none',
              }}
            />

            <button
              type="button"
              onClick={() => setAmount((a) => a + 1)}
              disabled={isLoading}
              aria-label="Increase restock amount"
              className="focus-ring"
              style={{
                width: 52,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Quick add chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[5, 10, 25, 50].map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => setAmount((a) => a + inc)}
              className="sticker focus-ring"
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1.5px solid var(--ink)',
                boxShadow: '2px 2px 0 var(--ink)',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--ink)',
              }}
            >
              +{inc}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Restocking..."
            style={{ flex: 2 }}
          >
            <ShoppingCart size={16} />
            Confirm Restock
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
