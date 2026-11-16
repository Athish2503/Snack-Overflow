'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src="/snack-overflow-mark.svg"
          alt="Snack Overflow"
          width={80}
          height={80}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <LoadingSpinner size="lg" />
    </div>
  );
}
