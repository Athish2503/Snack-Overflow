'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} style={style} aria-hidden="true" />;
}

export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: 16,
            width: i === lines - 1 && lines > 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 32 }: { size?: number }) {
  return (
    <Skeleton
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SkeletonAvatar size={48} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 16, width: '70%' }} />
          <Skeleton style={{ height: 13, width: '45%' }} />
        </div>
      </div>
      <Skeleton style={{ height: 13, width: '90%' }} />
      <Skeleton style={{ height: 13, width: '60%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Skeleton style={{ height: 32, width: 80, borderRadius: 10 }} />
        <Skeleton style={{ height: 32, width: 80, borderRadius: 10 }} />
      </div>
    </div>
  );
}
