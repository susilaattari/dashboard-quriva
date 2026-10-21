'use client';

import React from 'react';
import { Activity, AlertTriangle, Building2, CheckCircle2, MessageCircle, RefreshCw, Users } from 'lucide-react';
import { getTenantHost } from '@/config/brand';

interface PlatformOperationsPanelsProps {
  expiringSoonList: any[];
  recentActivities: any[];
  loading: boolean;
  onExtend: (tenant: any) => void;
  getBillingUrl: (tenant: any) => string;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PlatformOperationsPanels({
  expiringSoonList,
  recentActivities,
  loading,
  onExtend,
  getBillingUrl,
}: PlatformOperationsPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-7">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600">
                <AlertTriangle size={15} />
              </div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Pusat Peringatan Jatuh Tempo & Penagihan</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Mitra institusi yang masa aktifnya ≤ 7 hari atau memerlukan penagihan WhatsApp
            </p>
          </div>
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">
            {expiringSoonList.length} Jatuh Tempo
          </span>
        </div>

        <div className="max-h-[380px] flex-1 divide-y divide-slate-100 overflow-y-auto">
          {expiringSoonList.map((tenant) => {
            const days = tenant.days_remaining;
            const isSuspended = tenant.status === 'suspended' || (days !== null && days !== undefined && days <= 0);
            return (
              <div
                key={tenant.id}
                className="flex flex-col items-start justify-between gap-4 p-5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-sm font-bold text-slate-900">{tenant.name}</h4>
                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                      {getTenantHost(tenant.subdomain)}
                    </span>
                    <span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      {tenant.plan_name || 'Standard'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Users size={12} className="text-slate-400" />
                      {tenant.stats?.total_santri || 0} Santri
                    </span>
                    <span>•</span>
                    <span className="text-slate-700">
                      Admin: <strong>{tenant.admin_name || 'Belum diisi'}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-teal-700">
                      Est: {formatRupiah(tenant.expected_amount || tenant.plan_price || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
                  <div className="mr-1 text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                        isSuspended
                          ? 'border border-rose-200 bg-rose-50 text-rose-700'
                          : days === 0 || days === 1
                          ? 'animate-pulse border border-amber-300 bg-amber-50 text-amber-700 motion-reduce:animate-none'
                          : 'border border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isSuspended ? 'Kedaluwarsa' : `Sisa ${days} Hari`}
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-400">Tempo: {formatDate(tenant.subscription_expires_at)}</p>
                  </div>

                  <a
                    href={getBillingUrl(tenant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Kirim Pesan Tagihan Otomatis via WhatsApp"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                  >
                    <MessageCircle size={14} />
                    <span>Kirim WA</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onExtend(tenant)}
                    title="Perpanjang Masa Aktif"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    <RefreshCw size={12} />
                    <span>Perpanjang</span>
                  </button>
                </div>
              </div>
            );
          })}

          {expiringSoonList.length === 0 && !loading && (
            <div className="space-y-2 p-8 text-center text-slate-500">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-slate-800">Seluruh Mitra Institusi Memiliki Masa Aktif Aman</p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Tidak ada institusi yang mendekati jatuh tempo dalam 7 hari ke depan. Semua operasional berjalan lancar.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-5">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-100 bg-teal-50 text-teal-600">
              <Activity size={15} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Aktivitas Setoran Terkini</h3>
              <p className="mt-0.5 text-xs text-slate-500">Aliran setoran hafalan live dari santri berbagai lembaga</p>
            </div>
          </div>
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500 motion-reduce:animate-none" />
        </div>

        <div className="max-h-[380px] flex-1 divide-y divide-slate-100 overflow-y-auto p-2">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="rounded-xl p-3.5 transition-colors hover:bg-slate-50/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="max-w-[150px] truncate text-xs font-bold text-slate-900">{activity.santri_name}</span>
                  <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {activity.type}
                  </span>
                </div>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {activity.grade || 'Mumtaz'}
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-teal-700">
                  Surah {activity.surah_name}: Ayat {activity.verse_start}-{activity.verse_end}
                </span>
                <span className="text-[11px] text-slate-400">
                  {activity.created_at
                    ? new Date(activity.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-slate-500">
                <Building2 size={12} />
                <span>{activity.tenant_name}</span>
              </div>
            </div>
          ))}

          {recentActivities.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">Belum ada rekaman setoran hari ini.</div>
          )}
        </div>
      </div>
    </div>
  );
}
