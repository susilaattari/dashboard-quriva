'use client';

import React from 'react';
import { Activity, BookOpen, Building2, CreditCard, Users } from 'lucide-react';

interface PlatformKpiGridProps {
  metrics: {
    mrr: number;
    arr: number;
    total_tenants: number;
    active_tenants: number;
    pending_tenants: number;
    suspended_tenants: number;
    total_santri: number;
    total_guru: number;
    total_hafalan: number;
    total_tahsin: number;
    today_hafalan: number;
  };
  formatRupiah: (value: number) => string;
}

export default function PlatformKpiGrid({ metrics, formatRupiah }: PlatformKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">MRR (Monthly Revenue)</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600">
            <CreditCard size={20} />
          </div>
        </div>
        <div className="mt-3 text-2xl font-black text-slate-900 lg:text-3xl">{formatRupiah(metrics.mrr)}</div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-500">
          <span>Proyeksi ARR:</span>
          <span className="font-bold text-emerald-700">{formatRupiah(metrics.arr)}/th</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mitra Institusi Terdata</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-600">
            <Building2 size={20} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">{metrics.total_tenants}</span>
          <span className="text-xs font-medium text-slate-500">Lembaga</span>
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
          <span className="font-bold text-emerald-700">{metrics.active_tenants} Aktif</span>
          <span>•</span>
          <span className="font-semibold text-amber-700">{metrics.pending_tenants} Pending</span>
          <span>•</span>
          <span className="font-semibold text-rose-600">{metrics.suspended_tenants} Suspend</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Populasi Pembelajar</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
            <Users size={20} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">{metrics.total_santri}</span>
          <span className="text-xs font-medium text-slate-500">Santri / Peserta</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-500">
          <span>Dewan Asatidz:</span>
          <span className="font-bold text-slate-800">{metrics.total_guru} Guru</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Setoran Tercatat</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
            <BookOpen size={20} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">
            {(metrics.total_hafalan + metrics.total_tahsin).toLocaleString('id-ID')}
          </span>
          <span className="text-xs font-medium text-slate-500">Sesi</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <Activity size={13} className="animate-pulse motion-reduce:animate-none" /> Hari Ini:
          </span>
          <span className="font-bold text-slate-800">+{metrics.today_hafalan} Setoran</span>
        </div>
      </div>
    </div>
  );
}
