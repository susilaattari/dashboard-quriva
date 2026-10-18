'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
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
} from 'lucide-react';
import Link from 'next/link';

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const isGuru = user?.role === 'guru';
  const [santriList, setSantriList] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const [santriRes, guruRes, classRes] = await Promise.all([
        api.get('/santri'),
        api.get('/users?role=guru'),
        api.get('/classes'),
      ]);
      setSantriList(santriRes.data?.data || []);
      setGuruList(guruRes.data?.data || []);
      setClassList(classRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load tenant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalJuzAccumulated = santriList.reduce(
    (acc, s) => acc + (Number(s.total_juz_hafalan) || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={`Dashboard ${user?.tenant?.name || 'Pesantren'}`}
          subtitle={
            isGuru
              ? "Portal Pembimbing Halaqah & Mutaba'ah Hafalan Santri"
              : "Sistem Informasi Akademik & Monitoring Hafalan Al-Quran"
          }
        />

        <main className="p-8 space-y-8 flex-1">
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
                    <Plus size={16} /> Tambah Santri
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

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Santri
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{santriList.length}</div>
              <p className="text-xs text-slate-500 mt-2">
                Santri terdaftar aktif di sistem
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
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

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
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

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
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
                <TrendingUp size={14} /> Total capaian hafalan santri
              </p>
            </div>
          </div>

          {/* Classes & Santri Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Halaqah List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
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
                        {c.total_santri || 0} Santri
                      </span>
                    </div>
                  </div>
                ))}
                {classList.length === 0 && !loading && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Belum ada halaqah yang ditambahkan.
                  </p>
                )}
              </div>
            </div>

            {/* Santri Hafalan Top Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Santri Terdepan</h3>
                  <p className="text-xs text-slate-500">Capaian progres hafalan santri tertinggi</p>
                </div>
                <Link
                  href="/master/santri"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Lihat Semua Santri →
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
                        {s.full_name.charAt(0)}
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
                  <p className="text-xs text-slate-400 text-center py-6">
                    Belum ada data santri.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
