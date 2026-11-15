'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, rightElement, id, className, wrapperClassName, ...props },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div
        className={clsx('flex flex-col gap-1.5', wrapperClassName)}
      >
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              display: 'block',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={ref}
            id={inputId}
            className={clsx('focus-ring', className)}
            style={{
              width: '100%',
              height: 48,
              padding: rightElement ? '0 48px 0 14px' : '0 14px',
              background: 'var(--surface)',
              border: error ? '2px solid var(--gone)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 15,
              color: 'var(--ink)',
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 100ms ease, box-shadow 100ms ease',
            }}
            {...props}
          />
          {rightElement && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                paddingRight: 12,
              }}
            >
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <span
            style={{ fontSize: 13, color: 'var(--gone)', fontWeight: 500 }}
            role="alert"
          >
            {error}
          </span>
        )}
        {!error && hint && (
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{hint}</span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
