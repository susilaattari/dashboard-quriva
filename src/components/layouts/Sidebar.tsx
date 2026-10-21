'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Building2,
  Package,
  BookOpen,
  Users,
  GraduationCap,
  School,
  FileCheck,
  Palette,
  LogOut,
  ShieldAlert,
  HeartHandshake,
  Sparkles,
  Lock,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  featureKey?: string;
}

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export default function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const isGuru = user?.role === 'guru';

  const packageFeatures = typeof user?.package?.features === 'string'
    ? JSON.parse(user.package.features || '{}')
    : (user?.package?.features || {});

  const isNonPesantren = user?.tenant?.institution_type === 'non_pesantren' || user?.tenant?.has_wali === false;
  const memberLabel = user?.tenant?.member_label || (isNonPesantren ? 'Peserta' : 'Santri');

  const superAdminLinks: NavItem[] = [
    { href: '/superadmin/dashboard', label: 'Ringkasan SaaS', icon: LayoutDashboard },
    { href: '/superadmin/tenants', label: 'Kelola Tenant', icon: Building2 },
    { href: '/superadmin/packages', label: 'Paket Langganan', icon: Package },
    { href: '/superadmin/dashboard-content', label: 'Konten Portal & Kontak', icon: Sparkles },
    { href: '/superadmin/lms-global', label: 'LMS Global Tahsin', icon: BookOpen },
  ];

  const tenantAdminLinks: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard Institusi', icon: LayoutDashboard },
    { href: '/master/guru', label: 'Data Guru / Pengajar', icon: Users },
    { href: '/master/santri', label: `Data ${memberLabel}`, icon: GraduationCap },
    ...(!isNonPesantren
      ? [{ href: '/master/wali', label: 'Data Wali Santri', icon: HeartHandshake }]
      : []),
    { href: '/master/kelas', label: 'Data Kelas / Halaqah', icon: School },
    { href: '/hafalan/rekap', label: 'Rekap Setoran Hafalan', icon: FileCheck },
    { href: '/lms/materi', label: 'Modul Pembelajaran LMS', icon: BookOpen, featureKey: 'lms' },
    { href: '/settings/theme', label: 'Pengaturan & Branding', icon: Palette },
  ];

  // Specific navigation for Teachers/Ustadz (strictly hides institution management)
  const guruLinks: NavItem[] = [
    { href: '/dashboard', label: 'Beranda Asatidz', icon: LayoutDashboard },
    { href: '/hafalan/rekap', label: 'Input & Rekap Setoran', icon: FileCheck },
    { href: '/master/santri', label: `Data ${memberLabel} Halaqah`, icon: GraduationCap },
    { href: '/lms/materi', label: 'Modul Pembelajaran LMS', icon: BookOpen, featureKey: 'lms' },
  ];

  const links: NavItem[] = isSuperAdmin
    ? superAdminLinks
    : isGuru
    ? guruLinks
    : tenantAdminLinks;

  return (
    <aside className="flex h-full w-64 shrink-0 select-none flex-col justify-between border-r border-slate-200 bg-white text-slate-700 shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 lg:p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand font-bold text-white shadow-sm">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-tight tracking-wide text-slate-700">
              {isSuperAdmin ? 'Quriva Control Center' : user?.tenant?.name || 'Portal Institusi'}
            </h1>
            <p className="text-xs font-medium text-brand">
              {isSuperAdmin
                ? 'Super Admin Portal'
                : isGuru
                ? 'Portal Dewan Asatidz'
                : 'Admin Institusi'}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              autoFocus
              aria-label="Tutup menu navigasi"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5" aria-label="Navigasi utama">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Menu Utama
          </p>
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isLocked = !isSuperAdmin && Boolean(item.featureKey && packageFeatures && packageFeatures[item.featureKey] === false);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center justify-between rounded-lg border-l-[3px] px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-soft text-brand border-brand font-semibold'
                    : isLocked
                    ? 'border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-500'
                    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon size={18} className={isActive ? 'text-brand' : isLocked ? 'text-slate-300' : 'text-slate-400'} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isLocked && (
                  <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200 shrink-0 ml-1">
                    <Lock size={10} />
                    <span>PRO</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Footer */}
      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@domain.com'}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold shrink-0 ${
                isSuperAdmin
                  ? 'bg-slate-200 text-slate-700'
                  : isGuru
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-brand-soft text-brand'
              }`}
            >
              {isSuperAdmin ? 'SUPER' : isGuru ? 'GURU' : 'TENANT'}
            </span>
          </div>
          {!isSuperAdmin && (
            <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Paket:</span>
                <span className="font-semibold text-brand truncate max-w-[120px]">
                  {user?.package?.name || 'Paket Aktif'}
                </span>
              </div>
              {user?.tenant?.days_remaining !== undefined && user?.tenant?.days_remaining !== null && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Masa Aktif:</span>
                  <span className={`font-mono font-bold ${
                    user.tenant.days_remaining <= 7 ? 'text-rose-600' : 'text-brand'
                  }`}>
                    {user.tenant.days_remaining} hari lagi
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={16} />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
