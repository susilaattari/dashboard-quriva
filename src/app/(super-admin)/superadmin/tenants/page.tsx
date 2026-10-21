'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layouts/AppShell';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { BRAND, getTenantHost } from '@/config/brand';
import { safeString } from '@/lib/format';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ErrorState from '@/components/ui/ErrorState';
import QuotaRequestTable from '@/components/superadmin/QuotaRequestTable';
import TenantDirectoryTable from '@/components/superadmin/TenantDirectoryTable';
import TenantFilterTabs from '@/components/superadmin/TenantFilterTabs';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  MoreVertical,
  AlertCircle,
  Clock,
  MessageCircle,
  Check,
  X,
  CreditCard,
  UserCheck,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

export default function SuperAdminTenants() {
  const router = useRouter();
  const { impersonateTenant } = useAuthStore();
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending_approval' | 'quota_requests' | 'active' | 'suspended'>('all');
  const [quotaRequests, setQuotaRequests] = useState<any[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const debouncedSearch = useDebouncedValue(search);
  const statusParam =
    activeTab === 'pending_approval' || activeTab === 'active' || activeTab === 'suspended'
      ? activeTab
      : undefined;
  const {
    items: tenants,
    pagination,
    counts,
    error: listError,
    isLoading: listLoading,
    mutate: mutateTenants,
  } = usePaginatedList<any>('/tenants', {
    page: currentPage,
    per_page: pageSize,
    search: debouncedSearch,
    status: statusParam,
  });
  const loading = supportLoading || listLoading;
  const error = supportError || (listError ? 'Gagal memuat data tenant. Periksa koneksi Anda lalu coba lagi.' : '');
  const totalTenants = counts?.total ?? pagination?.total ?? tenants.length;
  const pendingCount = counts?.pending ?? tenants.filter((tenant) => tenant.status === 'pending_approval').length;
  const activeCount = counts?.active ?? tenants.filter((tenant) => tenant.status === 'active').length;
  const suspendedCount =
    counts?.suspended ?? tenants.filter((tenant) => tenant.status === 'suspended' || tenant.status === 'rejected').length;

  // Modal Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSubdomain, setFormSubdomain] = useState('');
  const [formPlanId, setFormPlanId] = useState(1);
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [formAdminPhone, setFormAdminPhone] = useState('');
  const [formAdminPassword, setFormAdminPassword] = useState('');
  const [showFormAdminPassword, setShowFormAdminPassword] = useState(false);
  const [formInstitutionType, setFormInstitutionType] = useState<'pesantren' | 'non_pesantren'>('pesantren');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal Review & Detail State
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [approvalMonths, setApprovalMonths] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{ tenantId: number; tenantName: string; newStatus: 'active' | 'suspended' } | null>(null);

  const fetchSupportData = async () => {
    try {
      setSupportLoading(true);
      setSupportError('');
      const [packagesRes, quotaRes] = await Promise.all([
        api.get('/packages'),
        api.get('/quota-requests'),
      ]);
      setPackages(packagesRes.data?.data || []);
      setQuotaRequests(quotaRes.data?.data || []);
      if (packagesRes.data?.data?.length > 0) {
        setFormPlanId(packagesRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load tenant support data:', err);
      setSupportError('Gagal memuat data pendukung tenant. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchSupportData(), mutateTenants()]);
  };

  useEffect(() => {
    if (pagination && pagination.total_pages < currentPage) {
      setCurrentPage(pagination.total_pages);
    }
  }, [pagination, currentPage]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      await api.post('/tenants', {
        name: formName,
        subdomain: formSubdomain.toLowerCase().trim(),
        plan_id: formPlanId,
        admin_name: formAdminName,
        admin_email: formAdminEmail,
        phone: formAdminPhone,
        admin_password: formAdminPassword,
        institution_type: formInstitutionType,
        has_wali: formInstitutionType === 'pesantren',
        member_label: formInstitutionType === 'non_pesantren' ? 'Peserta' : 'Santri',
      });

      setIsModalOpen(false);
      setFormName('');
      setFormSubdomain('');
      setFormAdminName('');
      setFormAdminEmail('');
      setFormAdminPhone('');
      setFormAdminPassword('');
      setFormInstitutionType('pesantren');
      fetchData();
    } catch (err: any) {
      const rawMsg = String(err.response?.data?.message || err.message || '');
      if (rawMsg.includes('tenants_subdomain_unique') || rawMsg.includes('subdomain') || rawMsg.includes('duplicate key')) {
        setModalError(`Subdomain '${formSubdomain}' sudah digunakan. Silakan gunakan subdomain yang lain.`);
      } else {
        setModalError(rawMsg || 'Gagal menambahkan tenant');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (tenantId: number, months?: number) => {
    try {
      setActionLoading(true);
      const effectiveMonths = months || approvalMonths || selectedTenant?.duration_months || 1;
      await api.put(`/tenants/${tenantId}/approve`, { extend_months: effectiveMonths });
      setIsDetailModalOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui pendaftaran tenant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (tenantId: number) => {
    const reason = prompt('Masukkan alasan penolakan pendaftaran (wajib diisi):', '');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/tenants/${tenantId}/reject`, { reason });
      setIsDetailModalOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menolak pendaftaran tenant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (tenantId: number, currentStatus: string, tenantName: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setStatusConfirm({ tenantId, tenantName, newStatus });
  };

  const performToggleStatus = async () => {
    if (!statusConfirm) return;
    try {
      setActionLoading(true);
      await api.put(`/tenants/${statusConfirm.tenantId}`, { status: statusConfirm.newStatus });
      setStatusConfirm(null);
      fetchData();
    } catch (err) {
      alert('Gagal mengubah status tenant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendSubscription = async (tenantId: number, months: number) => {
    if (!confirm(`Perpanjang masa aktif langganan tenant ini selama ${months} bulan?`)) return;
    try {
      await api.put(`/tenants/${tenantId}`, { extend_months: months });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal memperpanjang langganan');
    }
  };

  const handleImpersonate = async (tenant: any) => {
    if (!confirm(`Apakah Anda yakin ingin masuk ke dashboard sebagai Administrator "${tenant.name}"?`)) {
      return;
    }

    try {
      setImpersonatingId(tenant.id);
      await impersonateTenant(tenant.id);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Impersonation error:', err);
      alert(err.message || 'Gagal melakukan impersonasi institusi.');
      setImpersonatingId(null);
    }
  };

  // Tambah kuota santri / peserta (tenant yang sedang berlangganan)
  const [quotaTenant, setQuotaTenant] = useState<any>(null);
  const [quotaAdd, setQuotaAdd] = useState<number | ''>(10);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState('');
  const [quotaResult, setQuotaResult] = useState<any>(null);

  const getTenantQuota = (t: any) => Number(t?.santri_quota || t?.plan_max_santri || 10);

  const calcPeriodPrice = (t: any, quota: number) => {
    const basePrice = Number(t?.plan_price || 0);
    const baseCapacity = Number(t?.plan_max_santri || 10);
    const extraPrice = Number(t?.plan_extra_price_per_user || 0);
    const features = t?.plan_features || {};
    if (features.pricing_type === 'per_user') return quota * basePrice;
    return basePrice + Math.max(0, quota - baseCapacity) * extraPrice;
  };

  const quotaExtraPrice = quotaTenant
    ? Math.max(
        0,
        calcPeriodPrice(quotaTenant, getTenantQuota(quotaTenant) + (Number(quotaAdd) || 0)) -
          calcPeriodPrice(quotaTenant, getTenantQuota(quotaTenant))
      )
    : 0;

  const openQuotaModal = (tenant: any) => {
    setQuotaTenant(tenant);
    setQuotaAdd(10);
    setQuotaError('');
    setQuotaResult(null);
  };

  const closeQuotaModal = () => {
    setQuotaTenant(null);
    setQuotaResult(null);
    setQuotaError('');
  };

  const handleAddQuota = async () => {
    if (!quotaTenant) return;
    const add = Number(quotaAdd);
    if (!add || add < 1) {
      setQuotaError('Masukkan jumlah tambahan minimal 1.');
      return;
    }
    try {
      setQuotaLoading(true);
      setQuotaError('');
      const res = await api.put(`/tenants/${quotaTenant.id}/quota`, { add_santri: add });
      setQuotaResult(res.data?.data);
      fetchData();
    } catch (err: any) {
      setQuotaError(err.response?.data?.message || err.message || 'Gagal menambah kuota.');
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleApproveQuotaRequest = async (id: number) => {
    if (!confirm('Setujui permintaan tambah kuota santri ini? Kuota tenant akan langsung bertambah.')) return;
    try {
      setActionLoading(true);
      await api.put(`/quota-requests/${id}/approve`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyetujui permintaan kuota.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuotaRequest = async (id: number) => {
    const reason = prompt('Masukkan alasan penolakan (wajib diisi):', '');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }
    try {
      setActionLoading(true);
      await api.put(`/quota-requests/${id}/reject`, { reason });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menolak permintaan kuota.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingQuotaCount = quotaRequests.filter((r) => r.status === 'pending').length;
  const filteredQuotaRequests = quotaRequests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      safeString(r.tenant_name).toLowerCase().includes(q) ||
      safeString(r.tenant_subdomain).toLowerCase().includes(q) ||
      safeString(r.note).toLowerCase().includes(q);
    return matchSearch;
  });

  const formatExpiryDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
    } catch (e) {
      return iso;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppShell
          title="Manajemen Tenant & Mitra"
          subtitle="Persetujuan pendaftaran mandiri, aktivasi langganan, dan kelola seluruh institusi"
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {error && (
            <ErrorState
              title="Gagal memuat data tenant"
              description={error}
              onRetry={fetchData}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          )}

          {/* Quick Stats / Filter Tabs */}
          <TenantFilterTabs
            activeTab={activeTab}
            totalCount={totalTenants}
            pendingCount={pendingCount}
            quotaCount={pendingQuotaCount}
            activeCount={activeCount}
            suspendedCount={suspendedCount}
            onChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          />


          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama institusi, subdomain, atau nama admin..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={18} />
              <span>Daftarkan Tenant Manual</span>
            </button>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === 'quota_requests' ? (
                <QuotaRequestTable
                  items={filteredQuotaRequests}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onApprove={handleApproveQuotaRequest}
                  onReject={handleRejectQuotaRequest}
                />
              ) : (
              <>
              <TenantDirectoryTable
                tenants={tenants}
                currentPage={currentPage}
                pageSize={pageSize}
                loading={loading}
                search={search}
                impersonatingId={impersonatingId}
                onImpersonate={handleImpersonate}
                onOpenDetail={(tenant) => {
                  setSelectedTenant(tenant);
                  setApprovalMonths(tenant.duration_months || 1);
                  setIsDetailModalOpen(true);
                }}
                onReject={handleReject}
                onExtend={handleExtendSubscription}
                onQuota={openQuotaModal}
                onToggleStatus={handleToggleStatus}
              />

              </>
            )}
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalItems={activeTab === 'quota_requests' ? filteredQuotaRequests.length : pagination?.total || 0}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>

      {/* Modal Tambah Kuota Santri / Peserta */}
      {quotaTenant && (
        <div className="fixed inset-0 z-50 bg-slate-600/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-700">
                  Tambah Kuota {quotaTenant.member_label || 'Santri'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{quotaTenant.name}</p>
              </div>
              <button
                type="button"
                onClick={closeQuotaModal}
                aria-label="Tutup dialog kuota"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {quotaResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle2 size={16} />
                    <span>{quotaResult.message}</span>
                  </div>
                  <div className="text-xs text-emerald-700">
                    Tagihan tambahan per periode langganan:{' '}
                    <span className="font-bold">{formatCurrency(quotaResult.additional_price || 0)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Total tagihan paket sekarang: {formatCurrency(quotaResult.new_total_price || 0)}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeQuotaModal}
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {quotaError && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{quotaError}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-100">
                    <div className="text-[11px] text-slate-500">Terpakai</div>
                    <div className="text-lg font-bold text-slate-700">{quotaTenant.stats?.total_santri || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100">
                    <div className="text-[11px] text-slate-500">Kuota Saat Ini</div>
                    <div className="text-lg font-bold text-slate-700">{getTenantQuota(quotaTenant)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] text-emerald-700">Kuota Baru</div>
                    <div className="text-lg font-bold text-emerald-700">
                      {getTenantQuota(quotaTenant) + (Number(quotaAdd) || 0)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Jumlah {quotaTenant.member_label || 'Santri'} Tambahan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quotaAdd}
                    onChange={(e) => setQuotaAdd(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[5, 10, 25, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuotaAdd(n)}
                        className={`h-7 px-3 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                          Number(quotaAdd) === n
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Paket</span>
                    <span className="font-semibold text-slate-700 uppercase">{quotaTenant.plan_name || 'Standar'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimasi tagihan tambahan / periode</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(quotaExtraPrice)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeQuotaModal}
                    className="h-9 px-4 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuota}
                    disabled={quotaLoading || !Number(quotaAdd)}
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {quotaLoading ? 'Menyimpan...' : 'Tambah Kuota'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detail / Verifikasi Pendaftaran */}
      {isDetailModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verifikasi Pendaftaran Tenant</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tinjau bukti transfer manual via WhatsApp sebelum mengaktifkan akun
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                aria-label="Tutup detail tenant"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Lembaga:</span>
                  <span className="font-bold text-slate-800">{selectedTenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Lembaga:</span>
                  <span className="font-bold text-slate-800">
                    {selectedTenant.institution_type === 'non_pesantren' || selectedTenant.has_wali === false
                  ? 'Non-Pesantren (Mandiri / Tanpa Wali)'
                  : 'Pesantren / Sekolah (Dengan Wali Santri)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subdomain:</span>
                  <span className="font-mono font-bold text-emerald-700">{getTenantHost(selectedTenant.subdomain)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paket Dipilih:</span>
                  <span className="font-bold text-purple-700 uppercase">
                    {selectedTenant.plan_name || 'Standar'} ({selectedTenant.duration_months === 12 ? '1 Tahun' : selectedTenant.duration_months === 6 ? '6 Bulan' : '1 Bulan'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kapasitas Santri:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedTenant.requested_santri_count || selectedTenant.plan_max_santri || 10} Santri
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Pembayaran / Tagihan:</span>
                  <span className="font-black text-slate-900">
                    {formatCurrency(selectedTenant.total_price || selectedTenant.plan_price || 50000)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-700" />
                  <span>Kontak Penanggung Jawab / Admin:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama PIC:</span>
                  <span className="font-semibold text-slate-800">{selectedTenant.admin_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Email Login:</span>
                  <span className="font-semibold text-slate-800">{selectedTenant.admin_email || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">No. WhatsApp:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{selectedTenant.phone || selectedTenant.admin_phone || '-'}</span>
                    {(selectedTenant.phone || selectedTenant.admin_phone) && (
                      <a
                        href={`https://wa.me/${(selectedTenant.phone || selectedTenant.admin_phone).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <MessageCircle size={10} />
                        Buka WA
                      </a>
                    )}
                  </div>
                </div>
                {selectedTenant.payment_proof_note && (
                  <div className="pt-2 border-t border-emerald-200/60">
                    <span className="text-slate-500">Catatan Transfer dari Pendaftar:</span>
                    <p className="font-medium text-slate-800 mt-0.5 bg-white p-2 rounded-lg border border-emerald-100">
                      "{selectedTenant.payment_proof_note}"
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Masa Aktif Awal yang Diberikan:
                </label>
                <select
                  value={approvalMonths}
                  onChange={(e) => setApprovalMonths(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-semibold text-slate-800"
                >
                  <option value={1}>1 Bulan (Uji Coba / Standar Bulanan)</option>
                  <option value={3}>3 Bulan (Paket Kuartal)</option>
                  <option value={6}>6 Bulan (Paket Semester)</option>
                  <option value={12}>12 Bulan (1 Tahun Penuh)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleReject(selectedTenant.id)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Tolak Pendaftaran
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedTenant.id, approvalMonths)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>{actionLoading ? 'Memproses...' : 'Setujui & Aktifkan Lembaga'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Tenant Manual Super Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Daftarkan Tenant Mitra Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tambahkan pondok pesantren atau sekolah baru ke dalam platform SaaS
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup dialog tambah tenant"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Model Lembaga & Pendampingan Wali
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormInstitutionType('pesantren')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      formInstitutionType === 'pesantren'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Pesantren (Wali Aktif)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormInstitutionType('non_pesantren')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      formInstitutionType === 'non_pesantren'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Non-Pesantren (Mandiri)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Institusi / Lembaga / Komunitas
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formInstitutionType === 'non_pesantren'
                      ? 'Contoh: Komunitas Tahfidz Karyawan'
                      : 'Contoh: Pesantren Tahfidz Al-Hikmah'
                  }
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subdomain Impian
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="alhikmah"
                    value={formSubdomain}
                    onChange={(e) => setFormSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 border border-r-0 border-slate-300 rounded-l-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-mono"
                  />
                  <span className="bg-slate-100 border border-slate-300 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono">
                    .{BRAND.rootDomain}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilihan Paket Langganan
                </label>
                <select
                  value={formPlanId}
                  onChange={(e) => setFormPlanId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-medium"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({formatCurrency(pkg.price)}/bln · Kuota {pkg.max_santri} Santri)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Akun Administrator Lembaga (Default)
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ustadz Ahmad Fauzi"
                      value={formAdminName}
                      onChange={(e) => setFormAdminName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Email Login
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin@pesantren.sch.id"
                        value={formAdminEmail}
                        onChange={(e) => setFormAdminEmail(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        No. WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="081234567890"
                        value={formAdminPhone}
                        onChange={(e) => setFormAdminPhone(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kata Sandi Awal
                    </label>
                    <div className="relative">
                      <input
                        type={showFormAdminPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        value={formAdminPassword}
                        onChange={(e) => setFormAdminPassword(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormAdminPassword((prev) => !prev)}
                        aria-label={showFormAdminPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        {showFormAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Mendaftarkan...' : 'Daftarkan Tenant Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(statusConfirm)}
        onClose={() => {
          if (!actionLoading) setStatusConfirm(null);
        }}
        onConfirm={performToggleStatus}
        title={statusConfirm?.newStatus === 'suspended' ? 'Suspend tenant?' : 'Aktifkan tenant?'}
        description={
          statusConfirm?.newStatus === 'suspended'
            ? `Seluruh admin dan pengguna "${statusConfirm?.tenantName}" akan kehilangan akses sampai tenant diaktifkan kembali.`
            : `Aktifkan kembali akses tenant "${statusConfirm?.tenantName}"?`
        }
        confirmLabel={statusConfirm?.newStatus === 'suspended' ? 'Ya, suspend tenant' : 'Ya, aktifkan'}
        variant={statusConfirm?.newStatus === 'suspended' ? 'danger' : 'primary'}
        loading={actionLoading}
      />
    </AppShell>
  );
}
