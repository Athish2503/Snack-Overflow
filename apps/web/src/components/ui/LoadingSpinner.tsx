'use client';

import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
};

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const px = sizeMap[size];
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx('spinner', className)}
      style={{ width: px, height: px }}
    />
  );
}
