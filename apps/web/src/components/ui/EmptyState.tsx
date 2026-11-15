'use client';

import React from 'react';
import { clsx } from 'clsx';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = "The pantry's empty. Suspicious.",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-4 py-16 px-8 text-center',
        className,
      )}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'var(--surface-2)',
          border: '2px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-muted)',
        }}
        aria-hidden="true"
      >
        {icon || <PackageOpen size={36} color="var(--ink)" strokeWidth={2} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p
          style={{
            fontFamily: 'var(--font-bricolage), Bricolage Grotesque, sans-serif',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {title}
        </p>
        {description && (
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0, maxWidth: 360 }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
