'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layouts/AppShell';
import api from '@/services/api';
import { BRAND, getBankTransferInfo, getTenantHost } from '@/config/brand';
import {
  Sparkles,
  Save,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Layers,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Package,
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

interface PortalContent {
  id?: number;
  tenant_id?: number | null;
  welcome_title: string;
  welcome_subtitle: string;
  gratitude_message: string;
  announcement_badge: string;
  superadmin_name: string;
  superadmin_phone: string;
  superadmin_email: string;
  superadmin_office_hours: string;
  upgrade_title: string;
  upgrade_description: string;
  upgrade_whatsapp_template: string;
  bank_transfer_info: string;
  show_packages: boolean;
  show_contact: boolean;
  show_upgrade_cta: boolean;
  updated_at?: string;
  tenant_name?: string;
  tenant_subdomain?: string;
}

interface TenantItem {
  id: number;
  name: string;
  subdomain: string;
  status: string;
}

export default function SuperAdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<'global' | 'tenants' | 'preview'>('global');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Global settings form
  const [globalContent, setGlobalContent] = useState<PortalContent>({
    welcome_title: 'Ahlan wa Sahlan, Selamat Datang di Portal {tenant_name}',
    welcome_subtitle: 'Platform Resmi Monitoring & Manajemen Hafalan Al-Qur\'an Terpadu',
    gratitude_message: 'Jazakumullah Khairan Katsiran kepada segenap Pengurus, Dewan Asatidz, Santri, dan seluruh Wali Santri yang telah mempercayakan pengelolaan tahfidz dan tahsin kepada kami. Semoga setiap lantunan ayat suci Al-Qur\'an yang disetorkan menjadi amal jariyah yang terus mengalir.',
    announcement_badge: 'Pesan Resmi Manajemen Pusat Quriva',
    superadmin_name: 'Tim Kemitraan & Dukungan Superadmin Quriva',
    superadmin_phone: BRAND.supportWhatsApp,
    superadmin_email: BRAND.supportEmail,
    superadmin_office_hours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
    upgrade_title: 'Upgrade Paket & Maksimalkan Kapasitas Institusi Anda',
    upgrade_description: 'Tingkatkan kuota santri tanpa batas, aktifkan modul LMS video & meet, sistem penilaian cepat (tap), e-sertifikat tasmi digital berbarcode, serta pendampingan teknis prioritas dari tim pusat.',
    upgrade_whatsapp_template: 'Halo Tim Admin Quriva, kami dari institusi {tenant_name} (Subdomain: {subdomain}) berencana untuk konsultasi dan upgrade ke paket {package_name}. Mohon informasi aktivasi dan rekening pembayarannya. Terima kasih!',
    bank_transfer_info: getBankTransferInfo(),
    show_packages: true,
    show_contact: true,
    show_upgrade_cta: true,
  });

  // Tenant overrides & tenant list
  const [overrides, setOverrides] = useState<PortalContent[]>([]);
  const [overridePage, setOverridePage] = useState(1);
  const overridePageSize = 8;
  const [tenants, setTenants] = useState<TenantItem[]>([]);

  // Tenant override modal state
  const [selectedTenantId, setSelectedTenantId] = useState<number | ''>('');
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantModalForm, setTenantModalForm] = useState<PortalContent>({ ...globalContent });

  // Preview selection
  const [previewSubdomain, setPreviewSubdomain] = useState<string>('');

  useEffect(() => {
    fetchAdminContent();
  }, []);

  const fetchAdminContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard-content');
      if (res.data?.data) {
        const { global, overrides: ovs, all_tenants } = res.data.data;
        if (global) setGlobalContent(global);
        if (ovs) setOverrides(ovs);
        if (all_tenants) {
          setTenants(all_tenants);
          if (all_tenants.length > 0 && !previewSubdomain) {
            setPreviewSubdomain(all_tenants[0].subdomain);
          }
        }
      }
    } catch (err: any) {
      setErrorToast(err.response?.data?.message || 'Gagal memuat pengaturan konten portal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorToast('');
    setSuccessToast('');

    try {
      const res = await api.put('/dashboard-content', globalContent);
      setSuccessToast('Konten global portal berhasil disimpan dan langsung aktif di semua subdomain tenant!');
      if (res.data?.data) {
        setGlobalContent(res.data.data);
      }
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setErrorToast(err.response?.data?.message || 'Gagal menyimpan konten portal.');
      setTimeout(() => setErrorToast(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTenantModal = (tenantItem?: TenantItem, existingOverride?: PortalContent) => {
    if (existingOverride) {
      setSelectedTenantId(existingOverride.tenant_id as number);
      setTenantModalForm({ ...existingOverride });
    } else if (tenantItem) {
      setSelectedTenantId(tenantItem.id);
      setTenantModalForm({
        ...globalContent,
        tenant_id: tenantItem.id,
        welcome_title: `Ahlan wa Sahlan, Selamat Datang di Portal ${tenantItem.name}`,
      });
    } else {
      setSelectedTenantId('');
      setTenantModalForm({ ...globalContent });
    }
    setIsTenantModalOpen(true);
  };

  const handleSaveTenantOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      alert('Pilih institusi tenant terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/dashboard-content/tenant/${selectedTenantId}`, tenantModalForm);
      setIsTenantModalOpen(false);
      setSuccessToast('Kustomisasi konten khusus tenant berhasil disimpan.');
      fetchAdminContent();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan konten khusus tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenantOverride = async (tenantId: number, name: string) => {
    if (!confirm(`Hapus kustomisasi konten untuk "${name}"? Institusi ini akan kembali menggunakan konten global.`)) {
      return;
    }

    try {
      await api.delete(`/dashboard-content/tenant/${tenantId}`);
      setSuccessToast(`Kustomisasi untuk ${name} dihapus. Menggunakan konten global.`);
      fetchAdminContent();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kustomisasi tenant.');
    }
  };

  const previewContent = useMemo(() => {
    const override = overrides.find(
      (item: any) => item.tenant_subdomain === previewSubdomain || String(item.tenant_id) === String(selectedTenantId)
    );
    return override ? { ...globalContent, ...override } : globalContent;
  }, [globalContent, overrides, previewSubdomain, selectedTenantId]);

  // Helper for live preview token replacement
  const getPreviewText = (text: string) => {
    const selected = tenants.find((t) => t.subdomain === previewSubdomain);
    const tenantName = selected ? selected.name : 'Pesantren Tahfidz Al-Hikmah';
    const sub = previewSubdomain || 'alhikmah';

    return (text || '')
      .replace(/\{tenant_name\}/gi, tenantName)
      .replace(/\{subdomain\}/gi, sub)
      .replace(/\{package_name\}/gi, 'Paket Grup 1 Tahun');
  };

  return (
    <AppShell
          title="Kelola Konten Portal Root & Kontak"
          subtitle="Atur ucapan terima kasih & selamat datang, informasi paket & fitur, kontak Superadmin, serta prosedur upgrade untuk halaman root subdomain."
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl">
          {/* Toast Notification */}
          {successToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-sm animate-fadeIn">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {errorToast && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <span className="font-semibold">{errorToast}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('global')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'global'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                <Sliders size={16} /> Konten Utama (Global Default)
              </button>

              <button
                onClick={() => setActiveTab('tenants')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'tenants'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                <Building size={16} /> Kustom Khusus Per-Tenant ({overrides.length})
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                <Eye size={16} /> Live Preview Halaman Root
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Sparkles size={14} className="text-emerald-600" />
              <span>Gunakan placeholder: <code className="text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">{`{tenant_name}`}</code> dan <code className="text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">{`{subdomain}`}</code></span>
            </div>
          </div>

          {/* TAB 1: GLOBAL CONTENT FORM */}
          {activeTab === 'global' && (
            <form onSubmit={handleSaveGlobal} className="space-y-6">
              {/* Section 1: Ucapan Selamat Datang & Header */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">1. Header & Ucapan Selamat Datang</h3>
                    <p className="text-xs text-slate-500">
                      Teks pembuka di banner hero halaman root saat institusi / santri mengakses subdomain mereka.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Badge / Label Resmi Header
                    </label>
                    <input
                      type="text"
                      value={globalContent.announcement_badge}
                      onChange={(e) => setGlobalContent({ ...globalContent, announcement_badge: e.target.value })}
                      placeholder="Pesan Resmi Manajemen Pusat Quriva"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Ditampilkan di atas judul utama dengan aksen pill badge.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Judul Selamat Datang
                    </label>
                    <input
                      type="text"
                      value={globalContent.welcome_title}
                      onChange={(e) => setGlobalContent({ ...globalContent, welcome_title: e.target.value })}
                      placeholder="Ahlan wa Sahlan, Selamat Datang di Portal {tenant_name}"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{`{tenant_name}`} akan otomatis berubah jadi nama institusi.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Subjudul / Tagline Portal
                    </label>
                    <input
                      type="text"
                      value={globalContent.welcome_subtitle}
                      onChange={(e) => setGlobalContent({ ...globalContent, welcome_subtitle: e.target.value })}
                      placeholder="Platform Resmi Monitoring & Manajemen Hafalan Al-Qur'an Terpadu"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Ucapan Terima Kasih Dari Superadmin kepada Pelanggan */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">2. Ucapan Terima Kasih Dari Superadmin Kepada Pelanggan</h3>
                    <p className="text-xs text-slate-500">
                      Pesan penghargaan dan apresiasi tulus dari manajemen Superadmin kepada institusi pelanggan.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Pesan Ucapan Terima Kasih & Doa (Gratitude Note)
                  </label>
                  <textarea
                    rows={4}
                    value={globalContent.gratitude_message}
                    onChange={(e) => setGlobalContent({ ...globalContent, gratitude_message: e.target.value })}
                    placeholder="Tuliskan ucapan terima kasih yang menyentuh, doa keberkahan penghafal Al-Qur'an, dan komitmen layanan..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal leading-relaxed"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Pesan ini diletakkan dalam kartu eksklusif bernuansa islami di halaman muka subdomain setiap pelanggan.
                  </p>
                </div>
              </div>

              {/* Section 3: Kontak Resmi Superadmin */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">3. Kontak Resmi Superadmin</h3>
                    <p className="text-xs text-slate-500">
                      Informasi narahubung resmi agar pelanggan mudah berkonsultasi, meminta bantuan teknis, dan mengonfirmasi upgrade.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Nama Tim / PIC Superadmin
                    </label>
                    <input
                      type="text"
                      value={globalContent.superadmin_name}
                      onChange={(e) => setGlobalContent({ ...globalContent, superadmin_name: e.target.value })}
                      placeholder="Tim Kemitraan & Dukungan Superadmin Quriva"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Nomor WhatsApp Superadmin (Gunakan kode 62)
                    </label>
                    <input
                      type="text"
                      value={globalContent.superadmin_phone}
                      onChange={(e) => setGlobalContent({ ...globalContent, superadmin_phone: e.target.value })}
                      placeholder={BRAND.supportWhatsApp}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Format: 628xxxxxxxx (langsung membuka WhatsApp saat diklik).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Email Resmi Superadmin
                    </label>
                    <input
                      type="email"
                      value={globalContent.superadmin_email}
                      onChange={(e) => setGlobalContent({ ...globalContent, superadmin_email: e.target.value })}
                      placeholder={BRAND.supportEmail}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Jam Layanan Operasional
                    </label>
                    <input
                      type="text"
                      value={globalContent.superadmin_office_hours}
                      onChange={(e) => setGlobalContent({ ...globalContent, superadmin_office_hours: e.target.value })}
                      placeholder="Senin - Sabtu: 08:00 - 17:00 WIB"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Prosedur Upgrade & Informasi Paket */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">4. Penawaran Upgrade Paket & Rekening Transfer</h3>
                    <p className="text-xs text-slate-500">
                      Teks ajakan upgrade, template pesan WhatsApp otomatis, serta rekening pembayaran.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Judul Ajakan Upgrade
                    </label>
                    <input
                      type="text"
                      value={globalContent.upgrade_title}
                      onChange={(e) => setGlobalContent({ ...globalContent, upgrade_title: e.target.value })}
                      placeholder="Upgrade Paket & Maksimalkan Kapasitas Institusi Anda"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Template Pesan WhatsApp Otomatis
                    </label>
                    <input
                      type="text"
                      value={globalContent.upgrade_whatsapp_template}
                      onChange={(e) => setGlobalContent({ ...globalContent, upgrade_whatsapp_template: e.target.value })}
                      placeholder="Halo Tim Superadmin, kami dari {tenant_name} ingin upgrade..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Placeholder didukung: {`{tenant_name}`}, {`{subdomain}`}, {`{package_name}`}.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Deskripsi Keunggulan Upgrade
                    </label>
                    <textarea
                      rows={2}
                      value={globalContent.upgrade_description}
                      onChange={(e) => setGlobalContent({ ...globalContent, upgrade_description: e.target.value })}
                      placeholder="Jelaskan benefit kuota santri tak terbatas, e-sertifikat, LMS, dll..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Informasi Rekening Bank Pembayaran (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={globalContent.bank_transfer_info}
                      onChange={(e) => setGlobalContent({ ...globalContent, bank_transfer_info: e.target.value })}
                      placeholder={getBankTransferInfo()}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Pengaturan Tampilan & Sakelar Fitur */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">5. Sakelar Tampilan Komponen di Halaman Root</h3>
                    <p className="text-xs text-slate-500">
                      Tentukan modul apa saja yang diaktifkan pada halaman muka subdomain tenant.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={globalContent.show_packages}
                      onChange={(e) => setGlobalContent({ ...globalContent, show_packages: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-800 block">Tampilkan Daftar Paket</span>
                      <span className="text-xs text-slate-500">Menampilkan komparasi fitur paket & harga.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={globalContent.show_contact}
                      onChange={(e) => setGlobalContent({ ...globalContent, show_contact: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-800 block">Tampilkan Kontak Superadmin</span>
                      <span className="text-xs text-slate-500">Menampilkan kartu WhatsApp, email & jam CS.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={globalContent.show_upgrade_cta}
                      onChange={(e) => setGlobalContent({ ...globalContent, show_upgrade_cta: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-800 block">Tampilkan Tombol Upgrade</span>
                      <span className="text-xs text-slate-500">Mengaktifkan modal interaktif upgrade paket.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={fetchAdminContent}
                  disabled={loading || saving}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Reset Perubahan
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-brand text-white text-sm font-bold shadow-lg shadow-emerald-600/25 hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan Global'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TENANT SPECIFIC OVERRIDES */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Kustomisasi Khusus Per-Tenant</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Berikan ucapan terima kasih khusus, penawaran diskon perpanjangan khusus, atau narahubung spesifik untuk institusi tertentu. Institusi tanpa kustomisasi otomatis menggunakan pengaturan global.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenTenantModal()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} /> Tambah Kustomisasi Tenant
                </button>
              </div>

              {/* Overrides Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="bg-emerald-700 text-white text-xs uppercase font-semibold">
<tr>
<th className="px-4 py-3.5 w-14 text-center whitespace-nowrap">No</th>
<th className="px-4 py-3.5 whitespace-nowrap">Institusi / Subdomain</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Judul Selamat Datang</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Ucapan Terima Kasih</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Terakhir Diperbarui</th>
                        <th className="px-4 py-3.5 whitespace-nowrap text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 text-slate-700">
                      {overrides
                        .slice((overridePage - 1) * overridePageSize, overridePage * overridePageSize)
                        .map((ov, idx) => (
                          <tr key={ov.id} className="group">
<td className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-100 group-hover:bg-emerald-100/70 transition-colors">
{(overridePage - 1) * overridePageSize + idx + 1}
</td>
                            <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                              <div className="font-bold text-slate-700">{ov.tenant_name}</div>
                              <div className="text-xs font-mono text-emerald-600 mt-0.5">{ov.tenant_subdomain}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                              <span className="font-medium text-slate-700 text-xs line-clamp-1">
                                {ov.welcome_title}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                              <span className="text-xs text-slate-500 line-clamp-2 max-w-xs">
                                {ov.gratitude_message}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                              {ov.updated_at ? new Date(ov.updated_at).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right bg-white group-hover:bg-emerald-50 transition-colors">
                              <div className="flex flex-nowrap items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenTenantModal(undefined, ov)}
                                  className="h-10 w-10 inline-flex items-center justify-center shrink-0 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  title="Edit Kustomisasi"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTenantOverride(ov.tenant_id as number, ov.tenant_name || '')}
                                  className="h-10 w-10 inline-flex items-center justify-center shrink-0 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                                  title="Hapus (Kembali ke Global)"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                      {overrides.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                            Belum ada kustomisasi khusus per-tenant. Semua institusi saat ini menggunakan konfigurasi Global Default.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Component */}
                <Pagination
                  currentPage={overridePage}
                  totalItems={overrides.length}
                  pageSize={overridePageSize}
                  onPageChange={setOverridePage}
                />
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Preview Controls */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Simulasi Tampilan Subdomain Pelanggan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih institusi tenant untuk melihat bagaimana pesan ucapan terima kasih dan paket ditampilkan kepada mereka.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Tenant:</span>
                  <select
                    value={previewSubdomain}
                    onChange={(e) => setPreviewSubdomain(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Mode Tanpa Subdomain (Global Portal) --</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.subdomain}>
                        {t.name} ({t.subdomain})
                      </option>
                    ))}
                  </select>

                  <a
                    href={previewSubdomain ? `/?subdomain=${previewSubdomain}` : '/'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    Buka Halaman Asli <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Mockup Preview Window */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden shadow-lg">
                {/* Browser URL Bar Mockup */}
                <div className="bg-white px-6 py-3 border-b border-slate-200 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-xs font-mono text-emerald-800 flex items-center gap-2">
                    <span className="text-slate-400">https://</span>
                    <span>{getTenantHost(previewSubdomain)}/</span>
                  </div>
                </div>

                {/* Simulated Content */}
                <div className="p-8 sm:p-12 text-slate-900 space-y-8 max-w-5xl mx-auto">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Sparkles size={14} className="text-emerald-600" /> {previewContent.announcement_badge}
                  </div>

                  {/* Welcome Title & Subtitle */}
                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                      {getPreviewText(previewContent.welcome_title)}
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
                      {getPreviewText(previewContent.welcome_subtitle)}
                    </p>
                  </div>

                  {/* Gratitude Box */}
                  <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden ring-1 ring-emerald-500/10">
                    <div className="relative z-10 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                        <MessageSquare size={16} className="text-emerald-600" /> Ucapan Terima Kasih dari Superadmin
                      </span>
                      <p className="text-slate-800 text-sm leading-relaxed font-serif italic">
                        "{getPreviewText(previewContent.gratitude_message)}"
                      </p>
                      <div className="pt-2 text-xs text-slate-500 flex items-center gap-2 font-medium border-t border-slate-100">
                        <span>— {previewContent.superadmin_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Upgrade Cards Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Box */}
                    {previewContent.show_contact && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Phone size={16} className="text-emerald-600" /> Kontak Resmi Superadmin
                        </h4>
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">WhatsApp:</span>
                            <span className="font-mono text-emerald-700 font-bold">+{previewContent.superadmin_phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Email:</span>
                            <span className="text-slate-800">{previewContent.superadmin_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Jam Layanan:</span>
                            <span className="text-slate-800">{previewContent.superadmin_office_hours}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upgrade Box */}
                    {previewContent.show_upgrade_cta && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <CreditCard size={16} className="text-emerald-600" /> {getPreviewText(previewContent.upgrade_title)}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {getPreviewText(previewContent.upgrade_description)}
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                          >
                            Konsultasi / Upgrade Paket Sekarang →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal for Tenant Override */}
          {isTenantModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedTenantId ? 'Edit Kustomisasi Khusus Tenant' : 'Tambah Kustomisasi Khusus Tenant'}
                  </h3>
                  <button
                    onClick={() => setIsTenantModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSaveTenantOverride} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Pilih Institusi Tenant
                    </label>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedTenantId(id);
                        const sel = tenants.find((t) => t.id === id);
                        if (sel) {
                          setTenantModalForm((prev) => ({
                            ...prev,
                            tenant_id: id,
                            welcome_title: `Ahlan wa Sahlan, Selamat Datang di Portal ${sel.name}`,
                          }));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- Pilih Institusi --</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subdomain})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Judul Selamat Datang Khusus
                    </label>
                    <input
                      type="text"
                      value={tenantModalForm.welcome_title}
                      onChange={(e) => setTenantModalForm({ ...tenantModalForm, welcome_title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Ucapan Terima Kasih Khusus
                    </label>
                    <textarea
                      rows={4}
                      value={tenantModalForm.gratitude_message}
                      onChange={(e) => setTenantModalForm({ ...tenantModalForm, gratitude_message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Nomor WhatsApp Khusus Superadmin untuk Tenant Ini
                    </label>
                    <input
                      type="text"
                      value={tenantModalForm.superadmin_phone}
                      onChange={(e) => setTenantModalForm({ ...tenantModalForm, superadmin_phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsTenantModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Kustomisasi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
    </AppShell>
  );
}
