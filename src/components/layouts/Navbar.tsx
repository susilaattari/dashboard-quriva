'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Bell, Sparkles, Building, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  const { user } = useAuthStore();
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
      <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Tenant/Plan status badge */}
          {user?.tenant && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold shadow-xs">
              <Building size={14} className="text-emerald-600" />
              <span>{user.tenant.name}</span>
              {user.package && (
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                  {user.package.code}
                </span>
              )}
            </div>
          )}

          {/* Global SuperAdmin badge */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-xs font-semibold">
              <Sparkles size={14} className="text-purple-600" />
              <span>SaaS Control Center</span>
            </div>
          )}

          {/* Notification indicator */}
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell size={18} />
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-2 right-2 ring-2 ring-white"></span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* Persistent Expiry Warning Alert Banner */}
      {isExpiringSoon && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md sticky top-20 z-19 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-amber-100 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                Peringatan: Masa Aktif Paket Langganan Tersisa {user?.tenant?.days_remaining} Hari Lagi!
              </p>
              <p className="text-[11px] text-amber-100 mt-0.5">
                Jatuh tempo: <strong>{formatExpiryDate(user?.tenant?.subscription_expires_at)}</strong>. Harap lakukan perpanjangan agar akses dashboard dan aplikasi mobile tidak dinonaktifkan otomatis.
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/6281234567890?text=${encodeURIComponent(
              `Halo Super Admin, saya dari lembaga "${user?.tenant?.name}" ingin memperpanjang paket langganan yang akan jatuh tempo pada ${formatExpiryDate(
                user?.tenant?.subscription_expires_at
              )}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-amber-900 hover:bg-amber-50 text-xs font-black rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Perpanjang Langganan Sekarang →</span>
          </a>
        </div>
      )}
    </>
  );
}
