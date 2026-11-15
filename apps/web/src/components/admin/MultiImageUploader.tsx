'use client';

import React, { useRef, useState } from 'react';
import { Upload, Plus, Trash2, Star } from 'lucide-react';
import { ImageCarousel } from '../ui/ImageCarousel';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    const maxFiles = Math.min(files.length, 6);

    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newImages.push(result);
          if (newImages.length === maxFiles || i === maxFiles - 1) {
            onChange([...images, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setUrlError('URL must start with http:// or https://');
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
          <Upload size={15} className="text-[var(--primary)]" />
          <span>Snack Photos & Carousel ({images.length})</span>
        </label>
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--gone)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Live Interactive Carousel Preview */}
      {images.length > 0 && (
        <div className="rounded-xl border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] overflow-hidden">
          <ImageCarousel
            images={images}
            heightClass="h-[150px]"
            alt="Product Preview Carousel"
            showIndicators={true}
            showArrows={true}
          />
        </div>
      )}

      {/* Drag & Drop File Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
            : 'border-[var(--ink)]/40 hover:border-[var(--primary)] hover:bg-[var(--surface-2)] bg-[var(--surface)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border-2 border-[var(--ink)] shadow-[1px_1px_0_var(--ink)] flex items-center justify-center">
          <Upload size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--ink)]">
            Click to upload or drag & drop images
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            PNG, JPG, WebP supported • Multiple files can be selected
          </p>
        </div>
      </div>

      {/* Add via URL Input */}
      <div>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (urlError) setUrlError('');
            }}
            placeholder="Or paste an image URL (e.g. Unsplash)..."
            disabled={disabled}
            className="flex-1 px-3 py-2 text-xs rounded-lg border-2 border-[var(--ink)] bg-[var(--surface-2)] text-[var(--ink)] shadow-[1px_1px_0_var(--ink)] outline-none focus:border-[var(--primary)]"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={disabled || !urlInput.trim()}
            className="px-3 py-2 rounded-lg bg-[var(--surface)] border-2 border-[var(--ink)] text-xs font-bold shadow-[2px_2px_0_var(--ink)] hover:bg-[var(--primary-soft)] active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
        {urlError && <p className="text-xs text-[var(--gone)] mt-1 font-semibold">{urlError}</p>}
      </div>

      {/* Thumbnails Management Strip */}
      {images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider">
            Reorder & Cover Selection
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group shrink-0 w-16 h-16 rounded-lg border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] overflow-hidden bg-[var(--surface-2)]"
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary/Cover Indicator */}
                {idx === 0 && (
                  <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-tight border border-[var(--ink)] shadow-[0.5px_0.5px_0_var(--ink)]">
                    Cover
                  </div>
                )}

                {/* Hover overlay with Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleMakeCover(idx)}
                      title="Set as Cover"
                      className="p-1 rounded bg-white text-[var(--ink)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                    >
                      <Star size={12} fill="currentColor" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Remove Image"
                    className="p-1 rounded bg-white text-[var(--gone)] hover:bg-[var(--gone)] hover:text-white transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
