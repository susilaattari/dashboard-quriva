'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import api from '@/services/api';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ExternalLink,
  Shield,
  Palette,
  AlertCircle,
  Clock,
  MessageCircle,
  Check,
  X,
  CreditCard,
  UserCheck,
  Calendar,
  Phone,
} from 'lucide-react';

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending_approval' | 'active' | 'suspended'>('all');

  // Modal Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSubdomain, setFormSubdomain] = useState('');
  const [formPlanId, setFormPlanId] = useState(1);
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [formAdminPhone, setFormAdminPhone] = useState('');
  const [formAdminPassword, setFormAdminPassword] = useState('');
  const [formInstitutionType, setFormInstitutionType] = useState<'pesantren' | 'non_pesantren'>('pesantren');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal Review & Detail State
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [approvalMonths, setApprovalMonths] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, packagesRes] = await Promise.all([
        api.get('/tenants'),
        api.get('/packages'),
      ]);
      setTenants(tenantsRes.data?.data || []);
      setPackages(packagesRes.data?.data || []);
      if (packagesRes.data?.data?.length > 0) {
        setFormPlanId(packagesRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

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
    const reason = prompt('Masukkan alasan penolakan pendaftaran (opsional):', 'Bukti transfer tidak valid atau belum diterima.');
    if (reason === null) return;

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

  const handleToggleStatus = async (tenantId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/tenants/${tenantId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Gagal mengubah status tenant');
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

  const pendingCount = tenants.filter((t) => t.status === 'pending_approval').length;
  const activeCount = tenants.filter((t) => t.status === 'active').length;
  const suspendedCount = tenants.filter((t) => t.status === 'suspended' || t.status === 'rejected').length;

  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      (t.admin_name && t.admin_name.toLowerCase().includes(search.toLowerCase())) ||
      (t.phone && t.phone.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (activeTab === 'pending_approval') return t.status === 'pending_approval';
    if (activeTab === 'active') return t.status === 'active';
    if (activeTab === 'suspended') return t.status === 'suspended' || t.status === 'rejected';
    return true;
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Manajemen Tenant & Mitra"
          subtitle="Persetujuan pendaftaran mandiri, aktivasi langganan, dan kelola seluruh institusi"
        />

        <main className="p-8 space-y-6 flex-1">
          {/* Quick Stats / Filter Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs uppercase font-bold opacity-70">Semua Lembaga</div>
              <div className="text-2xl font-black mt-1">{tenants.length}</div>
            </button>

            <button
              onClick={() => setActiveTab('pending_approval')}
              className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                activeTab === 'pending_approval'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold opacity-80">Menunggu Persetujuan</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 animate-pulse">
                    {pendingCount} Baru
                  </span>
                )}
              </div>
              <div className="text-2xl font-black mt-1 text-amber-500 group-hover:text-amber-600">
                {pendingCount}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs uppercase font-bold opacity-70">Aktif Berlangganan</div>
              <div className="text-2xl font-black mt-1">{activeCount}</div>
            </button>

            <button
              onClick={() => setActiveTab('suspended')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'suspended'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs uppercase font-bold opacity-70">Ditangguhkan / Ditolak</div>
              <div className="text-2xl font-black mt-1">{suspendedCount}</div>
            </button>
          </div>

          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama institusi, subdomain, atau nama admin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Daftarkan Tenant Manual</span>
            </button>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Institusi Mitra</th>
                    <th className="px-6 py-4">Subdomain Akses</th>
                    <th className="px-6 py-4">Paket & Kontak</th>
                    <th className="px-6 py-4 text-center">Santri / Kuota</th>
                    <th className="px-6 py-4">Jatuh Tempo</th>
                    <th className="px-6 py-4">Status & Pembayaran</th>
                    <th className="px-6 py-4 text-right">Aksi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTenants.map((tenant) => {
                    const isPending = tenant.status === 'pending_approval';
                    const isRejected = tenant.status === 'rejected';

                    return (
                      <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-xs shrink-0 ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800'
                                  : isRejected
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{tenant.name}</span>
                                {tenant.institution_type === 'non_pesantren' || tenant.has_wali === false ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                                    👥 Non-Pesantren (Mandiri)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    🏛️ Pesantren (Wali)
                                  </span>
                                )}
                                {isPending && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Pendaftar Baru
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                ID: #{tenant.id} • PIC: {tenant.admin_name || 'Admin'}
                                {tenant.admin_phone && ` (${tenant.admin_phone})`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                            {tenant.subdomain}.tahfidzapp.com
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 uppercase">
                              {tenant.plan_name || 'Standar'}
                            </span>
                            {tenant.admin_phone && (
                              <a
                                href={`https://wa.me/${tenant.admin_phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                <MessageCircle size={12} />
                                <span>Chat WA Pendaftar</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-900">
                            {tenant.stats?.total_santri || 0}
                          </span>{' '}
                          <span className="text-xs text-slate-400">/ {tenant.plan_max_santri || 100}</span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {isPending ? 'Menunggu Aktivasi' : formatExpiryDate(tenant.subscription_expires_at)}
                          </div>
                          <div className="text-[11px] mt-0.5">
                            {isPending ? (
                              <span className="text-amber-600 font-semibold">⏳ Belum aktif</span>
                            ) : tenant.is_expired || tenant.status === 'suspended' ? (
                              <span className="text-rose-600 font-bold">⛔ Telah Berakhir</span>
                            ) : tenant.days_remaining !== null && tenant.days_remaining <= 7 ? (
                              <span className="text-amber-600 font-bold animate-pulse">
                                ⚠️ {tenant.days_remaining} hari lagi
                              </span>
                            ) : tenant.days_remaining !== null ? (
                              <span className="text-emerald-600 font-medium">
                                {tenant.days_remaining} hari lagi
                              </span>
                            ) : (
                              <span className="text-slate-400">Aktif</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isPending ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock size={12} />
                                Menunggu Approval
                              </span>
                              <div className="text-[11px] text-slate-500">
                                Transfer: <span className="font-semibold text-slate-700">Manual WA</span>
                              </div>
                            </div>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                              <XCircle size={12} />
                              Ditolak
                            </span>
                          ) : tenant.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                              <CheckCircle2 size={12} />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                              <XCircle size={12} />
                              Ditangguhkan
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setApprovalMonths(tenant.duration_months || 1);
                                  setIsDetailModalOpen(true);
                                }}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={14} />
                                <span>Verifikasi & Setujui</span>
                              </button>
                              <button
                                onClick={() => handleReject(tenant.id)}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Tolak Pendaftaran"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleExtendSubscription(tenant.id, 1)}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="Perpanjang langganan +1 Bulan"
                              >
                                +1 Bln
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(tenant.id, 12)}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                                title="Perpanjang langganan +1 Tahun"
                              >
                                +1 Thn
                              </button>
                              <button
                                onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  tenant.status === 'active'
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={tenant.status === 'active' ? 'Suspend Tenant' : 'Aktifkan Tenant'}
                              >
                                {tenant.status === 'active' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredTenants.length === 0 && !loading && (
                <div className="p-12 text-center">
                  <Shield size={48} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="text-base font-bold text-slate-700">Tidak ada tenant ditemukan</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {search ? 'Coba ubah kata kunci pencarian Anda' : 'Belum ada data tenant pada kategori ini.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Detail / Verifikasi Pendaftaran */}
      {isDetailModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verifikasi Pendaftaran Tenant</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tinjau bukti transfer manual via WhatsApp sebelum mengaktifkan akun
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                      ? '👥 Non-Pesantren (Mandiri / Tanpa Wali)'
                      : '🏛️ Pesantren / Sekolah (Dengan Wali Santri)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subdomain:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedTenant.subdomain}.tahfidzapp.com</span>
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 font-semibold text-slate-800"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Daftarkan Tenant Mitra Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tambahkan pondok pesantren atau sekolah baru ke dalam platform SaaS
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                    🏛️ Pesantren (Wali Aktif)
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
                    👥 Non-Pesantren (Mandiri)
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
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
                    className="flex-1 border border-r-0 border-slate-300 rounded-l-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                  <span className="bg-slate-100 border border-slate-300 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono">
                    .tahfidzapp.com
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 font-medium"
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
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-emerald-500"
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
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-emerald-500"
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
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kata Sandi Awal
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={formAdminPassword}
                      onChange={(e) => setFormAdminPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-emerald-500"
                    />
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
    </div>
  );
}
