'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Check, AlertTriangle, X } from 'lucide-react';

export type StockStatus = 'stocked' | 'running_low' | 'running-low' | 'gone';
type BadgeVariant = 'stocked' | 'running_low' | 'running-low' | 'gone' | 'admin' | 'member' | 'custom';

interface BadgeProps {
  variant?: BadgeVariant;
  status?: StockStatus;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig: Record<
  'stocked' | 'running_low' | 'running-low' | 'gone',
  { bg: string; color: string; icon: React.ReactNode; label: string }
> = {
  stocked: {
    bg: 'var(--stocked-soft)',
    color: 'var(--stocked-ink)',
    icon: <Check size={11} strokeWidth={3} />,
    label: 'Stocked',
  },
  'running-low': {
    bg: 'var(--running-low-soft)',
    color: 'var(--running-low-ink)',
    icon: <AlertTriangle size={11} strokeWidth={2.8} />,
    label: 'Running low',
  },
  running_low: {
    bg: 'var(--running-low-soft)',
    color: 'var(--running-low-ink)',
    icon: <AlertTriangle size={11} strokeWidth={2.8} />,
    label: 'Running low',
  },
  gone: {
    bg: 'var(--gone-soft)',
    color: 'var(--gone-ink)',
    icon: <X size={11} strokeWidth={3} />,
    label: 'Gone',
  },
};

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  stocked: { background: 'var(--stocked-soft)', color: 'var(--stocked-ink)' },
  'running-low': {
    background: 'var(--running-low-soft)',
    color: 'var(--running-low-ink)',
  },
  running_low: {
    background: 'var(--running-low-soft)',
    color: 'var(--running-low-ink)',
  },
  gone: { background: 'var(--gone-soft)', color: 'var(--gone-ink)' },
  admin: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  member: { background: 'var(--surface-2)', color: 'var(--ink-muted)' },
  custom: {},
};

export function Badge({ variant = 'custom', label, icon, className, style }: BadgeProps) {
  return (
    <span
      className={clsx('badge', className)}
      style={{ ...variantStyles[variant], ...style }}
    >
      {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: StockStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="badge"
      style={{ background: cfg.bg, color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: 'ADMIN' | 'MEMBER' }) {
  return (
    <Badge
      variant={role === 'ADMIN' ? 'admin' : 'member'}
      label={role === 'ADMIN' ? 'Admin' : 'Member'}
    />
  );
}
