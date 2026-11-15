'use client';

import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className,
}: ErrorCardProps) {
  return (
    <div
      className={clsx('card', className)}
      style={{ textAlign: 'center', padding: '32px 24px' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--gone-soft)',
            border: '2px solid var(--gone)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gone-ink)',
          }}
          aria-hidden="true"
        >
          <AlertTriangle size={32} />
        </div>
        <p
          style={{
            fontFamily: 'var(--font-bricolage), Bricolage Grotesque, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          Unable to load inventory
        </p>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0, maxWidth: 360 }}>
          {message}
        </p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} style={{ marginTop: 4 }}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
