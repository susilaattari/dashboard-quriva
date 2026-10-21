'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layouts/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import RequestQuotaModal from '@/components/RequestQuotaModal';
import api from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import ErrorState from '@/components/ui/ErrorState';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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
  Pencil,
  Mail,
  X,
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

export default function MasterSantriPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const isGuru = user?.role === 'guru';
  const isNonPesantren = user?.tenant?.institution_type === 'non_pesantren' || user?.tenant?.has_wali === false;
  const memberLabel = user?.tenant?.member_label || (isNonPesantren ? 'Peserta' : 'Santri');
  const [classes, setClasses] = useState<any[]>([]);
  const [walis, setWalis] = useState<any[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [referenceError, setReferenceError] = useState('');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: santris,
    pagination,
    error: listError,
    isLoading: listLoading,
    mutate: mutateSantris,
  } = usePaginatedList<any>('/santri', {
    page: currentPage,
    per_page: pageSize,
    search: debouncedSearch,
    class_id: filterClass || undefined,
  });
  const loading = referenceLoading || listLoading;
  const error = referenceError || (listError ? `Gagal memuat data ${memberLabel.toLowerCase()}. Periksa koneksi Anda lalu coba lagi.` : '');

  // Modal Tambah State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState('L');
  const [classId, setClassId] = useState('');
  const [waliId, setWaliId] = useState('');
  const [totalJuz, setTotalJuz] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Edit / Pindah Halaqah State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSantriId, setEditingSantriId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editNisn, setEditNisn] = useState('');
  const [editGender, setEditGender] = useState('L');
  const [editClassId, setEditClassId] = useState('');
  const [editWaliId, setEditWaliId] = useState('');
  const [editTotalJuz, setEditTotalJuz] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Mobile Account for Non-Pesantren Participant
  const [createAccount, setCreateAccount] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountPassword, setAccountPassword] = useState('');

  const fetchReferenceData = async () => {
    try {
      setReferenceLoading(true);
      setReferenceError('');
      const [classRes, waliRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=wali_santri'),
      ]);
      setClasses(classRes.data?.data || []);
      setWalis(waliRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load santri reference data:', err);
      setReferenceError(`Gagal memuat data pendukung ${memberLabel.toLowerCase()}. Periksa koneksi Anda lalu coba lagi.`);
    } finally {
      setReferenceLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchReferenceData(), mutateSantris()]);
  };

  useEffect(() => {
    if (pagination && pagination.total_pages < currentPage) {
      setCurrentPage(pagination.total_pages);
    }
  }, [pagination, currentPage]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (isNonPesantren && createAccount && accountPassword.length < 6) {
      setErrorMsg('Kata sandi akun peserta minimal 6 karakter.');
      return;
    }
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
      setAccountPassword('');
      showToast(`${memberLabel} berhasil ditambahkan.`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menambahkan santri');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (s: any) => {
    setEditingSantriId(s.id);
    setEditFullName(s.full_name || '');
    setEditNisn(s.nisn || '');
    setEditGender(s.gender || 'L');
    setEditClassId(s.class_id ? String(s.class_id) : '');
    setEditWaliId(s.wali_id ? String(s.wali_id) : '');
    setEditTotalJuz(s.total_juz_hafalan || 0);
    setEditErrorMsg('');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSantriId) return;
    setEditErrorMsg('');
    setEditSubmitting(true);

    try {
      await api.put(`/santri/${editingSantriId}`, {
        full_name: editFullName,
        nisn: editNisn || null,
        gender: editGender,
        class_id: editClassId ? Number(editClassId) : null,
        wali_id: editWaliId ? Number(editWaliId) : null,
        total_juz_hafalan: Number(editTotalJuz) || 0,
      });
      setIsEditModalOpen(false);
      showToast(`Data ${memberLabel.toLowerCase()} berhasil diperbarui.`);
      fetchData();
    } catch (err: any) {
      setEditErrorMsg(err.response?.data?.message || err.message || 'Gagal memperbarui data santri');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus santri ini dari sistem?')) return;
    try {
      await api.delete(`/santri/${id}`);
      showToast(`${memberLabel} berhasil dihapus.`);
      fetchData();
    } catch (err) {
      showToast(`Gagal menghapus data ${memberLabel.toLowerCase()}.`, 'error');
    }
  };

  return (
    <AppShell
          title={isGuru ? `Data ${memberLabel} Halaqah` : `Master Data ${memberLabel}`}
          subtitle={
            isGuru
              ? `Daftar ${memberLabel.toLowerCase()} bimbingan dan capaian progres hafalan Al-Quran`
              : isNonPesantren
              ? `Kelola database peserta didik mandiri (Mode Non-Pesantren: tanpa kewajiban akun wali)`
              : "Kelola database peserta didik, pemetaan halaqah, dan akun wali santri"
          }
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {error && (
            <ErrorState
              title="Gagal memuat data"
              description={error}
              onRetry={fetchData}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          )}

          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={`Cari nama ${memberLabel.toLowerCase()} atau NISN...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 shadow-sm"
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuotaModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  title="Ajukan penambahan kuota santri ke tim pusat"
                >
                  <Plus size={14} className="text-emerald-600" />
                  <span>Ajukan Kuota</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Tambah {memberLabel} Baru</span>
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-emerald-700 text-white text-xs uppercase font-semibold">
<tr>
<th className="px-4 py-3.5 w-14 text-center whitespace-nowrap">No</th>
<th className="px-4 py-3.5 whitespace-nowrap">Nama {memberLabel}</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">NISN / Gender</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Kelas / Halaqah</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">{isNonPesantren ? 'Tipe Peserta' : 'Wali Santri'}</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">Capaian Hafalan</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-right">{!isGuru ? 'Aksi' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-slate-700">
                  {santris.map((s, idx) => (
                    <tr key={s.id} className="group">
<td className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-100 group-hover:bg-emerald-100/70 transition-colors">
{(currentPage - 1) * pageSize + idx + 1}
</td>
                      <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-bold text-slate-700">{s.full_name}</div>
                            <div className="text-xs text-slate-400">ID: #{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                        <div className="text-xs text-slate-700 font-mono">
                          {s.nisn || 'Tanpa NISN'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                        <button
                          type="button"
                          onClick={() => !isGuru && handleOpenEditModal(s)}
                          disabled={isGuru}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            !isGuru
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:ring-1 hover:ring-emerald-300 cursor-pointer'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                          title={!isGuru ? 'Klik untuk memindahkan / ubah kelas halaqah' : undefined}
                        >
                          <School size={12} className={!isGuru ? 'text-emerald-600' : 'text-slate-500'} />
                          <span>{s.class_name || 'Belum Masuk Kelas'}</span>
                          {!isGuru && <Pencil size={11} className="text-emerald-600 ml-0.5 opacity-60" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                        {isNonPesantren ? (
                          <div>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700">
                              Peserta Mandiri
                            </span>
                            {s.wali_email && (
                              <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                <Mail size={12} /> {s.wali_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-700">{s.wali_name || '-'}</div>
                            <div className="text-slate-400">{s.wali_phone || s.wali_email || ''}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center bg-white group-hover:bg-emerald-50 transition-colors">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
                          <Award size={13} className="text-emerald-600" />
                          {s.total_juz_hafalan} Juz
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                        {!isGuru ? (
                          <div className="flex flex-nowrap items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(s)}
                              className="h-10 w-10 inline-flex items-center justify-center shrink-0 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title={`Ubah Kelas / Edit Data ${memberLabel}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="h-10 w-10 inline-flex items-center justify-center shrink-0 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title={`Hapus ${memberLabel}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            Aktif
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {santris.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                        Tidak ada {memberLabel.toLowerCase()} yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalItems={pagination?.total || 0}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>

      {/* Modal Tambah Santri */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Data Santri Baru</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup dialog"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.toLowerCase().includes('kuota') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsQuotaModalOpen(true);
                    }}
                    className="self-start text-[11px] font-bold text-emerald-800 bg-white border border-rose-200 px-2.5 py-1 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    Ajukan Tambah Kuota Sekarang →
                  </button>
                )}
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
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
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Kata Sandi Login Peserta <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          required={createAccount}
                          minLength={6}
                          autoComplete="new-password"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
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

      {/* Modal Edit / Ubah Kelas Halaqah */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ubah Kelas / Halaqah & Data {memberLabel}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: #{editingSantriId} • Perbarui halaqah bimbingan dan profil peserta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Tutup dialog edit"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {editErrorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Halaqah Picker - Highlighted */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold text-emerald-900 uppercase">
                  Pindah / Tetapkan Kelas & Halaqah <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full border border-emerald-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                >
                  <option value="">-- Tanpa Kelas (Belum Masuk Kelas) --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.guru_name ? `• Pembina: ${c.guru_name}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-700">
                  Pilih salah satu kelas/halaqah yang tersedia di lembaga ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap {memberLabel}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhwat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {isNonPesantren ? 'Tipe Peserta' : 'Wali Santri'}
                  </label>
                  {isNonPesantren ? (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                      Peserta Mandiri
                    </div>
                  ) : (
                    <select
                      value={editWaliId}
                      onChange={(e) => setEditWaliId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
                    >
                      <option value="">-- Pilih Wali Santri --</option>
                      {walis.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Total Capaian Juz
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={editTotalJuz}
                    onChange={(e) => setEditTotalJuz(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengajuan Kuota Santri Tenant */}
      <RequestQuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        onSuccess={fetchData}
      />
    </AppShell>
  );
}
