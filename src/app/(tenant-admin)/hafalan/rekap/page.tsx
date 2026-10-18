'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import api from '@/services/api';
import {
  FileCheck,
  Plus,
  Filter,
  Search,
  Calendar,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function RekapHafalanPage() {
  const [histories, setHistories] = useState<any[]>([]);
  const [santris, setSantris] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [santriFilter, setSantriFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [type, setType] = useState('ziyadah');
  const [juz, setJuz] = useState(30);
  const [surahNumber, setSurahNumber] = useState(78);
  const [surahName, setSurahName] = useState('An-Naba');
  const [verseStart, setVerseStart] = useState(1);
  const [verseEnd, setVerseEnd] = useState(10);
  const [grade, setGrade] = useState('Mumtaz');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, santriRes] = await Promise.all([
        api.get('/hafalan/histories'),
        api.get('/santri'),
      ]);
      setHistories(histRes.data?.data || []);
      setSantris(santriRes.data?.data || []);
      if (santriRes.data?.data?.length > 0) {
        setSelectedSantriId(santriRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load hafalan histories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/hafalan/record', {
        santri_id: Number(selectedSantriId),
        type,
        juz: Number(juz),
        surah_number: Number(surahNumber),
        surah_name: surahName,
        verse_start: Number(verseStart),
        verse_end: Number(verseEnd),
        grade,
        notes,
        date_recorded: new Date().toISOString().split('T')[0],
      });
      setIsModalOpen(false);
      setNotes('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menyimpan setoran hafalan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistories = histories.filter((h) => {
    const matchType = typeFilter ? h.type === typeFilter : true;
    const matchSantri = santriFilter ? String(h.santri_id) === santriFilter : true;
    return matchType && matchSantri;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Rekapitulasi Mutaba'ah Hafalan"
          subtitle="Monitoring setoran Ziyadah, ujian Tasmi', dan pengulangan Muroja'ah santri"
        />

        <main className="p-8 space-y-6 flex-1">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={santriFilter}
                onChange={(e) => setSantriFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">Semua Santri</option>
                {santris.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">Semua Jenis Setoran</option>
                <option value="ziyadah">Hafalan Baru (Ziyadah)</option>
                <option value="tasmi">Ujian Kelulusan (Tasmi&apos;)</option>
                <option value="murojaah">Pengulangan (Muroja&apos;ah)</option>
              </select>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Input Setoran Baru</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tanggal & Santri</th>
                    <th className="px-6 py-4">Jenis Setoran</th>
                    <th className="px-6 py-4">Surah & Ayat</th>
                    <th className="px-6 py-4">Nilai Mutaba&apos;ah</th>
                    <th className="px-6 py-4">Guru Penguji</th>
                    <th className="px-6 py-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredHistories.map((h) => {
                    const badgeColor =
                      h.type === 'ziyadah'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : h.type === 'tasmi'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    return (
                      <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{h.santri_name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} />
                            {new Date(h.date_recorded).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${badgeColor}`}
                          >
                            {h.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {h.surah_name}{' '}
                            <span className="text-xs font-normal text-slate-500 font-mono">
                              (Juz {h.juz})
                            </span>
                          </div>
                          <div className="text-xs text-emerald-700 font-semibold">
                            Ayat {h.verse_start} - {h.verse_end}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Award size={12} />
                            {h.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {h.guru_name || 'Ustadz Pembina'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                          {h.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistories.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        Belum ada riwayat setoran yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Input Setoran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Input Setoran Hafalan Santri</h3>
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

            <form onSubmit={handleRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih Santri
                </label>
                <select
                  required
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 bg-white"
                >
                  {santris.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.class_name || 'Tanpa Kelas'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Setoran
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    <option value="ziyadah">Ziyadah (Hafalan Baru)</option>
                    <option value="tasmi">Tasmi&apos; (Ujian Juz)</option>
                    <option value="murojaah">Muroja&apos;ah (Pengulangan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Juz Ke-
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={juz}
                    onChange={(e) => setJuz(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Surah
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="114"
                    required
                    value={surahNumber}
                    onChange={(e) => setSurahNumber(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Surah
                  </label>
                  <input
                    type="text"
                    required
                    value={surahName}
                    onChange={(e) => setSurahName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ayat Mulai
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={verseStart}
                    onChange={(e) => setVerseStart(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ayat Selesai
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={verseEnd}
                    onChange={(e) => setVerseEnd(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Predikat
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    <option value="Mumtaz">Mumtaz (Sempurna)</option>
                    <option value="Jayyid Jiddan">Jayyid Jiddan (Amat Baik)</option>
                    <option value="Jayyid">Jayyid (Baik)</option>
                    <option value="Maqbul">Maqbul (Cukup)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan Evaluasi / Tajwid
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan makhraj, panjang mad, atau kelancaran..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:border-emerald-500"
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
                  {submitting ? 'Menyimpan...' : 'Simpan Mutabaah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
