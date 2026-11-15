'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Flame } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { SnackCategory } from '@/lib/types';
import { CATEGORIES, CategoryIcon } from '@/lib/snackHelpers';
import { MultiImageUploader } from './MultiImageUploader';

interface AddSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSnackModal({ isOpen, onClose }: AddSnackModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SnackCategory>('SWEET');
  const [quantity, setQuantity] = useState(10);
  const [threshold, setThreshold] = useState(5);
  const [calories, setCalories] = useState<number | ''>('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    quantity?: string;
    threshold?: string;
    calories?: string;
  }>({});

  function resetForm() {
    setName('');
    setCategory('SWEET');
    setQuantity(10);
    setThreshold(5);
    setCalories('');
    setImages([]);
    setServerError('');
    setFieldErrors({});
  }

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Snack name is required';
    } else if (name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (quantity < 0 || isNaN(quantity)) {
      errors.quantity = 'Quantity cannot be negative';
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
      await api.post('/snacks', {
        name: name.trim(),
        category,
        quantity: Number(quantity),
        lowStockThreshold: Number(threshold),
        calories: calories === '' ? null : Number(calories),
        imageUrl: images.length > 0 ? images[0] : null,
        images: images,
      });

      toast.success(`Added "${name.trim()}" to the pantry!`);
      queryClient.invalidateQueries({ queryKey: ['snacks'] });
      queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setServerError('A snack with this name already exists in the pantry.');
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Failed to create snack. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add New Snack"
      description="Stock a new snack in the office pantry."
    >
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
          placeholder="e.g. Artisanal Sea Salt Dark Chocolate"
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
            htmlFor="add-calories"
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
            id="add-calories"
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

        {/* Initial Quantity & Low Stock Threshold */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label
              htmlFor="initial-quantity"
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 6,
              }}
            >
              Initial Quantity
            </label>
            <input
              id="initial-quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => {
                setQuantity(parseInt(e.target.value, 10) || 0);
                if (fieldErrors.quantity) setFieldErrors((p) => ({ ...p, quantity: undefined }));
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
            {fieldErrors.quantity && (
              <span style={{ fontSize: 12, color: 'var(--gone)', marginTop: 4, display: 'block' }}>
                {fieldErrors.quantity}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="low-threshold"
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 6,
              }}
            >
              Low-Stock Alert
            </label>
            <input
              id="low-threshold"
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
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              resetForm();
              onClose();
            }}
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
            loadingText="Adding snack..."
            style={{ flex: 2 }}
          >
            + Add to Pantry
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
