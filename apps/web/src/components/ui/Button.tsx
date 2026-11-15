'use client';

import React from 'react';
import { clsx } from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--primary)',
    color: 'var(--ink)',
    border: 'var(--border)',
    boxShadow: 'var(--shadow)',
  },
  secondary: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: 'var(--border)',
    boxShadow: 'var(--shadow)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink)',
    border: 'var(--border)',
    boxShadow: 'none',
  },
  icon: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: 'var(--border)',
    boxShadow: 'var(--shadow)',
    padding: 0,
    minWidth: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  danger: {
    background: 'var(--gone-soft)',
    color: 'var(--gone-ink)',
    border: '2px solid var(--gone)',
    boxShadow: '4px 4px 0 var(--gone-ink)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: 13, padding: '6px 14px', minHeight: 36, borderRadius: 'var(--radius-sm)' },
  md: { fontSize: 15, padding: '10px 20px', minHeight: 44, borderRadius: 'var(--radius-sm)' },
  lg: { fontSize: 17, padding: '12px 28px', minHeight: 52, borderRadius: 'var(--radius-md)' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={clsx('sticker focus-ring', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontWeight: 700,
        lineHeight: 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'transform 100ms ease, box-shadow 100ms ease, opacity 100ms ease',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(variant === 'icon' ? {} : {}),
        ...style,
      }}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}
