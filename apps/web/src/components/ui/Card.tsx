'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
  interactive?: boolean;
}

export function Card({
  children,
  className,
  style,
  as: Tag = 'div',
  interactive = false,
}: CardProps) {
  return (
    <Tag
      className={clsx('card', interactive && 'sticker', className)}
      style={{ cursor: interactive ? 'pointer' : undefined, ...style }}
    >
      {children}
    </Tag>
  );
}
