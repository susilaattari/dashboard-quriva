'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layouts/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { safeString } from '@/lib/format';
import ErrorState from '@/components/ui/ErrorState';
import { School, Plus, Search, Users, Trash2, AlertCircle, X } from 'lucide-react';

export default function MasterKelasPage() {
  const { user } = useAuthStore();
  const isGuru = user?.role === 'guru';
  const isNonPesantren = user?.tenant?.institution_type === 'non_pesantren' || user?.tenant?.has_wali === false;
  const memberLabel = user?.tenant?.member_label || (isNonPesantren ? 'Peserta' : 'Santri');
  const [classes, setClasses] = useState<any[]>([]);
  const [gurus, setGurus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [guruId, setGuruId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [classRes, guruRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=guru'),
      ]);
      setClasses(classRes.data?.data || []);
      setGurus(guruRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load class data:', err);
      setError('Gagal memuat data kelas. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/classes', {
        name,
        guru_id: guruId ? Number(guruId) : null,
        academic_year: academicYear,
      });
      setIsModalOpen(false);
      setName('');
      setGuruId('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menambahkan kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kelas halaqah ini?')) return;
    try {
      await api.delete(`/classes/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus kelas');
    }
  };

  const filtered = classes.filter((c) =>
    safeString(c.name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
          title={isGuru ? "Daftar Halaqah Belajar" : "Master Data Kelas / Halaqah"}
          subtitle={
            isGuru
              ? `Daftar kelompok halaqah belajar ${memberLabel.toLowerCase()} dan pembimbing`
              : "Kelola kelompok belajar hafalan dan penetapan ustadz pembina"
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama halaqah / kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
              />
            </div>

            {!isGuru && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus size={18} />
                <span>Tambah Halaqah Baru</span>
              </button>
            )}
          </div>

          {/* Grid of classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <School size={20} />
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                      {c.academic_year}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mb-1">{c.name}</h3>
                  <p className="text-xs text-slate-500">
                    Pembimbing:{' '}
                    <span className="font-semibold text-slate-800">
                      {c.guru_name || 'Belum ditentukan'}
                    </span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full">
                    <Users size={13} />
                    <span>{c.total_santri || 0} {memberLabel} Terdaftar</span>
                  </div>

                  {!isGuru && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus Kelas"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              Belum ada kelas halaqah yang ditambahkan.
            </div>
          )}
        </main>

      {/* Modal Tambah Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Kelas / Halaqah Baru</h3>
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
                  Nama Kelas / Halaqah
                </label>
                <input
                  type="text"
                  required
                  placeholder="Halaqah Ali bin Abi Thalib"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Guru Pembimbing / Asatidz
                </label>
                <select
                  value={guruId}
                  onChange={(e) => setGuruId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
                >
                  <option value="">Pilih Ustadz Pembimbing</option>
                  {gurus.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
