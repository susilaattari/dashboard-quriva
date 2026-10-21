'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Download,
  Eye,
  FileCheck2,
  FileText,
  Mic,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import AppShell from '@/components/layouts/AppShell';
import Dialog from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Pagination from '@/components/ui/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatStatus } from '@/lib/format';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

interface ConsentRow {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  tenant_id: number | null;
  tenant_name: string | null;
  tenant_subdomain: string | null;
  santri_id: number | null;
  santri_name: string | null;
  consent_type: 'privacy_policy' | 'voice_recording';
  document_version: string;
  status: 'approved' | 'revoked';
  agreed_at: string | null;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ConsentSummary {
  total_approved: number;
  privacy_approved: number;
  voice_approved: number;
  revoked: number;
  total_users: number;
  approved_users: number;
  coverage_percent: number;
}

interface ConsentManagementPageProps {
  scope: 'tenant' | 'global';
}

const CONSENT_LABELS: Record<string, string> = {
  privacy_policy: 'Kebijakan Privasi',
  voice_recording: 'Rekaman Suara Anak',
};

const ROLE_LABELS: Record<string, string> = {
  wali_santri: 'Wali Santri',
  guru: 'Guru / Ustadz',
  admin_tenant: 'Admin Institusi',
  super_admin: 'Super Admin',
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tone = 'emerald',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'emerald' | 'blue' | 'amber' | 'rose';
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-black text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ConsentManagementPage({ scope }: ConsentManagementPageProps) {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [consentType, setConsentType] = useState('all');
  const [status, setStatus] = useState('approved');
  const [tenantFilter, setTenantFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ConsentRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, consentType, status, tenantFilter]);

  const listParams = {
    page,
    per_page: pageSize,
    status,
    ...(consentType !== 'all' ? { consent_type: consentType } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(scope === 'global' && tenantFilter ? { tenant_id: tenantFilter } : {}),
  };

  const {
    items,
    pagination,
    error: listError,
    isLoading,
    mutate: mutateList,
  } = usePaginatedList<ConsentRow>('/admin/consents', listParams);

  const summaryKey: [string, string] =
    scope === 'global'
      ? ['/admin/consents/summary', tenantFilter]
      : ['/admin/consents/summary', 'tenant'];

  const { data: summary, mutate: mutateSummary } = useSWR<
    ConsentSummary,
    Error,
    [string, string]
  >(summaryKey, ([url, tenant]) =>
    api
      .get(url, {
        params: scope === 'global' && tenant && tenant !== 'tenant' ? { tenant_id: tenant } : {},
      })
      .then((res) => res.data?.data)
  );

  const { data: tenants = [] } = useSWR<any[]>(
    scope === 'global' ? '/tenants' : null,
    (url: string) => api.get(url).then((res) => res.data?.data || [])
  );

  const refresh = async () => {
    await Promise.all([mutateList(), mutateSummary()]);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError('');

    try {
      const res = await api.get('/admin/consents/export', {
        params: {
          status,
          ...(consentType !== 'all' ? { consent_type: consentType } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(scope === 'global' && tenantFilter ? { tenant_id: tenantFilter } : {}),
        },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `persetujuan-pengguna-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.response?.data?.message || err.message || 'Gagal mengekspor data.');
    } finally {
      setExporting(false);
    }
  };

  if (scope === 'tenant' && user?.role === 'guru') {
    return (
      <AppShell
        title="Akses Dibatasi"
        subtitle="Halaman ini hanya untuk Administrator Institusi"
      >
        <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
              <ShieldAlert size={30} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Akses Khusus Admin Institusi</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Data persetujuan pengguna hanya dapat dilihat oleh Administrator Institusi.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={scope === 'global' ? 'Persetujuan Global' : 'Persetujuan Pengguna'}
      subtitle={
        scope === 'global'
          ? 'Data persetujuan seluruh tenant di ekosistem Quriva'
          : 'Data pengguna yang telah menyetujui kebijakan dan rekaman suara'
      }
    >
      <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
              <ShieldCheck size={13} />
              Pusat Persetujuan
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-900">
              {scope === 'global' ? 'Rekap persetujuan semua tenant' : 'Data yang sudah menyetujui'}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              Gunakan filter untuk melihat persetujuan kebijakan privasi dan rekaman suara anak.
              Data yang dicabut tetap tersimpan untuk kebutuhan audit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Muat ulang
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download size={15} />
              {exporting ? 'Mengekspor...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {exportError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {exportError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Ringkasan persetujuan">
          <SummaryCard
            icon={<Users size={18} />}
            label="Cakupan Persetujuan"
            value={`${summary?.coverage_percent ?? 0}%`}
            hint={`${summary?.approved_users ?? 0} dari ${summary?.total_users ?? 0} pengguna`}
            tone="emerald"
          />
          <SummaryCard
            icon={<ShieldCheck size={18} />}
            label="Total Disetujui"
            value={summary?.total_approved ?? 0}
            hint="Baris persetujuan aktif"
            tone="blue"
          />
          <SummaryCard
            icon={<FileText size={18} />}
            label="Kebijakan Privasi"
            value={summary?.privacy_approved ?? 0}
            hint="Pengguna yang menyetujui"
            tone="emerald"
          />
          <SummaryCard
            icon={<Mic size={18} />}
            label="Rekaman Suara Anak"
            value={summary?.voice_approved ?? 0}
            hint="Persetujuan per anak"
            tone="amber"
          />
          <SummaryCard
            icon={<XCircle size={18} />}
            label="Dicabut"
            value={summary?.revoked ?? 0}
            hint="Tersimpan untuk audit"
            tone="rose"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, email, atau anak..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  aria-label="Cari persetujuan pengguna"
                />
              </label>

              <select
                value={consentType}
                onChange={(event) => setConsentType(event.target.value)}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none"
                aria-label="Filter jenis persetujuan"
              >
                <option value="all">Semua jenis</option>
                <option value="privacy_policy">Kebijakan Privasi</option>
                <option value="voice_recording">Rekaman Suara Anak</option>
              </select>

              {scope === 'global' && (
                <select
                  value={tenantFilter}
                  onChange={(event) => setTenantFilter(event.target.value)}
                  className="h-11 max-w-xs rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none"
                  aria-label="Filter tenant"
                >
                  <option value="">Semua tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Filter status">
              {[
                { key: 'approved', label: 'Disetujui' },
                { key: 'revoked', label: 'Dicabut' },
                { key: 'all', label: 'Semua' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setStatus(option.key)}
                  role="tab"
                  aria-selected={status === option.key}
                  className={`min-h-9 rounded-lg px-3 text-[11px] font-bold transition-colors ${
                    status === option.key
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : listError ? (
            <ErrorState
              title="Gagal memuat persetujuan"
              description="Periksa koneksi lalu coba lagi."
              onRetry={refresh}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<FileCheck2 size={22} />}
              title="Belum ada data persetujuan"
              description="Data akan muncul setelah pengguna menyetujui kebijakan di aplikasi."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Pengguna</th>
                      {scope === 'global' && <th className="px-4 py-3">Tenant</th>}
                      <th className="px-4 py-3">Anak</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Versi</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((row) => (
                      <tr key={row.id} className="align-top transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700">
                              {row.user_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">{row.user_name || '-'}</p>
                              <p className="truncate text-[11px] text-slate-500">{row.user_email}</p>
                              <p className="text-[10px] font-semibold text-slate-400">
                                {ROLE_LABELS[row.user_role] || row.user_role}
                              </p>
                            </div>
                          </div>
                        </td>
                        {scope === 'global' && (
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">{row.tenant_name || '-'}</p>
                            <p className="text-[11px] text-slate-400">{row.tenant_subdomain || '-'}</p>
                          </td>
                        )}
                        <td className="px-4 py-3 text-xs text-slate-600">{row.santri_name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                            {CONSENT_LABELS[row.consent_type] || row.consent_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{row.document_version}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.agreed_at)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              row.status === 'approved'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border border-rose-200 bg-rose-50 text-rose-700'
                            }`}
                          >
                            {row.status === 'approved' ? <ShieldCheck size={11} /> : <XCircle size={11} />}
                            {formatStatus(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            aria-label={`Lihat detail persetujuan ${row.user_name}`}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={pagination?.page || 1}
                totalItems={pagination?.total || 0}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </main>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Detail Persetujuan"
        description="Catatan persetujuan yang tersimpan untuk kebutuhan audit."
        size="md"
      >
        {selected && (
          <div className="space-y-3 text-sm">
            {[
              ['Nama pengguna', selected.user_name],
              ['Email', selected.user_email],
              ['Role', ROLE_LABELS[selected.user_role] || selected.user_role],
              ['Tenant', selected.tenant_name || '-'],
              ['Anak', selected.santri_name || '-'],
              ['Jenis persetujuan', CONSENT_LABELS[selected.consent_type] || selected.consent_type],
              ['Versi dokumen', selected.document_version],
              ['Status', formatStatus(selected.status)],
              ['Tanggal setuju', formatDate(selected.agreed_at)],
              ['Tanggal dicabut', formatDate(selected.revoked_at)],
              ['Alamat IP', selected.ip_address || '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="max-w-[65%] break-words text-right text-xs font-semibold text-slate-800">
                  {value || '-'}
                </span>
              </div>
            ))}
            {selected.user_agent && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Perangkat / browser</p>
                <p className="break-words rounded-xl bg-slate-50 p-3 font-mono text-[10px] text-slate-600">
                  {selected.user_agent}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
