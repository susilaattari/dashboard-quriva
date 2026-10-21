'use client';

import React from 'react';
import { Building2, Check, ChevronRight, RefreshCw, UserCheck } from 'lucide-react';

interface PlatformDashboardHeaderProps {
  pendingList: any[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenTenants: () => void;
  onApproveFirst: (tenant: any) => void;
  onShowPending: () => void;
}

export default function PlatformDashboardHeader({
  pendingList,
  loading,
  refreshing,
  onRefresh,
  onOpenTenants,
  onApproveFirst,
  onShowPending,
}: PlatformDashboardHeaderProps) {
  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operasional Multi-Tenant Aktif</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Database: PostgreSQL</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Dashboard Manajemen Platform</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span>Segarkan Data</span>
          </button>

          <button
            type="button"
            onClick={onOpenTenants}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:opacity-90 active:scale-95"
          >
            <Building2 size={15} />
            <span>Kelola Seluruh Tenant</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {pendingList.length > 0 && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/90 p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-700">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">Tindakan Diperlukan</span>
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {pendingList.length} Menunggu Aktivasi
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-slate-700">
                Terdapat <strong className="text-slate-900">{pendingList.length} calon institusi</strong> yang telah mendaftar
                mandiri dan menunggu verifikasi pembayaran transfer Anda.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onApproveFirst(pendingList[0])}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:opacity-90 active:scale-95"
            >
              <Check size={14} />
              <span>Setujui Lembaga ({pendingList[0].name})</span>
            </button>
            <button
              type="button"
              onClick={onShowPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>Lihat Semua ({pendingList.length})</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
