import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['admin_tenant', 'guru']}>{children}</RoleGuard>;
}
