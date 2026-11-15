'use client';

import React from 'react';

const EMOJIS = ['🥨', '🍫', '🍪', '🧃', '🥜', '🍿', '✨', '⚡'];

interface EmojiBurstProps {
  burstId: number;
}

export function EmojiBurst({ burstId }: EmojiBurstProps) {
  if (!burstId) return null;

  const count = 7;
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI + ((burstId % 10) / 10 - 0.5) * 0.5;
    const distance = 32 + ((burstId * (i + 1)) % 30);
    const dx = Math.round(Math.cos(angle) * distance);
    const dy = Math.round(Math.sin(angle) * distance) - 12;
    const rotate = Math.round(((burstId * (i + 3)) % 120) - 60);
    return {
      id: `${burstId}-${i}`,
      emoji: EMOJIS[i % EMOJIS.length],
      dx,
      dy,
      rotate,
    };
  });

  return (
    <div
      key={burstId}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes emoji-particle-fly {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--p-dx)), calc(-50% + var(--p-dy))) scale(0.3) rotate(var(--p-rot));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .emoji-particle {
            display: none !important;
          }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          className="emoji-particle"
          style={
            {
              position: 'absolute',
              fontSize: 16,
              userSelect: 'none',
              '--p-dx': `${p.dx}px`,
              '--p-dy': `${p.dy}px`,
              '--p-rot': `${p.rotate}deg`,
              animation: 'emoji-particle-fly 700ms cubic-bezier(.22, 1, .36, 1) forwards',
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
