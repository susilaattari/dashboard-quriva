'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layouts/AppShell';
import api from '@/services/api';
import ErrorState from '@/components/ui/ErrorState';
import Dialog from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { QURAN_SURAHS } from '@/data/quranSurah';
import { useAuthStore } from '@/store/useAuthStore';
import { usePaginatedList } from '@/hooks/usePaginatedList';
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
import Pagination from '@/components/ui/Pagination';

export default function RekapHafalanPage() {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const isNonPesantren = user?.tenant?.institution_type === 'non_pesantren' || user?.tenant?.has_wali === false;
  const memberLabel = user?.tenant?.member_label || (isNonPesantren ? 'Peserta' : 'Santri');
  const today = new Date().toISOString().slice(0, 10);
  const [santris, setSantris] = useState<any[]>([]);
  const [santriLoading, setSantriLoading] = useState(true);
  const [santriError, setSantriError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [santriFilter, setSantriFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const {
    items: histories,
    pagination,
    error: listError,
    isLoading: listLoading,
    mutate: mutateHistories,
  } = usePaginatedList<any>('/hafalan/histories', {
    page: currentPage,
    per_page: pageSize,
    type: typeFilter || undefined,
    santri_id: santriFilter || undefined,
  });
  const loading = santriLoading || listLoading;
  const error = santriError || (listError ? 'Gagal memuat riwayat setoran. Periksa koneksi Anda lalu coba lagi.' : '');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [type, setType] = useState('ziyadah');
  const [juz, setJuz] = useState(30);
  const [surahNumber, setSurahNumber] = useState(78);
  const [verseStart, setVerseStart] = useState(1);
  const [verseEnd, setVerseEnd] = useState(10);
  const [grade, setGrade] = useState('Mumtaz');
  const [dateRecorded, setDateRecorded] = useState(today);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSantris = async () => {
    try {
      setSantriLoading(true);
      setSantriError('');
      const res = await api.get('/santri');
      setSantris(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setSelectedSantriId(res.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load hafalan reference data:', err);
      setSantriError('Gagal memuat daftar santri. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setSantriLoading(false);
    }
  };

  useEffect(() => {
    fetchSantris();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchSantris(), mutateHistories()]);
  };

  useEffect(() => {
    if (pagination && pagination.total_pages < currentPage) {
      setCurrentPage(pagination.total_pages);
    }
  }, [pagination, currentPage]);

  const selectedSurah = QURAN_SURAHS.find((surah) => surah.number === Number(surahNumber));

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSantriId) {
      setErrorMsg(`Pilih ${memberLabel.toLowerCase()} terlebih dahulu.`);
      return;
    }
    if (!selectedSurah) {
      setErrorMsg('Pilih surah yang valid.');
      return;
    }
    if (verseStart < 1 || verseEnd < verseStart) {
      setErrorMsg('Rentang ayat tidak valid. Ayat selesai harus lebih besar atau sama dengan ayat mulai.');
      return;
    }
    if (verseEnd > selectedSurah.numberOfAyahs) {
      setErrorMsg(`Surah ${selectedSurah.name} hanya memiliki ${selectedSurah.numberOfAyahs} ayat.`);
      return;
    }
    if (!dateRecorded) {
      setErrorMsg('Tanggal setoran wajib diisi.');
      return;
    }
    if (dateRecorded > today) {
      setErrorMsg('Tanggal setoran tidak boleh melebihi hari ini.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/hafalan/record', {
        santri_id: Number(selectedSantriId),
        type,
        juz: Number(juz),
        surah_number: selectedSurah.number,
        surah_name: selectedSurah.name,
        verse_start: Number(verseStart),
        verse_end: Number(verseEnd),
        grade,
        notes,
        date_recorded: dateRecorded,
      });
      setIsModalOpen(false);
      setNotes('');
      showToast('Setoran hafalan berhasil disimpan.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menyimpan setoran hafalan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
          title="Rekapitulasi Mutaba'ah Hafalan"
          subtitle={`Monitoring setoran Ziyadah, ujian Tasmi', dan pengulangan Muroja'ah ${memberLabel.toLowerCase()}`}
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
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={santriFilter}
                onChange={(e) => {
                  setSantriFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
              >
                <option value="">Semua {memberLabel}</option>
                {santris.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-emerald-700 text-white text-xs uppercase font-semibold">
<tr>
<th className="px-4 py-3.5 w-14 text-center whitespace-nowrap">No</th>
<th className="px-4 py-3.5 whitespace-nowrap">Tanggal & {memberLabel}</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Jenis Setoran</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Surah & Ayat</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Nilai Mutaba&apos;ah</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Guru Penguji</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-slate-700">
                  {histories.map((h, idx) => {
                    const badgeColor =
                      h.type === 'ziyadah'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : h.type === 'tasmi'
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    return (
                      <tr key={h.id} className="group">
<td className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-100 group-hover:bg-emerald-100/70 transition-colors">
{(currentPage - 1) * pageSize + idx + 1}
</td>
                        <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                          <div className="font-bold text-slate-700">{h.santri_name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} />
                            {new Date(h.date_recorded).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${badgeColor}`}
                          >
                            {h.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                          <div className="font-bold text-slate-700">
                            {h.surah_name}{' '}
                            <span className="text-xs font-normal text-slate-500 font-mono">
                              (Juz {h.juz})
                            </span>
                          </div>
                          <div className="text-xs text-emerald-700 font-semibold">
                            Ayat {h.verse_start} - {h.verse_end}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <Award size={12} />
                            {h.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700 bg-white group-hover:bg-emerald-50 transition-colors">
                          {h.guru_name || 'Ustadz Pembina'}
                        </td>
                        <td
                          title={h.notes || ''}
                          className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 max-w-xs truncate bg-slate-50 group-hover:bg-emerald-50 transition-colors"
                        >
                          {h.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {histories.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                        Belum ada riwayat setoran yang cocok.
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

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Input Setoran Hafalan ${memberLabel}`}
        description="Catat setoran ziyadah, tasmi, atau murojaah beserta tanggal dan rentang ayat."
        size="lg"
      >
            {errorMsg && (
              <div role="alert" className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRecord} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih {memberLabel}
                </label>
                <select
                  required
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="rekap-surah" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Surah
                  </label>
                  <select
                    id="rekap-surah"
                    required
                    value={surahNumber}
                    onChange={(e) => {
                      const nextNumber = Number(e.target.value);
                      const nextSurah = QURAN_SURAHS.find((surah) => surah.number === nextNumber);
                      setSurahNumber(nextNumber);
                      setJuz(nextSurah?.juz || juz);
                      setVerseStart(1);
                      setVerseEnd(Math.min(10, nextSurah?.numberOfAyahs || 10));
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
                  >
                    {QURAN_SURAHS.map((surah) => (
                      <option key={surah.number} value={surah.number}>
                        {surah.number}. {surah.name} ({surah.numberOfAyahs} ayat, Juz {surah.juz})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rekap-date" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tanggal Setoran
                  </label>
                  <input
                    id="rekap-date"
                    type="date"
                    required
                    max={today}
                    value={dateRecorded}
                    onChange={(e) => setDateRecorded(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
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
                    max={selectedSurah?.numberOfAyahs || 6236}
                    required
                    value={verseStart}
                    onChange={(e) => setVerseStart(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ayat Selesai
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedSurah?.numberOfAyahs || 6236}
                    required
                    value={verseEnd}
                    onChange={(e) => setVerseEnd(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Predikat
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white"
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
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
      </Dialog>
    </AppShell>
  );
}
