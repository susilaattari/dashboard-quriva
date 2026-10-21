'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getSupportWhatsAppUrl } from '@/config/brand';
import { getInitial } from '@/lib/format';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Bell, Sparkles, Building, AlertTriangle, ArrowRight, Menu } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function Navbar({ title, subtitle, onMenuClick }: NavbarProps) {
  const { user, isImpersonating, exitImpersonation } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const isExpiringSoon =
    !isSuperAdmin &&
    (user?.tenant?.is_expiring_soon ||
      (user?.tenant?.days_remaining !== undefined && user?.tenant?.days_remaining !== null && user.tenant.days_remaining <= 7));

  const formatExpiryDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
    } catch (e) {
      return iso;
    }
  };

  return (
    <>
      {/* Impersonation Banner for Super Admin */}
      {isImpersonating && (
        <div className="flex flex-col items-start justify-between gap-2 border-b border-emerald-800/30 bg-emerald-700 px-4 py-2.5 text-white shadow-md sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs font-semibold tracking-wide text-emerald-50">
              <span className="bg-white/20 text-white uppercase font-bold text-[10px] px-2 py-0.5 rounded tracking-wider mr-1.5 border border-white/30">
                Mode Impersonasi
              </span>
              Sedang menginspeksi sebagai Admin:{' '}
              <span className="font-bold text-white underline decoration-emerald-400 decoration-2 underline-offset-2">
                {user?.tenant?.name || 'Institusi Mitra'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={exitImpersonation}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-emerald-800 shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
          >
            <span>Kembali ke Super Admin</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 shadow-sm sm:px-6 lg:h-20 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Buka menu navigasi"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Menu size={22} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-800 lg:text-xl">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Tenant/Plan status badge */}
          {user?.tenant && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-soft border border-brand rounded-full text-brand text-xs font-semibold shadow-sm">
              <Building size={14} className="text-brand" />
              <span>{user.tenant.name}</span>
              {user.package && (
                <span className="bg-brand text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                  {user.package.code}
                </span>
              )}
            </div>
          )}

          {/* Global SuperAdmin badge */}
          {isSuperAdmin && (
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:flex">
              <Sparkles size={14} className="text-slate-500" />
              <span>SaaS Control Center</span>
            </div>
          )}

          <ThemeToggle />

          {/* Notification indicator */}
          <button
            type="button"
            aria-label="Notifikasi"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden="true" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-sm"
              aria-label={user?.name ? `Akun ${user.name}` : 'Akun pengguna'}
            >
              {getInitial(user?.name)}
            </div>
          </div>
        </div>
      </header>

      {/* Persistent Expiry Warning Alert Banner */}
      {isExpiringSoon && (
        <div className="sticky top-16 z-10 flex flex-col items-start justify-between gap-3 bg-rose-600 px-4 py-3 text-white shadow-md animate-slide-in-top motion-reduce:animate-none sm:flex-row sm:items-center sm:px-6 lg:top-20 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-rose-100" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                Peringatan: Masa Aktif Paket Langganan Tersisa {user?.tenant?.days_remaining} Hari Lagi!
              </p>
              <p className="text-[11px] text-rose-100 mt-0.5">
                Jatuh tempo: <strong>{formatExpiryDate(user?.tenant?.subscription_expires_at)}</strong>. Harap lakukan perpanjangan agar akses dashboard dan aplikasi mobile tidak dinonaktifkan otomatis.
              </p>
            </div>
          </div>

          <a
            href={getSupportWhatsAppUrl(
              `Halo Super Admin, saya dari lembaga "${user?.tenant?.name}" ingin memperpanjang paket langganan yang akan jatuh tempo pada ${formatExpiryDate(
                user?.tenant?.subscription_expires_at
              )}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-xs font-black text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
          >
            <span>Perpanjang Langganan Sekarang →</span>
          </a>
        </div>
      )}
    </>
  );
}
