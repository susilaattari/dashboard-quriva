import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['super_admin']}>{children}</RoleGuard>;
}
