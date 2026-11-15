'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (compact) {
    return (
      <button
        onClick={toggle}
        className="focus-ring"
        title="Toggle theme"
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)',
          border: '2px solid transparent',
          background: 'transparent',
          color: 'var(--ink-muted)',
          cursor: 'pointer',
          transition: 'background 100ms',
        }}
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '2px solid transparent',
        background: 'transparent',
        color: 'var(--ink-muted)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 100ms',
        width: '100%',
      }}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <>
          <Sun size={18} />
          Light mode
        </>
      ) : (
        <>
          <Moon size={18} />
          Dark mode
        </>
      )}
    </button>
  );
}
