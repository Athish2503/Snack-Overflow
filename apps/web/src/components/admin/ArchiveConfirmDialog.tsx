'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Snack } from '@/lib/types';

interface ArchiveConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  snack: Snack | null;
  onArchived?: () => void;
}

export function ArchiveConfirmDialog({
  isOpen,
  onClose,
  snack,
  onArchived,
}: ArchiveConfirmDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!snack) return null;

  async function handleArchive() {
    if (!snack) return;

    setIsLoading(true);
    setServerError('');

    try {
      await api.delete(`/snacks/${snack.id}`);
      toast.success(`Archived "${snack.name}" from the pantry.`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onArchived?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Failed to archive snack.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Snack"
      description="Remove snack from active pantry inventory"
      maxWidth={440}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            }}
          >
            <AlertTriangle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--gone-soft)',
            border: '2px solid var(--gone)',
          }}
        >
          <AlertTriangle size={24} style={{ color: 'var(--gone)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--gone-ink)',
                margin: '0 0 4px',
              }}
            >
              Are you sure?
            </h4>
            <p style={{ fontSize: 14, color: 'var(--gone-ink)', margin: 0, lineHeight: 1.4 }}>
              <strong>{snack.name}</strong> will be hidden from the pantry inventory. Past
              consumption logs and vote statistics will remain preserved.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
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
            type="button"
            variant="danger"
            size="md"
            isLoading={isLoading}
            loadingText="Archiving..."
            leftIcon={<Trash2 size={16} />}
            onClick={handleArchive}
            style={{ flex: 1 }}
          >
            Archive Snack
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
