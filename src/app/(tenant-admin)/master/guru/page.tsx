'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { Users, Plus, Search, Mail, Phone, Trash2, Edit2, CheckCircle2, AlertCircle, ShieldAlert, BookOpen } from 'lucide-react';

export default function MasterGuruPage() {
  const { user } = useAuthStore();
  const [gurus, setGurus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [canCreateLmsLocal, setCanCreateLmsLocal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchGurus();
  }, []);

  const fetchGurus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=guru');
      setGurus(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load gurus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLmsPermission = async (id: number, currentVal: boolean) => {
    try {
      const nextVal = !currentVal;
      await api.put(`/users/${id}`, {
        can_create_lms_local: nextVal,
      });
      setGurus((prev) =>
        prev.map((g) => (g.id === id ? { ...g, can_create_lms_local: nextVal } : g))
      );
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
      fetchGurus();
    } catch (err) {
      alert('Gagal menghapus pengajar');
    }
  };

  const filtered = gurus.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role === 'guru') {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            title="Akses Dibatasi"
            subtitle="Halaman ini hanya dapat diakses oleh Administrator Institusi"
          />
          <main className="p-8 flex items-center justify-center flex-1">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Master Data Guru & Pengajar"
          subtitle="Kelola akun dewan asatidz dan pembimbing halaqah tahfidz"
        />

        <main className="p-8 space-y-6 flex-1">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama guru atau email..."
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
              <span>Tambah Guru Baru</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Kontak (Email / No. HP)</th>
                    <th className="px-6 py-4 text-center">Izin Materi LMS Lokal</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                            {g.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{g.name}</div>
                            <div className="text-xs text-slate-400">ID: #{g.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                          <Mail size={13} className="text-slate-400" /> {g.email}
                        </div>
                        {g.phone && (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone size={13} className="text-slate-400" /> {g.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleLmsPermission(g.id, Boolean(g.can_create_lms_local))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            g.can_create_lms_local
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                          title="Klik untuk mengaktifkan atau menonaktifkan hak akses guru membuat materi LMS"
                        >
                          <BookOpen size={13} className={g.can_create_lms_local ? 'text-emerald-600' : 'text-slate-400'} />
                          <span>{g.can_create_lms_local ? 'Diberi Izin (Bisa Buat)' : 'Terkunci (Hanya Baca)'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} />
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Belum ada guru yang sesuai pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tambah Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Akun Guru Baru</h3>
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
                  Nama Lengkap Guru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ustadz Abdullah, Lc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                />
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
    </div>
  );
}
