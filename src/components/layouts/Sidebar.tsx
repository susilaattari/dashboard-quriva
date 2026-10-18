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
  Lock,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  featureKey?: string;
}

export default function Sidebar() {
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
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col justify-between border-r border-slate-800 shadow-xl select-none">
      <div>
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
            📖
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-wide text-white">
              {isSuperAdmin ? 'SaaS Tahfidz' : user?.tenant?.name || 'Portal Institusi'}
            </h1>
            <p className="text-xs text-emerald-400 font-medium">
              {isSuperAdmin
                ? 'Super Admin Portal'
                : isGuru
                ? 'Portal Dewan Asatidz'
                : 'Admin Institusi'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : isLocked
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon size={18} className={isActive ? 'text-white' : isLocked ? 'text-slate-500' : 'text-slate-400'} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isLocked && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30 shrink-0 ml-1">
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
      <div className="p-4 border-t border-slate-800/80">
        <div className="px-3 py-2.5 bg-slate-800/60 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@domain.com'}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold shrink-0 ${
                isSuperAdmin
                  ? 'bg-purple-500/20 text-purple-300'
                  : isGuru
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {isSuperAdmin ? 'SUPER' : isGuru ? 'GURU' : 'TENANT'}
            </span>
          </div>
          {!isSuperAdmin && (
            <div className="pt-2 border-t border-slate-700/50 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Paket:</span>
                <span className="font-semibold text-amber-300 truncate max-w-[120px]">
                  {user?.package?.name || 'Paket Aktif'}
                </span>
              </div>
              {user?.tenant?.days_remaining !== undefined && user?.tenant?.days_remaining !== null && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Masa Aktif:</span>
                  <span className={`font-mono font-bold ${
                    user.tenant.days_remaining <= 7 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                  }`}>
                    {user.tenant.days_remaining} hari lagi
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
