'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import {
  HeartHandshake,
  Plus,
  Search,
  Mail,
  Phone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';

export default function MasterWaliPage() {
  const { user } = useAuthStore();
  const [walis, setWalis] = useState<any[]>([]);
  const [santris, setSantris] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [waliRes, santriRes] = await Promise.all([
        api.get('/users?role=wali_santri'),
        api.get('/santri'),
      ]);
      setWalis(waliRes.data?.data || []);
      setSantris(santriRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load wali santri:', err);
    } finally {
      setLoading(false);
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
        role: 'wali_santri',
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menambahkan akun wali santri');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun wali santri ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus akun wali santri');
    }
  };

  // Find linked santri for each wali
  const getLinkedSantri = (waliId: number) => {
    return santris.filter((s) => s.wali_id === waliId);
  };

  const filtered = walis.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()) ||
      (w.phone && w.phone.includes(search))
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
                Sebagai Dewan Asatidz / Guru, Anda tidak memiliki izin untuk mengelola akun wali santri. Pengelolaan akun wali merupakan wewenang penuh Admin Institusi.
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
          title="Master Data Wali Santri"
          subtitle="Kelola akun orang tua/wali santri untuk akses Mobile App Monitoring & Tahsin"
        />

        <main className="p-8 space-y-6 flex-1">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama wali, email, no WhatsApp..."
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
              <span>Tambah Akun Wali Santri</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Nama Wali Santri</th>
                    <th className="px-6 py-4">Kontak (Email / No. HP)</th>
                    <th className="px-6 py-4">Santri Asuhan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((w) => {
                    const linked = getLinkedSantri(w.id);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
                              {w.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{w.name}</div>
                              <div className="text-xs text-slate-400">ID Akun: #{w.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                            <Mail size={13} className="text-slate-400" /> {w.email}
                          </div>
                          {w.phone && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone size={13} className="text-slate-400" /> {w.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {linked.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {linked.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 font-medium"
                                >
                                  <GraduationCap size={12} />
                                  {s.name || s.full_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ditautkan ke santri</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={12} />
                            {w.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Akun Wali"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Belum ada data akun wali santri.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tambah Wali Santri */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Akun Wali Santri</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
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
                  Nama Lengkap Orang Tua / Wali
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso (Ayah Fatih)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email (Untuk Login Mobile)
                </label>
                <input
                  type="email"
                  required
                  placeholder="wali.budi@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
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
                <p className="text-[11px] text-slate-400 mt-1">
                  Wali santri dapat menggunakan email dan kata sandi ini untuk login di aplikasi mobile.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Akun Wali'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
