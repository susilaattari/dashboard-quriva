'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layouts/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import {
  Palette,
  Sparkles,
  Check,
  Save,
  CheckCircle2,
  ShieldAlert,
  Building2,
  HeartHandshake,
  Users,
  Info,
  Sliders,
  GraduationCap,
} from 'lucide-react';

export default function SettingsThemePage() {
  const { user, refreshUser } = useAuthStore();
  const currentTheme = user?.tenant?.theme_config || {};

  // Active Settings Tab: 'model' (Pesantren vs Non-Pesantren) | 'theme' (Visual Branding)
  const [activeTab, setActiveTab] = useState<'model' | 'theme'>('model');

  // Model & Wali Settings state
  const [institutionType, setInstitutionType] = useState<'pesantren' | 'non_pesantren'>(
    user?.tenant?.institution_type || 'pesantren'
  );
  const [hasWali, setHasWali] = useState<boolean>(
    user?.tenant?.has_wali !== undefined ? Boolean(user.tenant.has_wali) : true
  );
  const [memberLabel, setMemberLabel] = useState<string>(
    user?.tenant?.member_label || (user?.tenant?.institution_type === 'non_pesantren' ? 'Peserta' : 'Santri')
  );

  // Theme Settings state
  const [primaryColor, setPrimaryColor] = useState(currentTheme.primaryColor || '#059669');
  const [institutionName, setInstitutionName] = useState(
    currentTheme.institutionName || user?.tenant?.name || ''
  );
  const [tagline, setTagline] = useState(
    currentTheme.tagline || 'Mencetak Generasi Qurani Berakhlaq Mulia'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.tenant) {
      if (user.tenant.institution_type) {
        setInstitutionType(user.tenant.institution_type);
      }
      if (user.tenant.has_wali !== undefined) {
        setHasWali(Boolean(user.tenant.has_wali));
      }
      if (user.tenant.member_label) {
        setMemberLabel(user.tenant.member_label);
      }
      if (user.tenant.theme_config) {
        const tc = user.tenant.theme_config;
        if (tc.primaryColor) setPrimaryColor(tc.primaryColor);
        if (tc.institutionName) setInstitutionName(tc.institutionName);
        if (tc.tagline) setTagline(tc.tagline);
      }
    }
  }, [user]);

  const predefinedColors = [
    { name: 'Emerald Green', hex: '#059669' },
    { name: 'Ocean Blue', hex: '#2563eb' },
    { name: 'Teal Cyan', hex: '#0d9488' },
    { name: 'Royal Indigo', hex: '#4f46e5' },
    { name: 'Amber Gold', hex: '#d97706' },
  ];

  // Save Model & Wali Settings
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      if (user?.tenant?.id) {
        await api.put(`/tenants/${user.tenant.id}/settings`, {
          institution_type: institutionType,
          has_wali: hasWali,
          member_label: memberLabel.trim() || (institutionType === 'non_pesantren' ? 'Peserta' : 'Santri'),
        });

        await refreshUser();
        setSuccessMessage('Pengaturan model lembaga dan pendampingan wali berhasil disimpan!');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan pengaturan model lembaga');
    } finally {
      setSaving(false);
    }
  };

  // Save Visual Theme
  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      if (user?.tenant?.id) {
        await api.put(`/tenants/${user.tenant.id}/theme`, {
          primaryColor,
          institutionName,
          tagline,
        });

        await refreshUser();
        setSuccessMessage('Tema dan identitas visual institusi berhasil disimpan!');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan tema');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === 'guru') {
    return (
      <AppShell
            title="Akses Dibatasi"
            subtitle="Halaman ini hanya dapat diakses oleh Administrator Institusi"
          >
          <main className="p-4 sm:p-6 lg:p-8 flex items-center justify-center flex-1">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Akses Khusus Admin Institusi</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Sebagai Dewan Asatidz / Guru, Anda tidak memiliki izin untuk mengkustomisasi pengaturan dan identitas institusi. Fitur ini hanya dapat diatur oleh Admin Institusi.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Kembali ke Beranda Asatidz
              </Link>
            </div>
          </main>
    </AppShell>
    );
  }

  return (
    <AppShell
          title="Pengaturan Institusi & Branding"
          subtitle="Atur model kelembagaan (Pesantren vs Non-Pesantren/Mandiri), pendampingan wali, dan identitas visual aplikasi"
        >

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6 flex-1">
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in motion-reduce:animate-none">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Settings Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('model')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'model'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 size={15} />
              <span>Model Lembaga & Pendampingan Wali</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'theme'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Palette size={15} />
              <span>Identitas Visual & Tema</span>
            </button>
          </div>

          {/* TAB 1: MODEL LEMBAGA & PENDAMPINGAN WALI */}
          {activeTab === 'model' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveModel} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Sliders size={20} className="text-emerald-600" />
                    <h3>Konfigurasi Model Kelembagaan</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Tentukan apakah sistem ini digunakan untuk <strong>Pondok Pesantren / Sekolah</strong> dengan pendampingan orang tua/wali santri,
                    atau untuk <strong>Non-Pesantren (Komunitas / Majelis Taklim / Halaqah Mandiri / Kursus)</strong> yang belajarnya mandiri tanpa wali santri.
                  </p>
                </div>

                {/* 2 Card Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Pesantren */}
                  <div
                    onClick={() => {
                      setInstitutionType('pesantren');
                      setHasWali(true);
                      if (memberLabel === 'Peserta' || memberLabel === 'Anggota') {
                        setMemberLabel('Santri');
                      }
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      institutionType === 'pesantren'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {institutionType === 'pesantren' && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-black text-emerald-800 mb-1.5">
                      <Building2 size={18} />
                      <span>Model Pesantren / Sekolah Islam</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sistem dirancang untuk santri yang didampingi oleh <strong>Orang Tua / Wali Santri</strong>.
                    </p>
                    <div className="mt-3 pt-3 border-t border-emerald-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <Check size={12} /> Menu & Data Wali Santri Aktif
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <Check size={12} /> Portal monitoring wali & WhatsApp report
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Non-Pesantren */}
                  <div
                    onClick={() => {
                      setInstitutionType('non_pesantren');
                      setHasWali(false);
                      if (memberLabel === 'Santri') {
                        setMemberLabel('Peserta');
                      }
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      institutionType === 'non_pesantren'
                        ? 'border-cyan-500 bg-cyan-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {institutionType === 'non_pesantren' && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-black text-cyan-800 mb-1.5">
                      <Users size={18} />
                      <span>Non-Pesantren (Komunitas / Mandiri)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Peserta <strong>belajar mandiri / dewasa</strong> tanpa pendampingan wali (Komunitas, Majelis, atau Kursus).
                    </p>
                    <div className="mt-3 pt-3 border-t border-cyan-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-700 font-semibold">
                        <Check size={12} /> Menu "Data Wali Santri" disembunyikan
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-700 font-semibold">
                        <Check size={12} /> Form pendaftaran santri tanpa kewajiban wali
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Penyesuaian Detail Mode
                  </h4>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">
                        Status Fitur & Menu Wali Santri
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Centang jika ingin menampilkan menu dan fitur wali santri di portal ini.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasWali}
                        onChange={(e) => setHasWali(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {hasWali ? 'Wali Santri Aktif' : 'Nonaktif (Tanpa Wali)'}
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">
                        Istilah Sebutan Peserta Didik
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sesuaikan nama label yang tampil di menu navigasi, formulir, dan tabel.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {['Santri', 'Peserta', 'Anggota'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMemberLabel(opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            memberLabel === opt
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Information Box */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Dampak Perubahan Mode:</span>
                    <p className="leading-relaxed text-amber-800 text-[11px]">
                      Jika Anda memilih <strong>Non-Pesantren</strong> dengan wali dinonaktifkan:
                      menu <em>Data Wali Santri</em> di navigasi sidebar akan disembunyikan otomatis,
                      kolom wali santri di tabel akan ditandai mandiri, dan form pendaftaran peserta tidak lagi mewajibkan akun wali santri.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Lembaga'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: IDENTITAS VISUAL & TEMA */}
          {activeTab === 'theme' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Settings */}
              <form onSubmit={handleSaveTheme} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Palette size={20} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">Identitas Visual</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Institusi Tampil
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Slogan / Visi Institusi
                  </label>
                  <textarea
                    rows={2}
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Warna Utama Tema Aplikasi
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    {predefinedColors.map((color) => (
                      <button
                        type="button"
                        key={color.hex}
                        onClick={() => setPrimaryColor(color.hex)}
                        style={{ backgroundColor: color.hex }}
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform cursor-pointer"
                        title={color.name}
                      >
                        {primaryColor === color.hex && <Check size={14} strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono text-xs uppercase border border-slate-300 rounded-lg px-3 py-2 w-32"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Tema'}</span>
                  </button>
                </div>
              </form>

              {/* Live Preview Card */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Pratinjau Tampilan Header Aplikasi
                </p>
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="p-6 rounded-3xl text-white shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold">
                      {institutionType === 'non_pesantren' ? <Users size={16} /> : <Building2 size={16} />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg leading-tight">
                        {institutionName || 'Nama Institusi'}
                      </h4>
                      <p className="text-xs opacity-80 mt-0.5">{tagline}</p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/15">
                    <div className="text-xs">
                      <span className="opacity-75 block">Model Lembaga</span>
                      <span className="font-bold">
                        {institutionType === 'non_pesantren' ? 'Non-Pesantren (Mandiri)' : 'Pesantren (Wali Santri)'}
                      </span>
                    </div>
                    <span className="bg-white text-slate-900 text-[11px] font-black uppercase px-3 py-1 rounded-full">
                      {memberLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
    </AppShell>
  );
}
