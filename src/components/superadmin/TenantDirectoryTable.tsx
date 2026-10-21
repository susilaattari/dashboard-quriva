'use client';

import React from 'react';
import { Check, CheckCircle2, MessageCircle, Shield, UserPlus, X, XCircle, Zap } from 'lucide-react';
import { getTenantHost } from '@/config/brand';

interface TenantDirectoryTableProps {
  tenants: any[];
  currentPage: number;
  pageSize: number;
  loading: boolean;
  search: string;
  impersonatingId: number | null;
  onImpersonate: (tenant: any) => void;
  onOpenDetail: (tenant: any) => void;
  onReject: (id: number) => void;
  onExtend: (id: number, months: number) => void;
  onQuota: (tenant: any) => void;
  onToggleStatus: (id: number, status: string, name: string) => void;
}

function formatExpiryDate(iso?: string) {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function TenantDirectoryTable({
  tenants,
  currentPage,
  pageSize,
  loading,
  search,
  impersonatingId,
  onImpersonate,
  onOpenDetail,
  onReject,
  onExtend,
  onQuota,
  onToggleStatus,
}: TenantDirectoryTableProps) {
  return (
    <>
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-emerald-700 text-xs font-semibold uppercase text-white">
          <tr>
            <th className="w-14 whitespace-nowrap px-4 py-3.5 text-center">No</th>
            <th className="whitespace-nowrap px-4 py-3.5">Institusi Mitra</th>
            <th className="whitespace-nowrap px-4 py-3.5">Subdomain Akses</th>
            <th className="whitespace-nowrap px-4 py-3.5">Paket & Kontak</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-center">Santri / Kuota</th>
            <th className="whitespace-nowrap px-4 py-3.5">Jatuh Tempo</th>
            <th className="whitespace-nowrap px-4 py-3.5">Status</th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 text-slate-700">
          {tenants.map((tenant, index) => {
            const isPending = tenant.status === 'pending_approval';
            const isRejected = tenant.status === 'rejected';
            const isNonPesantren = tenant.institution_type === 'non_pesantren' || tenant.has_wali === false;
            const rowNumber = (currentPage - 1) * pageSize + index + 1;

            return (
              <tr key={tenant.id} className="group">
                <td className="whitespace-nowrap bg-slate-100 px-4 py-3 text-center font-semibold text-slate-600 transition-colors group-hover:bg-emerald-100/70">
                  {rowNumber}
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <div className="font-semibold text-slate-700">
                    {tenant.name}
                    {isPending && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        Pendaftar Baru
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {isNonPesantren ? 'Non-Pesantren (Mandiri)' : 'Pesantren (Wali)'} • PIC: {tenant.admin_name || 'Admin'}
                    {tenant.admin_phone && ` (${tenant.admin_phone})`}
                  </div>
                </td>

                <td className="whitespace-nowrap bg-slate-50 px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <span className="rounded-lg bg-emerald-100/70 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800">
                    {getTenantHost(tenant.subdomain)}
                  </span>
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <div className="text-xs font-semibold uppercase text-slate-700">{tenant.plan_name || 'Standar'}</div>
                  {tenant.admin_phone && (
                    <a
                      href={`https://wa.me/${tenant.admin_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline"
                    >
                      <MessageCircle size={12} />
                      <span>Chat WA Pendaftar</span>
                    </a>
                  )}
                </td>

                <td className="whitespace-nowrap bg-slate-50 px-4 py-3 text-center transition-colors group-hover:bg-emerald-50">
                  <span className="font-bold text-slate-700">{tenant.stats?.total_santri || 0}</span>{' '}
                  <span className="text-xs text-slate-400">/ {tenant.santri_quota || tenant.plan_max_santri || 100}</span>
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <div className="text-xs font-semibold text-slate-700">
                    {isPending ? 'Menunggu Aktivasi' : formatExpiryDate(tenant.subscription_expires_at)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {isPending ? (
                      <span>Belum aktif</span>
                    ) : tenant.is_expired || tenant.status === 'suspended' ? (
                      <span className="font-semibold text-rose-600">Telah berakhir</span>
                    ) : tenant.days_remaining !== null && tenant.days_remaining <= 7 ? (
                      <span className="font-semibold text-rose-600">{tenant.days_remaining} hari lagi</span>
                    ) : tenant.days_remaining !== null ? (
                      <span className="font-medium text-emerald-700">{tenant.days_remaining} hari lagi</span>
                    ) : (
                      <span>Aktif</span>
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap bg-slate-50 px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPending
                        ? 'bg-slate-200 text-slate-700'
                        : tenant.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isPending ? 'bg-slate-500' : tenant.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {isPending
                      ? 'Menunggu Approval'
                      : isRejected
                      ? 'Ditolak'
                      : tenant.status === 'active'
                      ? 'Aktif'
                      : 'Ditangguhkan'}
                  </span>
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  {isPending ? (
                    <div className="flex flex-nowrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(tenant)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                      >
                        <Check size={14} />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(tenant.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                        title="Tolak Pendaftaran"
                        aria-label="Tolak pendaftaran tenant"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-nowrap items-center justify-end gap-2">
                      {tenant.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => onImpersonate(tenant)}
                          disabled={impersonatingId === tenant.id}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-500 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-600 disabled:opacity-50"
                          title="Masuk ke portal sebagai Admin Institusi ini"
                        >
                          <Zap size={13} className={impersonatingId === tenant.id ? 'animate-spin' : ''} />
                          <span>{impersonatingId === tenant.id ? 'Memproses...' : 'Masuk Portal'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onExtend(tenant.id, 1)}
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        title="Perpanjang langganan +1 Bulan"
                      >
                        +1 Bln
                      </button>
                      <button
                        type="button"
                        onClick={() => onExtend(tenant.id, 12)}
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        title="Perpanjang langganan +1 Tahun"
                      >
                        +1 Thn
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuota(tenant)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                        title="Tambah kuota santri / peserta tenant ini"
                      >
                        <UserPlus size={13} />
                        <span>+ Kuota</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(tenant.id, tenant.status, tenant.name)}
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          tenant.status === 'active'
                            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={tenant.status === 'active' ? 'Suspend Tenant' : 'Aktifkan Tenant'}
                        aria-label={tenant.status === 'active' ? 'Suspend tenant' : 'Aktifkan tenant'}
                      >
                        {tenant.status === 'active' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tenants.length === 0 && !loading && (
        <div className="p-12 text-center">
          <Shield size={48} className="mx-auto mb-3 text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">Tidak ada tenant ditemukan</h4>
          <p className="mt-1 text-xs text-slate-400">
            {search ? 'Coba ubah kata kunci pencarian Anda' : 'Belum ada data tenant pada kategori ini.'}
          </p>
        </div>
      )}
    </>
  );
}
