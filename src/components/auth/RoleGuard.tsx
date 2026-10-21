'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, User } from '@/store/useAuthStore';
import { FullPageLoader } from '@/components/ui/Skeleton';

interface RoleGuardProps {
  roles: User['role'][];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const roleKey = roles.join('|');

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!roles.includes(user.role)) {
      if (user.role === 'super_admin') {
        router.replace('/superadmin/dashboard');
      } else if (user.role === 'admin_tenant' || user.role === 'guru') {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, user, roleKey, roles, router]);

  if (isLoading || !user || !roles.includes(user.role)) {
    return <FullPageLoader label="Memeriksa sesi dan hak akses..." />;
  }

  return <>{children}</>;
}
