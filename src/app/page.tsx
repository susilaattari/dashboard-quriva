'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { BRAND, getBankTransferInfo, getTenantHost } from '@/config/brand';
import { renderTemplate } from '@/lib/format';
import PublicQuranSection from '@/components/public/PublicQuranSection';
import PublicKajianSection from '@/components/public/PublicKajianSection';
import PublicUpgradeDialog from '@/components/public/PublicUpgradeDialog';
import {
  BookOpen,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Video,
  Award,
  Users,
  Building,
  ArrowRight,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Check,
  GraduationCap,
  Calendar,
  Share2,
  Phone,
  Mail,
  Clock,
  Layers,
  Zap,
  Star,
  Flame,
  LayoutDashboard,
  CheckCircle,
} from 'lucide-react';

interface FreeMaterial {
  id: number;
  title: string;
  speaker: string;
  category: string;
  duration: string;
  youtubeId: string;
  description: string;
}

const FREE_MATERIALS: FreeMaterial[] = [
  {
    id: 1,
    title: 'Metode Cepat & Kokoh Menghafal Al-Qur\'an 30 Juz',
    speaker: 'Ustadz Adi Hidayat, Lc., M.A.',
    category: 'Metode Tahfidz',
    duration: '28 Menit',
    youtubeId: 'k1_5dO5Fh6k',
    description: 'Panduan langkah demi langkah membagi hafalan baru (ziyadah) dan menjaga hafalan lama (murojaah) dengan mutqin.',
  },
  {
    id: 2,
    title: 'Panduan Tajwid: Makharijul Huruf & Sifatul Huruf Lengkap',
    speaker: 'Syaikh Ayman Suwaid / Ustadz Muhammad',
    category: 'Tahsin & Tajwid',
    duration: '35 Menit',
    youtubeId: 'q-f7V1Xp0t8',
    description: 'Praktik pengucapan huruf hijaiyah dari makhraj aslinya dan kekeliruan umum (lahn jali & khafi) yang sering terjadi.',
  },
  {
    id: 3,
    title: 'Adab dan Keutamaan Penghafal Al-Qur\'an',
    speaker: 'Ustadz Abdul Somad, Lc., M.A.',
    category: 'Adab Qurani',
    duration: '22 Menit',
    youtubeId: 'W_mQZ4m3aG4',
    description: 'Pentingnya menjaga niat ikhlas, adab kepada guru tahfidz, dan akhlak ahlul quran dalam kehidupan sehari-hari.',
  },
  {
    id: 4,
    title: 'Tadabbur Surah Al-Mulk: Pelindung dari Siksa Kubur',
    speaker: 'Ustadz Hanan Attaki, Lc.',
    category: 'Tafsir & Tadabbur',
    duration: '19 Menit',
    youtubeId: '7Q3Z8r2Dq9I',
    description: 'Renungan makna mendalam Surah Al-Mulk ayat demi ayat yang dianjurkan dibaca setiap malam sebelum tidur.',
  },
];

interface PortalContent {
  id?: number;
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
  is_custom_override?: boolean;
}

interface TenantInfo {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  institution_type?: string;
  member_label?: string;
  has_wali?: boolean;
  theme_config?: any;
  subscription_expires_at?: string;
  days_remaining?: number;
  is_expiring_soon?: boolean;
  is_expired?: boolean;
  subscription_status?: string;
  current_plan?: {
    id: number;
    name: string;
    code: string;
    price: number;
    max_santri: number;
    features?: any;
  };
  stats?: {
    total_santri: number;
    total_guru: number;
  };
}

export default function HomePage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  // Subdomain & Portal state
  const [currentSubdomain, setCurrentSubdomain] = useState<string>('');
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [content, setContent] = useState<PortalContent>({
    welcome_title: 'Ahlan wa Sahlan, Selamat Datang di Portal Quriva',
    welcome_subtitle: 'Platform Resmi Monitoring & Manajemen Hafalan Al-Qur\'an Terpadu',
    gratitude_message: 'Jazakumullah Khairan Katsiran kepada segenap Pengurus, Dewan Asatidz, Santri, dan seluruh Wali Santri yang telah mempercayakan pengelolaan tahfidz dan tahsin kepada kami.',
    announcement_badge: 'Pesan Resmi Manajemen Pusat Quriva',
    superadmin_name: 'Tim Kemitraan & Dukungan Superadmin Quriva',
    superadmin_phone: BRAND.supportWhatsApp,
    superadmin_email: BRAND.supportEmail,
    superadmin_office_hours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
    upgrade_title: 'Upgrade Paket & Maksimalkan Kapasitas Institusi Anda',
    upgrade_description: 'Tingkatkan kuota santri tanpa batas, modul LMS video & meet, sistem penilaian cepat (tap), e-sertifikat tasmi digital berbarcode, serta pendampingan prioritas.',
    upgrade_whatsapp_template: 'Halo Tim Admin Quriva, kami dari institusi {tenant_name} (Subdomain: {subdomain}) berencana untuk konsultasi dan upgrade ke paket {package_name}. Mohon informasi aktivasi dan rekening pembayarannya. Terima kasih!',
    bank_transfer_info: getBankTransferInfo(),
    show_packages: true,
    show_contact: true,
    show_upgrade_cta: true,
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPortal, setLoadingPortal] = useState(true);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradePkg, setSelectedUpgradePkg] = useState<any>(null);

  // Navigation tab
  const [activeMainTab, setActiveMainTab] = useState<'beranda' | 'quran' | 'kajian' | 'paket'>('beranda');

  // Kajian Video state
  const [selectedVideo, setSelectedVideo] = useState<FreeMaterial | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // 1. Detect Subdomain on Mount
  useEffect(() => {
    loadFromStorage();

    if (typeof window !== 'undefined') {
      let sub = '';

      // Check URL query param first (e.g. ?subdomain=alhikmah) for testing/demo
      const urlParams = new URLSearchParams(window.location.search);
      const querySub = urlParams.get('subdomain');
      if (querySub) {
        sub = querySub.trim().toLowerCase();
      }

      // If not in query, check hostname
      if (!sub) {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname.endsWith('.localhost')) {
          sub = hostname.replace('.localhost', '');
        } else if (hostname.endsWith('.lvh.me')) {
          sub = hostname.replace('.lvh.me', '');
        } else {
          const parts = hostname.split('.');
          if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') {
            sub = parts[0];
          }
        }
      }

      // Filter out reserved words
      if (['www', 'api', 'admin', 'localhost', '127.0.0.1'].includes(sub)) {
        sub = '';
      }

      setCurrentSubdomain(sub);
      fetchPortalData(sub);
    }
  }, []);

  const fetchPortalData = async (sub: string) => {
    try {
      setLoadingPortal(true);
      const endpoint = sub ? `/dashboard-content/public/${sub}` : '/dashboard-content/public';
      const res = await api.get(endpoint);

      if (res.data?.data) {
        const { tenant: tData, content: cData, packages: pData } = res.data.data;
        if (tData) setTenant(tData);
        if (cData) setContent(cData);
        if (pData) setPackages(pData);
      }
    } catch (err) {
      console.warn('Failed to load portal content:', err);
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSwitchSubdomain = (targetSub: string) => {
    if (!targetSub) {
      window.location.href = window.location.pathname;
    } else {
      window.location.href = `${window.location.pathname}?subdomain=${targetSub}`;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Build WhatsApp upgrade URL
  const getWhatsAppUpgradeUrl = (pkg?: any) => {
    const phone = content.superadmin_phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;

    const tenantName = tenant ? tenant.name : 'Institusi Pengguna';
    const sub = tenant ? tenant.subdomain : (currentSubdomain || '-');
    const pkgName = pkg ? pkg.name : (selectedUpgradePkg ? selectedUpgradePkg.name : 'Paket Langganan');

    let template = content.upgrade_whatsapp_template ||
      'Halo Tim Superadmin , kami dari institusi {tenant_name} (Subdomain: {subdomain}) berencana untuk konsultasi dan upgrade ke paket {package_name}.';

    template = template
      .replace(/\{tenant_name\}/gi, tenantName)
      .replace(/\{subdomain\}/gi, sub)
      .replace(/\{package_name\}/gi, pkgName);

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`;
  };

  const handleOpenUpgradeModal = (pkg: any) => {
    setSelectedUpgradePkg(pkg);
    setIsUpgradeModalOpen(true);
  };

  const renderContent = (text: string) =>
    renderTemplate(text, {
      tenant_name: tenant?.name || BRAND.name,
      subdomain: tenant?.subdomain || currentSubdomain || 'portal',
      package_name: selectedUpgradePkg?.name || 'Paket Standar',
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner: Subdomain Indicator & Quick Demo Switcher */}
      <div className="bg-emerald-50 border-b border-emerald-100 text-xs px-4 py-2 text-emerald-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-emerald-900 font-medium">
              {tenant ? (
                <>
                  Portal Resmi: <strong className="text-emerald-950 font-bold">{tenant.name}</strong>
                  <span className="text-emerald-700/80 ml-1.5 font-mono text-[11px]">({getTenantHost(tenant.subdomain)})</span>
                </>
              ) : (
                <>
                  Portal Utama: <strong className="text-emerald-950 font-bold">Quriva</strong> — Sistem Informasi Manajemen Tahfidz Al-Qur'an
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {process.env.NODE_ENV !== 'production' && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-200/80 text-[11px] shadow-sm">
                <span className="text-slate-500">Pilih Subdomain:</span>
                <select
                  value={currentSubdomain}
                  onChange={(e) => handleSwitchSubdomain(e.target.value)}
                  className="bg-transparent text-emerald-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">-- Portal Pusat --</option>
                  <option value="alhikmah">Pesantren Al-Hikmah (alhikmah)</option>
                  <option value="darulquran">Rumah Tahfidz Darul Quran (darulquran)</option>
                  <option value="sahabatquran">Sahabat Quran (sahabatquran)</option>
                  <option value="albarokah">Al Barokah (albarokah)</option>
                </select>
              </div>
            )}

            {/* Direct Superadmin WhatsApp shortcut */}
            {content.superadmin_phone && (
              <a
                href={`https://wa.me/${content.superadmin_phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold transition-colors text-[11px]"
              >
                <MessageCircle size={14} className="text-emerald-600" />
                <span>CS Superadmin</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:h-20 lg:flex-nowrap lg:px-8 lg:py-0">
          {/* Logo & Brand */}
          <Link href={currentSubdomain ? `/?subdomain=${currentSubdomain}` : '/'} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-brand flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">
                  {tenant ? tenant.name : 'Quriva'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {tenant ? 'Portal Subdomain' : 'Portal Utama'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {tenant
                  ? (tenant.theme_config?.tagline || 'Sistem Informasi & Monitoring Hafalan Al-Qur\'an')
                  : 'Platform Manajemen & Monitoring Hafalan Al-Qur\'an'}
              </p>
            </div>
          </Link>

          {/* Quick Section Switcher */}
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100 p-1 text-xs font-semibold lg:order-none lg:w-auto">
            <button
              onClick={() => setActiveMainTab('beranda')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl transition-all cursor-pointer ${activeMainTab === 'beranda'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Building size={14} /> Beranda Portal
            </button>
            <button
              onClick={() => setActiveMainTab('paket')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl transition-all cursor-pointer ${activeMainTab === 'paket'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Layers size={14} /> Paket & Fitur
            </button>
            <button
              onClick={() => setActiveMainTab('quran')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl transition-all cursor-pointer ${activeMainTab === 'quran'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <BookOpen size={14} /> Al-Qur'an 30 Juz
            </button>
            <button
              onClick={() => setActiveMainTab('kajian')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl transition-all cursor-pointer ${activeMainTab === 'kajian'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Video size={14} /> Kajian Video
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={user.role === 'super_admin' ? '/superadmin/dashboard' : '/dashboard'}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
              >
                <LayoutDashboard size={16} />
                <span>Buka Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors shadow-sm"
                >
                  Masuk Akun
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Sparkles size={14} />
                  <span>Daftar Lembaga</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION: WELCOME & GRATITUDE FROM SUPERADMIN */}
      <section className="bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 border-b border-slate-200/80 pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Announcement Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
              <Sparkles size={14} className="text-emerald-600" />
              <span>{renderContent(content.announcement_badge)}</span>
            </div>
          </div>

          {/* Welcome Heading & Subtitle */}
          <div className="text-center max-w-4xl mx-auto space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              {renderContent(content.welcome_title)}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-3xl mx-auto">
              {renderContent(content.welcome_subtitle)}
            </p>
          </div>

          {/* GRATITUDE BOX: FROM SUPERADMIN TO CUSTOMER */}
          <div className="max-w-4xl mx-auto bg-white border border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-sm ring-1 ring-emerald-500/10 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                  <MessageCircle size={16} className="text-emerald-600" />
                  <span>Pesan Ucapan Terima Kasih Dari Manajemen Quriva</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Pesan Resmi Kemitraan Quriva
                </span>
              </div>

              <blockquote className="text-sm sm:text-base text-slate-800 leading-relaxed italic font-serif">
                "{renderContent(content.gratitude_message)}"
              </blockquote>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Tertanda: <strong>{content.superadmin_name}</strong></span>
                </div>

                {content.superadmin_office_hours && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock size={13} className="text-emerald-600" />
                    <span>Jam Layanan CS: {content.superadmin_office_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE SUBSCRIPTION STATUS BADGE FOR THIS TENANT (IF SUBDOMAIN) */}
          {tenant && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
                  <Award size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status Langganan Institusi:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tenant.subscription_status === 'active' ? 'Aktif' : tenant.subscription_status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {tenant.current_plan?.name || 'Paket Standar Tahfidz'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>
                      Masa Aktif: <strong className="text-emerald-700 font-bold">{tenant.days_remaining !== undefined ? `${tenant.days_remaining} Hari Tersisa` : 'Aktif'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Kapasitas Santri: <strong className="text-slate-800">{tenant.stats?.total_santri || 0}</strong> / {tenant.current_plan?.max_santri || 10} Terdaftar
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard size={15} />
                  <span>Akses Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    const nextPkg = packages.find((p) => p.id !== tenant.current_plan?.id) || packages[packages.length - 1];
                    handleOpenUpgradeModal(nextPkg);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap size={15} />
                  <span>Konsultasi / Upgrade Paket</span>
                </button>
              </div>
            </div>
          )}

          {/* QUICK HERO ACTIONS */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveMainTab('paket')}
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Award size={17} />
              <span>Lihat Informasi Paket & Fitur</span>
            </button>

            {content.superadmin_phone && (
              <a
                href={getWhatsAppUpgradeUrl()}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-300 hover:border-emerald-600 text-slate-800 hover:text-emerald-700 flex items-center gap-2 transition-all shadow-sm"
              >
                <Phone size={17} className="text-emerald-600" />
                <span>Hubungi Superadmin (WhatsApp)</span>
              </a>
            )}

            <button
              onClick={() => setActiveMainTab('quran')}
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <BookOpen size={17} />
              <span>Mushaf 30 Juz (Gratis)</span>
            </button>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* SECTION 1: INFORMASI PAKET & FITUR LENGKAP YANG TERSEDIA */}
        {(activeMainTab === 'beranda' || activeMainTab === 'paket') && content.show_packages && (
          <section id="paket-section" className="space-y-8 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <Award size={14} className="text-emerald-600" />
                  <span>Pilihan Paket Langganan Lembaga & Institusi</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Informasi Paket yang Tersedia & Fitur-Fiturnya
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pilih paket yang paling sesuai dengan kebutuhan pondok pesantren, sekolah, rumah tahfidz, atau halaqah Anda.
                  Semua paket terintegrasi langsung dengan fitur mutaba'ah hafalan dan manajemen santri.
                </p>
              </div>

              {content.superadmin_phone && (
                <a
                  href={getWhatsAppUpgradeUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-emerald-600 text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
                >
                  <MessageCircle size={15} />
                  <span>Konsultasi Paket Khusus</span>
                </a>
              )}
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => {
                const isCurrent = tenant?.current_plan?.id === pkg.id;
                const features = pkg.features || {};
                const isAnnual = pkg.duration_months === 12;
                const is6Months = pkg.duration_months === 6;

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${isCurrent
                      ? 'bg-emerald-50/40 border-2 border-emerald-600 shadow-sm'
                      : isAnnual
                        ? 'bg-white border-2 border-emerald-500 shadow-sm'
                        : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-md'
                      }`}
                  >
                    {/* Top Ribbon */}
                    {isCurrent ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={12} /> Paket Anda Saat Ini
                      </div>
                    ) : isAnnual ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                        <Flame size={12} /> Paling Hemat (1 Tahun)
                      </div>
                    ) : is6Months ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                        Pilihan 6 Bulan
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {pkg.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {pkg.duration_months} Bulan
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mt-2 leading-tight">
                          {pkg.name}
                        </h3>
                      </div>

                      {/* Pricing */}
                      <div>
                        <div className="text-3xl font-black text-slate-900">
                          {formatCurrency(Number(pkg.price))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {pkg.duration_months === 12
                            ? 'per institusi / 1 tahun'
                            : pkg.duration_months === 6
                              ? 'per institusi / 6 bulan'
                              : 'per institusi / bulan'}
                        </p>
                      </div>

                      {/* Capacity Box */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Kapasitas Santri:</span>
                          <strong className="text-slate-900 font-bold">
                            {pkg.max_santri > 9999 || pkg.max_santri === 0 ? 'Tanpa Batas' : `${pkg.max_santri} Santri`}
                          </strong>
                        </div>
                        {pkg.extra_price_per_user > 0 && (
                          <div className="flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-200/80 text-[11px]">
                            <span>Santri Tambahan:</span>
                            <strong className="text-emerald-700 font-bold">
                              +{formatCurrency(pkg.extra_price_per_user)} / santri
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Feature Checklist */}
                      <div className="space-y-2.5 pt-2 text-xs border-t border-slate-100">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                          Fitur Unggulan Paket:
                        </div>

                        <div className="flex items-start gap-2">
                          <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium">Setoran Hafalan Ziyadah & Muroja'ah</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium">Penilaian Cepat Tap (Mutqin, Lancar, Kurang)</span>
                        </div>

                        <div className="flex items-start gap-2">
                          {features.tahsin_audio ? (
                            <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <X size={15} className="text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={features.tahsin_audio ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                            Voice Note Audio Tahsin & Koreksi Guru
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          {features.lms ? (
                            <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <X size={15} className="text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={features.lms ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                            Modul LMS Video & Live Google Meet
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          {features.certificates ? (
                            <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <X size={15} className="text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={features.certificates ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                            E-Sertifikat Tasmi per Juz (PDF Barcode)
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          {features.badges ? (
                            <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <X size={15} className="text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={features.badges ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                            Gamifikasi Bintang & Lencana Prestasi
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          {features.chat ? (
                            <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <X size={15} className="text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={features.chat ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                            Chat & Komunikasi Grup Halaqah
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={16} /> Sedang Aktif di Institusi Anda
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenUpgradeModal(pkg)}
                          className={`w-full py-3 px-4 rounded-xl text-center text-xs font-bold block transition-all shadow-sm cursor-pointer ${isAnnual
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                        >
                          Pilih & Upgrade ke Paket Ini →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: KONTAK RESMI SUPERADMIN KEPADA PELANGGAN */}
        {(activeMainTab === 'beranda' || activeMainTab === 'paket') && content.show_contact && (
          <section className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 space-y-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <Phone size={13} className="text-emerald-600" />
                  <span>Layanan Bantuan Resmi & Kemitraan Pusat</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Kontak Superadmin Kepada Pelanggan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Apakah Anda membutuhkan bantuan teknis konfigurasi santri, konsultasi kapasitas kuota, atau konfirmasi bukti transfer pembayaran? Hubungi tim Superadmin resmi kami secara langsung.
                </p>
              </div>

              {content.superadmin_phone && (
                <a
                  href={`https://wa.me/${content.superadmin_phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all shrink-0"
                >
                  <MessageCircle size={17} />
                  <span>Chat WhatsApp Superadmin</span>
                </a>
              )}
            </div>

            {/* Contact Detail Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Users size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tim Pengelola Pusat</div>
                <div className="font-bold text-sm text-slate-900">{content.superadmin_name}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Phone size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Narahubung WhatsApp</div>
                <div className="font-bold text-sm text-emerald-700 font-mono">+{content.superadmin_phone}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Mail size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Dukungan</div>
                <div className="font-bold text-sm text-slate-800">{content.superadmin_email}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Clock size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jam Operasional CS</div>
                <div className="font-bold text-sm text-slate-800">{content.superadmin_office_hours}</div>
              </div>
            </div>
          </section>
        )}

        <PublicQuranSection visible={activeMainTab === 'beranda' || activeMainTab === 'quran'} />

        <PublicKajianSection
          visible={activeMainTab === 'beranda' || activeMainTab === 'kajian'}
          materials={FREE_MATERIALS}
          onSelect={(material) => {
            setSelectedVideo(material);
            setIsVideoModalOpen(true);
          }}
        />

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{tenant ? tenant.name : 'Quriva'}</p>
              <p className="text-[11px] text-slate-400">
                {tenant ? `Subdomain: ${getTenantHost(tenant.subdomain)}` : 'Sistem Manajemen & Monitoring Hafalan Al-Qur\'an'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/login" className="hover:text-emerald-700 transition-colors font-medium">Masuk Akun</Link>
            <Link href="/register" className="hover:text-emerald-700 transition-colors font-medium">Daftar Lembaga Baru</Link>
            {content.superadmin_phone && (
              <a
                href={`https://wa.me/${content.superadmin_phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-700 transition-colors font-medium"
              >
                Kontak Superadmin
              </a>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            © 2026 Quriva. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </div>
      </footer>

      <PublicUpgradeDialog
        open={isUpgradeModalOpen}
        pkg={selectedUpgradePkg}
        tenant={tenant ? { name: tenant.name, subdomain: tenant.subdomain } : null}
        bankTransferInfo={content.bank_transfer_info}
        whatsappUrl={selectedUpgradePkg ? getWhatsAppUpgradeUrl(selectedUpgradePkg) : '#'}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* MODAL: VIDEO KAJIAN */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {selectedVideo.category}
                </span>
                <h3 className="font-bold text-base text-slate-900">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-500">{selectedVideo.speaker}</p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedVideo.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
