'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layouts/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import RequestQuotaModal from '@/components/RequestQuotaModal';
import api from '@/services/api';
import { getInitial } from '@/lib/format';
import { SkeletonCard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import {
  Users,
  GraduationCap,
  School,
  Award,
  Plus,
  BookOpen,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  FileCheck,
  Sparkles,
  Phone,
  MessageCircle,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const isGuru = user?.role === 'guru';
  const isNonPesantren = user?.tenant?.institution_type === 'non_pesantren' || user?.tenant?.has_wali === false;
  const memberLabel = user?.tenant?.member_label || (isNonPesantren ? 'Peserta' : 'Santri');
  const [santriList, setSantriList] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [portalData, setPortalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  useEffect(() => {
    fetchTenantData();
  }, [user]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      setError('');
      const sub = user?.tenant?.subdomain;
      const contentPromise = sub
        ? api.get(`/dashboard-content/public/${sub}`).catch(() => null)
        : api.get('/dashboard-content/public').catch(() => null);

      const [santriRes, guruRes, classRes, portalRes] = await Promise.all([
        api.get('/santri'),
        api.get('/users?role=guru'),
        api.get('/classes'),
        contentPromise,
      ]);
      setSantriList(santriRes.data?.data || []);
      setGuruList(guruRes.data?.data || []);
      setClassList(classRes.data?.data || []);
      if (portalRes?.data?.data) {
        setPortalData(portalRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load tenant dashboard data:', err);
      setError('Gagal memuat data dashboard. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const totalJuzAccumulated = santriList.reduce(
    (acc, s) => acc + (Number(s.total_juz_hafalan) || 0),
    0
  );

  return (
    <AppShell
          title={`Dashboard ${user?.tenant?.name || 'Pesantren'}`}
          subtitle={
            isGuru
              ? "Portal Pembimbing Halaqah & Mutaba'ah Hafalan Santri"
              : "Sistem Informasi Akademik & Monitoring Hafalan Al-Quran"
          }
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider font-bold bg-white/20 text-emerald-100 px-3 py-1 rounded-full mb-3 inline-block">
                {isGuru ? "Portal Dewan Asatidz / Pengajar" : "Portal Pengurus Institusi"}
              </span>
              <h2 className="text-2xl font-black">
                Ahlan wa Sahlan, {user?.name || (isGuru ? 'Ustadz' : 'Admin')}
              </h2>
              <p className="text-sm text-emerald-100/90 mt-1.5 max-w-xl">
                {isGuru
                  ? "Bimbing hafalan santri, catat setoran harian (Ziyadah & Muroja'ah), serta pantau modul tahsin halaqah Anda."
                  : "Pantau perkembangan halaqah, mutaba'ah hafalan santri, serta komunikasi dengan seluruh wali santri secara real-time."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
              {isGuru ? (
                <>
                  <Link
                    href="/hafalan/rekap"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-md hover:bg-emerald-50 transition-colors"
                  >
                    <FileCheck size={16} /> Input Setoran Hafalan
                  </Link>
                  <Link
                    href="/lms/materi"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    <BookOpen size={16} /> Modul LMS
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/master/santri"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-md hover:bg-emerald-50 transition-colors"
                  >
                    <Plus size={16} /> Tambah {memberLabel}
                  </Link>
                  <Link
                    href="/master/guru"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    <Users size={16} /> Kelola Guru
                  </Link>
                </>
              )}
            </div>
          </div>

          {error && (
            <ErrorState
              title="Dashboard gagal dimuat"
              description={error}
              onRetry={fetchTenantData}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              const currentQuota = Number(user?.tenant?.santri_quota || user?.package?.max_santri || 10);
              const isFull = santriList.length >= currentQuota;
              return (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total {memberLabel}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-black text-slate-700">
                      {santriList.length}{' '}
                      <span className="text-xs font-normal text-slate-400">/ {currentQuota} kuota</span>
                    </div>
                    {!isGuru && (
                      <button
                        type="button"
                        onClick={() => setIsQuotaModalOpen(true)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        + Kuota
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {isFull ? (
                      <span className="text-rose-600 font-semibold">Kuota penuh, ajukan tambahan</span>
                    ) : (
                      <span>Tersedia {Math.max(0, currentQuota - santriList.length)} slot {memberLabel.toLowerCase()} tersisa</span>
                    )}
                  </p>
                </div>
              );
            })()}

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Guru / Ustadz
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{guruList.length}</div>
              <p className="text-xs text-slate-500 mt-2">
                Pengampu halaqah & tahsin
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Halaqah / Rombel
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <School size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{classList.length}</div>
              <p className="text-xs text-slate-500 mt-2">
                Kelas bimbingan aktif
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Akumulasi Hafalan
                </span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Award size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {totalJuzAccumulated.toFixed(1)}{' '}
                <span className="text-sm font-semibold text-slate-400">Juz</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Total capaian hafalan {memberLabel.toLowerCase()}
              </p>
            </div>
          </div>
          )}

          {/* Superadmin Broadcast & Subscription Status Card (Clean Light White Theme) */}
          {portalData?.content && !isGuru && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 text-slate-800 shadow-sm border border-emerald-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>{portalData.content.announcement_badge || 'Pesan Resmi Dari Superadmin'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Paket Aktif:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {user?.package?.name || user?.tenant?.subscription_status || 'Standar'}
                  </span>
                  {user?.tenant?.days_remaining !== undefined && (
                    <span className="text-slate-500 font-medium">({user.tenant.days_remaining} Hari Tersisa)</span>
                  )}
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-700 italic font-serif leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                "{portalData.content.gratitude_message}"
              </blockquote>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">— {portalData.content.superadmin_name}</span>
                  {portalData.content.superadmin_office_hours && (
                    <span>• {portalData.content.superadmin_office_hours}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {user?.tenant?.subdomain && (
                    <Link
                      href={`/?subdomain=${user.tenant.subdomain}`}
                      target="_blank"
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <span>Lihat Halaman Root Subdomain</span>
                      <ExternalLink size={13} />
                    </Link>
                  )}

                  {portalData.content.superadmin_phone && (
                    <a
                      href={`https://wa.me/${portalData.content.superadmin_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Halo Admin Quriva, kami dari institusi ${user?.tenant?.name || ''} (Subdomain: ${user?.tenant?.subdomain || ''
                        }) ingin konsultasi paket langganan.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-brand hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageCircle size={14} />
                      <span>Chat Superadmin / Upgrade</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Classes & Santri Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Halaqah List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Daftar Halaqah Al-Quran</h3>
                  <p className="text-xs text-slate-500">Pemetaan kelompok santri & guru pembina</p>
                </div>
                <Link
                  href="/master/kelas"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Kelola Kelas →
                </Link>
              </div>

              <div className="space-y-4">
                {classList.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pembina: <span className="text-slate-700 font-medium">{c.guru_name || 'Belum ditugaskan'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700">
                        {c.total_santri || 0} {memberLabel}
                      </span>
                    </div>
                  </div>
                ))}
                {classList.length === 0 && !loading && (
                  <EmptyState
                    title="Belum ada halaqah"
                    description="Tambahkan kelas atau kelompok halaqah untuk mulai memetakan santri dan pembina."
                    className="py-6"
                  />
                )}
              </div>
            </div>

            {/* Santri Hafalan Top Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{memberLabel} Terdepan</h3>
                  <p className="text-xs text-slate-500">Capaian progres hafalan {memberLabel.toLowerCase()} tertinggi</p>
                </div>
                <Link
                  href="/master/santri"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Lihat Semua {memberLabel} →
                </Link>
              </div>

              <div className="space-y-4">
                {santriList.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {getInitial(s.full_name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{s.full_name}</h4>
                        <p className="text-xs text-slate-500">
                          {s.class_name || 'Tanpa Kelas'} • Wali: {s.wali_name || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-700">
                        {s.total_juz_hafalan} Juz
                      </div>
                      <span className="text-[10px] text-slate-400">Terselesaikan</span>
                    </div>
                  </div>
                ))}
                {santriList.length === 0 && !loading && (
                  <EmptyState
                    title={`Belum ada ${memberLabel.toLowerCase()}`}
                    description={`Data ${memberLabel.toLowerCase()} akan muncul di sini setelah ditambahkan.`}
                    className="py-6"
                  />
                )}
              </div>
            </div>
          </div>
        </main>

      {/* Modal Pengajuan Kuota Santri Tenant */}
      <RequestQuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        onSuccess={() => {
          // re-fetch dashboard
          window.location.reload();
        }}
      />
    </AppShell>
  );
}
