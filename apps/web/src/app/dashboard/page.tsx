'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminControlRoom } from '@/components/admin/AdminControlRoom';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  // Server-enforced data: render Admin Bento Grid Control Room for ADMIN, Member Home for others
  if (user?.role === 'ADMIN') {
    return <AdminControlRoom />;
  }

  return <MemberDashboard />;
}
