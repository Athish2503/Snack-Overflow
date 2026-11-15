'use client';

import React, { useEffect, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ end, duration = 600, className, style }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration]);

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {count}
    </span>
  );
}
