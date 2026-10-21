'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layouts/AppShell';
import Pagination from '@/components/ui/Pagination';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { BRAND, getTenantHost } from '@/config/brand';
import { safeString } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import PlatformDashboardHeader from '@/components/superadmin/PlatformDashboardHeader';
import PlatformKpiGrid from '@/components/superadmin/PlatformKpiGrid';
import PlatformOperationsPanels from '@/components/superadmin/PlatformOperationsPanels';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Check,
  X,
  Phone,
  ShieldAlert,
  Sliders,
  DollarSign,
  Activity,
  Zap,
} from 'lucide-react';

interface TenantStats {
  total_santri: number;
  total_guru: number;
  total_hafalan?: number;
}

interface TenantItem {
  id: number;
  name: string;
  subdomain: string;
  status: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  plan_id?: number;
  plan_name?: string;
  plan_code?: string;
  plan_price?: number;
  plan_max_santri?: number;
  plan_extra_price_per_user?: number;
  santri_quota?: number;
  plan_features?: any;
  subscription_expires_at?: string;
  days_remaining?: number | null;
  is_expiring_soon?: boolean;
  is_expired?: boolean;
  admin_name?: string;
  admin_email?: string;
  admin_phone?: string;
  phone?: string;
  institution_type?: 'pesantren' | 'non_pesantren';
  has_wali?: boolean;
  member_label?: string;
  expected_amount?: number;
  stats?: TenantStats;
  created_at: string;
}

interface PlatformMetrics {
  total_tenants: number;
  active_tenants: number;
  pending_tenants: number;
  suspended_tenants: number;
  expiring_soon_tenants: number;
  total_santri: number;
  total_guru: number;
  total_hafalan: number;
  total_tahsin: number;
  today_hafalan: number;
  mrr: number;
  arr: number;
}

interface RecentActivityItem {
  id: number;
  type: string;
  surah_name: string;
  verse_start: number;
  verse_end: number;
  grade: string;
  created_at: string;
  santri_name: string;
  tenant_name: string;
  tenant_subdomain: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { impersonateTenant } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    total_tenants: 0,
    active_tenants: 0,
    pending_tenants: 0,
    suspended_tenants: 0,
    expiring_soon_tenants: 0,
    total_santri: 0,
    total_guru: 0,
    total_hafalan: 0,
    total_tahsin: 0,
    today_hafalan: 0,
    mrr: 0,
    arr: 0,
  });
  const [expiringSoonList, setExpiringSoonList] = useState<TenantItem[]>([]);
  const [pendingList, setPendingList] = useState<TenantItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);

  // Filtering, Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'pending' | 'suspended'>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Impersonation state
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);

  // Extend Subscription Modal State
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedTenantToExtend, setSelectedTenantToExtend] = useState<TenantItem | null>(null);
  const [extendMonths, setExtendMonths] = useState<number>(1);
  const [extendNote, setExtendNote] = useState('');
  const [extending, setExtending] = useState(false);

  // Approve Tenant Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedTenantToApprove, setSelectedTenantToApprove] = useState<TenantItem | null>(null);
  const [approveMonths, setApproveMonths] = useState<number>(1);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, packageFilter]);

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const [summaryRes, packagesRes] = await Promise.allSettled([
        api.get('/tenants/platform-summary'),
        api.get('/packages'),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value.data?.success) {
        const data = summaryRes.value.data.data;
        setMetrics(data.metrics || metrics);
        setTenants(data.tenants || []);
        setExpiringSoonList(data.expiring_soon_list || []);
        setPendingList(data.pending_approval_list || []);
        setRecentActivities(data.recent_activity || []);
      } else {
        const fallbackRes = await api.get('/tenants');
        const list: TenantItem[] = fallbackRes.data?.data || [];
        computeLocalMetrics(list);
      }

      if (packagesRes.status === 'fulfilled' && packagesRes.value.data?.success) {
        setPackages(packagesRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load superadmin dashboard data:', err);
      setError('Gagal memuat ringkasan data platform. Periksa koneksi Anda lalu coba lagi.');
      showToast('Gagal memuat ringkasan data platform.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const computeLocalMetrics = (list: TenantItem[]) => {
    const pricedList = list.map((t) => {
      const basePrice = Number(t.plan_price) || 0;
      const baseCapacity = Number(t.plan_max_santri) || 10;
      const extraPrice = Number(t.plan_extra_price_per_user) || 0;
      const quota = Number(t.santri_quota || baseCapacity);
      const isPerUser = t.plan_features?.pricing_type === 'per_user';
      const expectedAmount = isPerUser
        ? quota * basePrice
        : basePrice + Math.max(0, quota - baseCapacity) * extraPrice;
      return { ...t, expected_amount: expectedAmount };
    });

    const totalSantri = pricedList.reduce((acc, t) => acc + (t.stats?.total_santri || 0), 0);
    const totalGuru = pricedList.reduce((acc, t) => acc + (t.stats?.total_guru || 0), 0);
    const active = pricedList.filter((t) => t.status === 'active');
    const pending = pricedList.filter((t) => t.status === 'pending_approval');
    const suspended = pricedList.filter((t) => t.status === 'suspended');
    const expiring = active.filter(
      (t) => t.is_expiring_soon || (t.days_remaining !== null && t.days_remaining !== undefined && t.days_remaining <= 7)
    );

    const mrr = active.reduce((acc, t) => acc + (Number(t.expected_amount) || 0), 0);

    setTenants(pricedList);
    setMetrics({
      total_tenants: list.length,
      active_tenants: active.length,
      pending_tenants: pending.length,
      suspended_tenants: suspended.length,
      expiring_soon_tenants: expiring.length,
      total_santri: totalSantri,
      total_guru: totalGuru,
      total_hafalan: 0,
      total_tahsin: 0,
      today_hafalan: 0,
      mrr,
      arr: mrr * 12,
    });
    setExpiringSoonList(expiring);
    setPendingList(pending);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardSummary();
  };

  const handleImpersonate = async (tenant: TenantItem) => {
    if (!confirm(`Apakah Anda yakin ingin masuk ke dashboard sebagai Administrator "${tenant.name}"?`)) {
      return;
    }

    try {
      setImpersonatingId(tenant.id);
      await impersonateTenant(tenant.id);
      showToast(`Berhasil masuk sebagai Admin ${tenant.name}. Mengalihkan...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      console.error('Impersonation error:', err);
      showToast(err.message || 'Gagal melakukan impersonasi institusi.', 'error');
      setImpersonatingId(null);
    }
  };

  const handleOpenExtendModal = (tenant: TenantItem) => {
    setSelectedTenantToExtend(tenant);
    setExtendMonths(1);
    setExtendNote('');
    setIsExtendModalOpen(true);
  };

  const handleSaveExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantToExtend) return;

    try {
      setExtending(true);
      await api.put(`/tenants/${selectedTenantToExtend.id}`, {
        extend_months: extendMonths,
        payment_proof_note: extendNote || `Perpanjangan ${extendMonths} bulan oleh Super Admin`,
      });

      showToast(`Masa aktif "${selectedTenantToExtend.name}" berhasil diperpanjang +${extendMonths} bulan!`);
      setIsExtendModalOpen(false);
      setSelectedTenantToExtend(null);
      fetchDashboardSummary();
    } catch (err: any) {
      console.error('Failed to extend subscription:', err);
      showToast(err.response?.data?.message || 'Gagal memperpanjang masa aktif.', 'error');
    } finally {
      setExtending(false);
    }
  };

  const handleOpenApproveModal = (tenant: TenantItem) => {
    setSelectedTenantToApprove(tenant);
    setApproveMonths(tenant.plan_features?.duration_months || 1);
    setIsApproveModalOpen(true);
  };

  const handleSaveApproveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantToApprove) return;

    try {
      setApproving(true);
      await api.put(`/tenants/${selectedTenantToApprove.id}/approve`, {
        extend_months: approveMonths,
      });

      showToast(`Institusi "${selectedTenantToApprove.name}" berhasil disetujui! Tombol "Masuk Portal" kini aktif.`);
      setIsApproveModalOpen(false);
      setSelectedTenantToApprove(null);
      fetchDashboardSummary();
    } catch (err: any) {
      console.error('Failed to approve tenant:', err);
      showToast(err.response?.data?.message || 'Gagal menyetujui institusi.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch (e) {
      return iso;
    }
  };

  const createWhatsAppBillingLink = (tenant: TenantItem) => {
    const phone = tenant.admin_phone || tenant.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const daysText =
      tenant.days_remaining !== null && tenant.days_remaining !== undefined
        ? tenant.days_remaining <= 0
          ? 'telah berakhir'
          : `tersisa ${tenant.days_remaining} hari lagi`
        : 'akan segera berakhir';

    const expiryFormatted = formatDate(tenant.subscription_expires_at);
    const amountFormatted = formatRupiah(tenant.expected_amount || tenant.plan_price || 0);

    const bank = BRAND.bank;
    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nKepada Yth. Pengurus/Admin *${tenant.name}*,\n\nKami dari Manajemen Pusat ${BRAND.name} menginformasikan bahwa masa aktif paket langganan (*${tenant.plan_name || 'Standard'}*) institusi Anda ${daysText} (Jatuh tempo: *${expiryFormatted}*).\n\n*Rincian Perpanjangan:*\n• Institusi: ${tenant.name} (${getTenantHost(tenant.subdomain)})\n• Paket: ${tenant.plan_name || 'Standard'}\n• Estimasi Tagihan: ${amountFormatted}\n\nPembayaran dapat ditransfer melalui:\n*${bank.bank}*\nNo. Rekening: *${bank.accountNumber}*\na.n. *${bank.accountName}*\n\nMohon konfirmasikan bukti transfer pada pesan ini setelah melakukan pembayaran. Jazakumullah Khairan Katsiran.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`;

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  };

  // Filtered tenants calculation
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        safeString(t.name).toLowerCase().includes(q) ||
        safeString(t.subdomain).toLowerCase().includes(q) ||
        safeString(t.admin_name).toLowerCase().includes(q) ||
        safeString(t.admin_phone).includes(q);

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter === 'active' && t.status !== 'active') return false;
      if (statusFilter === 'pending' && t.status !== 'pending_approval') return false;
      if (statusFilter === 'suspended' && t.status !== 'suspended') return false;
      if (statusFilter === 'expiring') {
        const isExp =
          t.status === 'active' &&
          (t.is_expiring_soon || (t.days_remaining !== null && t.days_remaining !== undefined && t.days_remaining <= 7));
        if (!isExp) return false;
      }

      // Package filter
      if (packageFilter !== 'all') {
        if (String(t.plan_id) !== packageFilter) return false;
      }

      return true;
    });
  }, [tenants, searchQuery, statusFilter, packageFilter]);

  // Paginated tenants
  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTenants.slice(startIndex, startIndex + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  return (
    <AppShell
          title="Super Admin Cockpit"
          subtitle="Pusat Kendali Ekosistem SaaS Tahfidz, Finansial & Monitoring Nasional"
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1 max-w-[1600px] w-full mx-auto">
          <PlatformDashboardHeader
            pendingList={pendingList}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOpenTenants={() => router.push('/superadmin/tenants')}
            onApproveFirst={handleOpenApproveModal}
            onShowPending={() => setStatusFilter('pending')}
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <ErrorState
              title="Dashboard gagal dimuat"
              description={error}
              onRetry={fetchDashboardSummary}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          ) : (
            <>
          <PlatformKpiGrid metrics={metrics} formatRupiah={formatRupiah} />

          <PlatformOperationsPanels
            expiringSoonList={expiringSoonList}
            recentActivities={recentActivities}
            loading={loading}
            onExtend={handleOpenExtendModal}
            getBillingUrl={createWhatsAppBillingLink}
          />

          {/* Full-Width Cockpit Table: All Tenants Management with Pagination */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            {/* Table Control Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-600" />
                  <span>Daftar Institusi Mitra & Status Berlangganan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kontrol lisensi, kapasitas kuota, dan impersonasi akun pengurus
                </p>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari institusi, subdomain, admin..."
                    className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Package Filter */}
                <select
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">Semua Paket</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={String(pkg.id)}>
                      Paket {pkg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({tenants.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Aktif ({metrics.active_tenants})
              </button>
              <button
                onClick={() => setStatusFilter('expiring')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'expiring'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                H-7 Jatuh Tempo ({metrics.expiring_soon_tenants})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Menunggu Approval ({metrics.pending_tenants})
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'suspended'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Suspended ({metrics.suspended_tenants})
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-emerald-700 text-white text-xs uppercase font-semibold">
<tr>
<th className="px-4 py-3.5 w-14 text-center whitespace-nowrap">No</th>
<th className="px-4 py-3.5 whitespace-nowrap">Institusi & Subdomain</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Paket & Biaya</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Masa Aktif & Status</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Santri & Kapasitas</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Kontak Admin</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-right">Aksi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-slate-700">
                  {paginatedTenants.map((t, idx) => {
                    const days = t.days_remaining;
                    const maxCap = t.santri_quota || t.plan_max_santri || 100;
                    const curSantri = t.stats?.total_santri || 0;
                    const capPercent = Math.min(100, Math.round((curSantri / maxCap) * 100));

                    return (
                      <tr key={t.id} className="group">
<td className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-100 group-hover:bg-emerald-100/70 transition-colors">
{(currentPage - 1) * pageSize + idx + 1}
</td>
                        {/* Institusi */}
                        <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                          <div className="font-bold text-slate-700 text-sm">{t.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {getTenantHost(t.subdomain)}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {t.institution_type === 'non_pesantren' ? 'Non-Pesantren' : 'Pesantren'}
                            </span>
                          </div>
                        </td>

                        {/* Paket & Biaya */}
                        <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-50 text-emerald-700 uppercase tracking-wide border border-emerald-200">
                              {t.plan_name || 'Standard'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 font-bold mt-1">
                            {formatRupiah(t.expected_amount || t.plan_price || 0)}
                            <span className="text-[10px] text-slate-500 font-normal"> /bln</span>
                          </div>
                        </td>

                        {/* Masa Aktif & Status */}
                        <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center gap-1.5">
                            {t.status === 'active' ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  days !== null && days !== undefined && days <= 7
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                <CheckCircle2 size={12} />
                                {days !== null && days !== undefined && days <= 7
                                  ? `Sisa ${days} Hari`
                                  : 'Aktif'}
                              </span>
                            ) : t.status === 'pending_approval' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                <Clock size={12} />
                                Menunggu Approval
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle size={12} />
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Tempo: {formatDate(t.subscription_expires_at)}
                          </p>
                        </td>

                        {/* Santri & Kapasitas */}
                        <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>
                              {curSantri} <span className="text-slate-400 font-normal">/ {maxCap} santri</span>
                            </span>
                            <span className="text-[11px] text-slate-500">{capPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                capPercent > 90
                                  ? 'bg-rose-500'
                                  : capPercent > 70
                                  ? 'bg-rose-400'
                                  : 'bg-emerald-600'
                              }`}
                              style={{ width: `${capPercent}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {t.stats?.total_guru || 0} Pengajar
                          </p>
                        </td>

                        {/* Kontak Admin */}
                        <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                          <div className="text-xs font-bold text-slate-700">{t.admin_name || 'Admin'}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {t.admin_phone || t.phone || '-'}
                          </div>
                          {(t.admin_phone || t.phone) && (
                            <a
                              href={`https://wa.me/${(t.admin_phone || t.phone || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 mt-1 font-semibold"
                            >
                              <MessageCircle size={11} />
                              <span>Hubungi via WA</span>
                            </a>
                          )}
                        </td>

                        {/* Aksi Super Admin */}
                        <td className="px-4 py-3 whitespace-nowrap text-right bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          <div className="flex flex-nowrap items-center justify-end gap-2">
                            {t.status === 'pending_approval' ? (
                              <button
                                onClick={() => handleOpenApproveModal(t)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
                                title="Setujui pendaftaran dan aktifkan institusi ini"
                              >
                                <Check size={14} />
                                <span>Setujui Lembaga</span>
                              </button>
                            ) : t.status === 'active' ? (
                              <button
                                onClick={() => handleImpersonate(t)}
                                disabled={impersonatingId === t.id}
                                title="Masuk ke portal sebagai Admin Institusi ini"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white border border-slate-500 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                              >
                                <Zap size={13} className={impersonatingId === t.id ? 'animate-spin' : ''} />
                                <span>{impersonatingId === t.id ? 'Memproses...' : 'Masuk Portal'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenExtendModal(t)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                <RefreshCw size={13} />
                                <span>Aktifkan / Perpanjang</span>
                              </button>
                            )}

                            {/* Quick Extend */}
                            {t.status === 'active' && (
                              <button
                                onClick={() => handleOpenExtendModal(t)}
                                title="Perpanjang Masa Aktif Langganan"
                                className="h-10 w-10 inline-flex items-center justify-center shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <Calendar size={14} />
                              </button>
                            )}

                            {/* Go to Details */}
                            <button
                              onClick={() => router.push(`/superadmin/tenants`)}
                              title="Detail & Pengaturan Tenant"
                              className="h-10 w-10 inline-flex items-center justify-center shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTenants.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada institusi yang cocok dengan kriteria pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTenants.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
            </>
          )}
        </main>

      {/* Modal Quick Approve Tenant (Light Theme) */}
      {isApproveModalOpen && selectedTenantToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in motion-reduce:animate-none duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Setujui Pendaftaran Lembaga</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedTenantToApprove.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApproveTenant} className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subdomain Portal:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {getTenantHost(selectedTenantToApprove.subdomain)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Paket Terpilih:</span>
                  <span className="font-bold text-purple-700 uppercase">
                    {selectedTenantToApprove.plan_name || 'Standard'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nama Admin / PIC:</span>
                  <span className="font-bold text-slate-800">
                    {selectedTenantToApprove.admin_name || '-'} ({selectedTenantToApprove.admin_phone || selectedTenantToApprove.phone || '-'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimasi Tagihan:</span>
                  <span className="font-bold text-teal-700">
                    {formatRupiah((selectedTenantToApprove.expected_amount || selectedTenantToApprove.plan_price || 0) * approveMonths)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Durasi Langganan Awal
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setApproveMonths(m)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        approveMonths === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m} Bulan
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" /> Apa yang terjadi saat disetujui?
                </p>
                <p className="text-[11px] text-emerald-700">
                  Status lembaga dan akun admin akan langsung aktif. Masa aktif dihitung {approveMonths} bulan dari sekarang. Tombol <strong>Masuk Portal</strong> akan langsung terbuka untuk Super Admin.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={approving}
                  className="px-5 py-2 bg-brand hover:opacity-90 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {approving ? 'Memproses Aktivasi...' : 'Konfirmasi & Setujui Lembaga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Extend Subscription (Light Theme) */}
      {isExtendModalOpen && selectedTenantToExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in motion-reduce:animate-none duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Perpanjang Masa Aktif</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedTenantToExtend.name}</p>
              </div>
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExtendSubscription} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Pilih Durasi Perpanjangan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setExtendMonths(m)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        extendMonths === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{m} Bulan
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Masa Aktif Saat Ini:</span>
                  <span className="font-bold text-slate-800">
                    {formatDate(selectedTenantToExtend.subscription_expires_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Estimasi Biaya:</span>
                  <span className="font-bold text-teal-700">
                    {formatRupiah((selectedTenantToExtend.expected_amount || selectedTenantToExtend.plan_price || 0) * extendMonths)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Catatan Pembayaran / Referensi Transfer
                </label>
                <input
                  type="text"
                  value={extendNote}
                  onChange={(e) => setExtendNote(e.target.value)}
                  placeholder="Contoh: Bukti transfer BSI per 20 Okt 2026 via Ustadz Fulan"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="px-5 py-2 bg-brand hover:opacity-90 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {extending ? 'Menyimpan...' : 'Konfirmasi & Perpanjang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
