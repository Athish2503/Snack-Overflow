'use client';

import React, { useState } from 'react';
import { Minus, Plus, ShoppingCart, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Snack, SnackListResponse } from '@/lib/types';
import { SnackImage } from '@/components/ui/SnackImage';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  snack: Snack | null;
  onUpdated?: () => void;
}

export function RestockModal({ isOpen, onClose, snack: initialSnack, onUpdated }: RestockModalProps) {
  const queryClient = useQueryClient();
  const [overrideSnackId, setOverrideSnackId] = useState<string | null>(null);
  const [amount, setAmount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Fetch all inventory snacks for the picker
  const { data: allSnacksData } = useQuery<SnackListResponse>({
    queryKey: ['all-snacks-picker'],
    queryFn: () => api.get<SnackListResponse>('/snacks?limit=100'),
    enabled: isOpen,
  });

  const allSnacks = allSnacksData?.data || [];

  const currentSnackId = overrideSnackId || initialSnack?.id || (allSnacks.length > 0 ? allSnacks[0].id : '');

  const currentSnack =
    allSnacks.find((s) => s.id === currentSnackId) ||
    initialSnack ||
    (allSnacks.length > 0 ? allSnacks[0] : null);

  const projectedQuantity = currentSnack ? currentSnack.quantity + amount : amount;

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!currentSnack || amount <= 0) return;

    setIsLoading(true);
    setServerError('');

    try {
      await api.post(`/snacks/${currentSnack.id}/restock`, { amount });
      toast.success(`Restocked +${amount} ${currentSnack.name}!`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
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

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Restock Inventory"
      description={currentSnack ? `Add stock to ${currentSnack.name}` : 'Select a snack to restock'}
      maxWidth={460}
    >
      <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

        {/* Snack Picker Dropdown */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 6,
            }}
          >
            Select Snack
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={currentSnackId}
              onChange={(e) => setOverrideSnackId(e.target.value)}
              className="sticker focus-ring"
              style={{
                width: '100%',
                appearance: 'none',
                background: 'var(--surface)',
                border: '2px solid var(--ink)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow)',
                padding: '10px 36px 10px 14px',
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--ink)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              {allSnacks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.quantity} left)
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* Snack Info Preview Card */}
        {currentSnack && (
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
                flexShrink: 0,
              }}
            >
              <SnackImage
                src={currentSnack.imageUrl}
                alt={currentSnack.name}
                category={currentSnack.category}
                width="100%"
                height="100%"
                iconSize={24}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentSnack.name}
              </h3>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-muted)',
                  marginTop: 2,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                Current: <strong>{currentSnack.quantity}</strong> &rarr; Projected:{' '}
                <strong style={{ color: 'var(--stocked-ink)' }}>{projectedQuantity}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Amount Stepper */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 6,
            }}
          >
            Quantity to Add
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '2.5px solid var(--ink)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow)',
              height: 50,
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
                width: 50,
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
                fontSize: 20,
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
                width: 50,
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
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
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
