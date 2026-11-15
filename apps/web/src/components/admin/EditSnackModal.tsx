'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Flame } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Snack, SnackCategory } from '@/lib/types';
import { CATEGORIES, CategoryIcon } from '@/lib/snackHelpers';
import { MultiImageUploader } from './MultiImageUploader';

interface EditSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  snack: Snack | null;
  onUpdated?: () => void;
}

interface EditSnackFormProps {
  snack: Snack;
  onClose: () => void;
  onUpdated?: () => void;
}

function EditSnackForm({ snack, onClose, onUpdated }: EditSnackFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(snack.name);
  const [category, setCategory] = useState<SnackCategory>(snack.category);
  const [threshold, setThreshold] = useState(snack.lowStockThreshold);
  const [calories, setCalories] = useState<number | ''>(snack.calories ?? '');
  const [images, setImages] = useState<string[]>(
    snack.images && snack.images.length > 0
      ? snack.images
      : snack.imageUrl
      ? [snack.imageUrl]
      : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    threshold?: string;
    calories?: string;
  }>({});

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Snack name cannot be empty';
    } else if (name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (threshold < 0 || isNaN(threshold)) {
      errors.threshold = 'Threshold cannot be negative';
    }

    if (calories !== '' && (Number(calories) < 0 || isNaN(Number(calories)))) {
      errors.calories = 'Calories cannot be negative';
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      await api.patch(`/snacks/${snack.id}`, {
        name: name.trim(),
        category,
        lowStockThreshold: Number(threshold),
        calories: calories === '' ? null : Number(calories),
        imageUrl: images.length > 0 ? images[0] : null,
        images: images,
      });

      toast.success(`Updated "${name.trim()}" successfully!`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      onUpdated?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setServerError('Another snack with this name already exists.');
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Failed to update snack. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

      {/* Snack Name */}
      <Input
        label="Snack Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
        }}
        error={fieldErrors.name}
        disabled={isLoading}
        required
      />

      {/* Category Segmented Control */}
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
          Category
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          {(Object.keys(CATEGORIES) as SnackCategory[]).map((catKey) => {
            const meta = CATEGORIES[catKey];
            const isSelected = category === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategory(catKey)}
                className="sticker focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? meta.bgSoft : 'var(--surface-2)',
                  color: 'var(--ink)',
                  border: isSelected ? `2.5px solid ${meta.tint}` : '2px solid var(--ink)',
                  boxShadow: isSelected ? `3px 3px 0 ${meta.tint}` : 'var(--shadow)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 14,
                  transition: 'all 120ms ease',
                }}
              >
                <CategoryIcon category={catKey} size={18} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calories Input */}
      <div>
        <label
          htmlFor="edit-calories"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 6,
          }}
        >
          <Flame size={14} color="var(--primary)" />
          Calories (kcal)
        </label>
        <input
          id="edit-calories"
          type="number"
          min={0}
          placeholder="e.g. 180"
          value={calories}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
            setCalories(val);
            if (fieldErrors.calories) setFieldErrors((p) => ({ ...p, calories: undefined }));
          }}
          disabled={isLoading}
          className="sticker focus-ring"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--ink)',
            background: 'var(--surface-2)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            color: 'var(--ink)',
            boxShadow: 'var(--shadow)',
            outline: 'none',
          }}
        />
        {fieldErrors.calories && (
          <span style={{ fontSize: 12, color: 'var(--gone)', marginTop: 4, display: 'block' }}>
            {fieldErrors.calories}
          </span>
        )}
      </div>

      {/* Multi-Image Uploader & Carousel Preview */}
      <MultiImageUploader
        images={images}
        onChange={setImages}
        disabled={isLoading}
      />

      {/* Low Stock Threshold */}
      <div>
        <label
          htmlFor="edit-low-threshold"
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 6,
          }}
        >
          Low-Stock Alert Threshold
        </label>
        <input
          id="edit-low-threshold"
          type="number"
          min={0}
          value={threshold}
          onChange={(e) => {
            setThreshold(parseInt(e.target.value, 10) || 0);
            if (fieldErrors.threshold) setFieldErrors((p) => ({ ...p, threshold: undefined }));
          }}
          disabled={isLoading}
          className="sticker focus-ring"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--ink)',
            background: 'var(--surface-2)',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            color: 'var(--ink)',
            boxShadow: 'var(--shadow)',
            outline: 'none',
          }}
        />
        {fieldErrors.threshold && (
          <span style={{ fontSize: 12, color: 'var(--gone)', marginTop: 4, display: 'block' }}>
            {fieldErrors.threshold}
          </span>
        )}
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
          loadingText="Saving..."
          style={{ flex: 2 }}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}

export function EditSnackModal({ isOpen, onClose, snack, onUpdated }: EditSnackModalProps) {
  if (!snack) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Snack Details"
      description={`Update settings for ${snack.name}`}
    >
      <EditSnackForm key={snack.id} snack={snack} onClose={onClose} onUpdated={onUpdated} />
    </Dialog>
  );
}
