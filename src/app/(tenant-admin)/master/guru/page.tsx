'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layouts/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { formatStatus } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import ErrorState from '@/components/ui/ErrorState';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Users, Plus, Search, Mail, Phone, Trash2, Edit2, CheckCircle2, AlertCircle, ShieldAlert, BookOpen, Eye, EyeOff, X } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

export default function MasterGuruPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: gurus,
    pagination,
    error: listError,
    isLoading: loading,
    mutate: mutateGurus,
  } = usePaginatedList<any>('/users', {
    role: 'guru',
    page: currentPage,
    per_page: pageSize,
    search: debouncedSearch,
  });
  const error = listError ? 'Gagal memuat data guru. Periksa koneksi Anda lalu coba lagi.' : '';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canCreateLmsLocal, setCanCreateLmsLocal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchGurus = async () => {
    await mutateGurus();
  };

  useEffect(() => {
    if (pagination && pagination.total_pages < currentPage) {
      setCurrentPage(pagination.total_pages);
    }
  }, [pagination, currentPage]);

  const handleToggleLmsPermission = async (id: number, currentVal: boolean) => {
    try {
      const nextVal = !currentVal;
      await api.put(`/users/${id}`, {
        can_create_lms_local: nextVal,
      });
      await mutateGurus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah izin materi LMS guru.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/users', {
        name,
        email,
        phone,
        password,
        role: 'guru',
        can_create_lms_local: canCreateLmsLocal,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setCanCreateLmsLocal(false);
      showToast('Data guru berhasil ditambahkan.');
      fetchGurus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menambahkan data guru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengajar ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('Data guru berhasil dihapus.');
      fetchGurus();
    } catch (err) {
      showToast('Gagal menghapus data guru.', 'error');
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
                Sebagai Dewan Asatidz / Guru, Anda tidak memiliki izin untuk mengelola atau menambahkan akun dewan guru. Pengelolaan akun pengajar merupakan wewenang penuh Admin Institusi.
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
          title="Master Data Guru & Pengajar"
          subtitle="Kelola akun dewan asatidz dan pembimbing halaqah tahfidz"
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {error && (
            <ErrorState
              title="Gagal memuat data"
              description={error}
              onRetry={fetchGurus}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          )}

          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama guru atau email..."
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Tambah Guru Baru</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-emerald-700 text-white text-xs uppercase font-semibold">
<tr>
<th className="px-4 py-3.5 w-14 text-center whitespace-nowrap">No</th>
<th className="px-4 py-3.5 whitespace-nowrap">Nama Lengkap</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Kontak (Email / No. HP)</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">Izin Materi LMS Lokal</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-slate-700">
                  {gurus.map((g, idx) => (
                    <tr key={g.id} className="group">
<td className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-100 group-hover:bg-emerald-100/70 transition-colors">
{(currentPage - 1) * pageSize + idx + 1}
</td>
                      <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-bold text-slate-700">{g.name}</div>
                            <div className="text-xs text-slate-400">ID: #{g.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                        <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                          <Mail size={13} className="text-slate-400" /> {g.email}
                        </div>
                        {g.phone && (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone size={13} className="text-slate-400" /> {g.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center bg-white group-hover:bg-emerald-50 transition-colors">
                        <button
                          type="button"
                          onClick={() => handleToggleLmsPermission(g.id, Boolean(g.can_create_lms_local))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            g.can_create_lms_local
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                          title="Klik untuk mengaktifkan atau menonaktifkan hak akses guru membuat materi LMS"
                        >
                          <BookOpen size={13} className={g.can_create_lms_local ? 'text-emerald-600' : 'text-slate-400'} />
                          <span>{g.can_create_lms_local ? 'Diberi Izin (Bisa Buat)' : 'Terkunci (Hanya Baca)'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} />
                          {formatStatus(g.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right bg-white group-hover:bg-emerald-50 transition-colors">
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="h-10 w-10 inline-flex items-center justify-center shrink-0 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {gurus.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        Belum ada guru yang sesuai pencarian.
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

      {/* Modal Tambah Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Akun Guru Baru</h3>
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
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Guru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ustadz Abdullah, Lc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="abdullah@alhikmah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kata Sandi Awal
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 pr-12 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* LMS Permission Checkbox */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block cursor-pointer" htmlFor="canCreateLmsCheck">
                      Izin Materi LMS Lokal
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Beri hak akses untuk membuat & mengunggah materi LMS pondok
                    </p>
                  </div>
                </div>
                <input
                  id="canCreateLmsCheck"
                  type="checkbox"
                  checked={canCreateLmsLocal}
                  onChange={(e) => setCanCreateLmsLocal(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
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
                  {submitting ? 'Menyimpan...' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
