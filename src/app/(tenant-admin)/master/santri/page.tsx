'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import {
  GraduationCap,
  Plus,
  Search,
  School,
  Trash2,
  Award,
  AlertCircle,
  Filter,
  Info,
  Smartphone,
} from 'lucide-react';

export default function MasterSantriPage() {
  const { user } = useAuthStore();
  const isGuru = user?.role === 'guru';
  const isNonPesantren = user?.tenant?.institution_type === 'non_pesantren' || user?.tenant?.has_wali === false;
  const memberLabel = user?.tenant?.member_label || (isNonPesantren ? 'Peserta' : 'Santri');
  const [santris, setSantris] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [walis, setWalis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState('L');
  const [classId, setClassId] = useState('');
  const [waliId, setWaliId] = useState('');
  const [totalJuz, setTotalJuz] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mobile Account for Non-Pesantren Participant
  const [createAccount, setCreateAccount] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountPassword, setAccountPassword] = useState('password123');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [santriRes, classRes, waliRes] = await Promise.all([
        api.get('/santri'),
        api.get('/classes'),
        api.get('/users?role=wali_santri'),
      ]);
      setSantris(santriRes.data?.data || []);
      setClasses(classRes.data?.data || []);
      setWalis(waliRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load santri data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/santri', {
        full_name: fullName,
        nisn: nisn || null,
        gender,
        class_id: classId ? Number(classId) : null,
        wali_id: waliId ? Number(waliId) : null,
        total_juz_hafalan: Number(totalJuz) || 0,
        create_account: isNonPesantren ? createAccount : false,
        email: isNonPesantren && createAccount ? accountEmail : null,
        phone: isNonPesantren && createAccount ? accountPhone : null,
        password: isNonPesantren && createAccount ? accountPassword : null,
      });
      setIsModalOpen(false);
      setFullName('');
      setNisn('');
      setClassId('');
      setWaliId('');
      setTotalJuz(0);
      setAccountEmail('');
      setAccountPhone('');
      setAccountPassword('password123');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menambahkan santri');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus santri ini dari sistem?')) return;
    try {
      await api.delete(`/santri/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus data santri');
    }
  };

  const filtered = santris.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nisn && s.nisn.includes(search));
    const matchClass = filterClass ? String(s.class_id) === filterClass : true;
    return matchSearch && matchClass;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={isGuru ? `Data ${memberLabel} Halaqah` : `Master Data ${memberLabel}`}
          subtitle={
            isGuru
              ? `Daftar ${memberLabel.toLowerCase()} bimbingan dan capaian progres hafalan Al-Quran`
              : isNonPesantren
              ? `Kelola database peserta didik mandiri (Mode Non-Pesantren: tanpa kewajiban akun wali)`
              : "Kelola database peserta didik, pemetaan halaqah, dan akun wali santri"
          }
        />

        <main className="p-8 space-y-6 flex-1">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={`Cari nama ${memberLabel.toLowerCase()} atau NISN...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-500 shadow-xs"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {!isGuru && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus size={18} />
                <span>Tambah {memberLabel} Baru</span>
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Nama {memberLabel}</th>
                    <th className="px-6 py-4">NISN / Gender</th>
                    <th className="px-6 py-4">Kelas / Halaqah</th>
                    <th className="px-6 py-4">{isNonPesantren ? 'Tipe Peserta' : 'Wali Santri'}</th>
                    <th className="px-6 py-4 text-center">Capaian Hafalan</th>
                    <th className="px-6 py-4 text-right">{!isGuru ? 'Aksi' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                            {s.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{s.full_name}</div>
                            <div className="text-xs text-slate-400">ID: #{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 font-mono">
                          {s.nisn || 'Tanpa NISN'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                          <School size={12} className="text-slate-500" />
                          {s.class_name || 'Belum Masuk Kelas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {isNonPesantren ? (
                          <div>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-700">
                              Peserta Mandiri
                            </span>
                            {s.wali_email && (
                              <div className="text-[11px] text-slate-500 font-mono mt-1">
                                ✉️ {s.wali_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-800">{s.wali_name || '-'}</div>
                            <div className="text-slate-400">{s.wali_phone || s.wali_email || ''}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
                          <Award size={13} className="text-emerald-600" />
                          {s.total_juz_hafalan} Juz
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isGuru ? (
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Santri"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            Aktif
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        Tidak ada santri yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tambah Santri */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Data Santri Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Santri
                </label>
                <input
                  type="text"
                  required
                  placeholder="Muhammad Rizky Al-Faruq"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="009812345"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhwat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Penugasan Kelas / Halaqah
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    <option value="">Pilih Halaqah</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {isNonPesantren ? 'Status Pendampingan' : 'Akun Wali Santri'}
                  </label>
                  {isNonPesantren ? (
                    <div className="p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl text-xs text-cyan-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-cyan-800">
                        <Info size={14} className="text-cyan-600" />
                        Mode Non-Pesantren (Belajar Mandiri)
                      </div>
                      <p className="text-[11px] text-cyan-700 leading-relaxed">
                        Peserta belajar mandiri tanpa pendampingan wali. Akun login mobile dapat langsung dibuatkan di bawah.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={waliId}
                        onChange={(e) => setWaliId(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 bg-white"
                      >
                        <option value="">Pilih Wali</option>
                        {walis.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <Link
                        href="/master/wali"
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium inline-block mt-1"
                      >
                        + Buat / Kelola Akun Wali Santri
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Akun Login Mobile Peserta Mandiri */}
              {isNonPesantren && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase">
                        Akun Login Mobile Peserta
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Aktifkan Akun</span>
                    </label>
                  </div>

                  {createAccount && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Email Login Peserta <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="peserta@email.com"
                            value={accountEmail}
                            onChange={(e) => setAccountEmail(e.target.value)}
                            required={createAccount}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            No. WhatsApp / HP
                          </label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={accountPhone}
                            onChange={(e) => setAccountPhone(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Kata Sandi Login (Default: password123)
                        </label>
                        <input
                          type="text"
                          placeholder="password123"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Peserta menggunakan email dan kata sandi ini untuk login di aplikasi mobile Quriva.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Total Juz Hafalan Saat Ini
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={totalJuz}
                  onChange={(e) => setTotalJuz(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
