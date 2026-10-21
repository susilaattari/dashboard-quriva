'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Pause, Play, Search, X } from 'lucide-react';
import { QURAN_SURAHS, SurahData } from '@/data/quranSurah';

interface PublicQuranSectionProps {
  visible: boolean;
}

export default function PublicQuranSection({ visible }: PublicQuranSectionProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'juz30' | 'pilihan'>('all');
  const [selectedSurah, setSelectedSurah] = useState<SurahData | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ayahError, setAyahError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSurahs = useMemo(() => {
    return QURAN_SURAHS.filter((surah) => {
      const term = search.toLowerCase();
      const matchesSearch =
        surah.name.toLowerCase().includes(term) ||
        surah.translation.toLowerCase().includes(term) ||
        String(surah.number) === search.trim();
      if (!matchesSearch) return false;
      if (filter === 'juz30') return surah.juz === 30 || surah.number >= 78;
      if (filter === 'pilihan') return [1, 18, 36, 55, 56, 67].includes(surah.number);
      return true;
    });
  }, [search, filter]);

  useEffect(() => {
    if (!isReaderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeReader();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isReaderOpen]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const closeReader = () => {
    setIsReaderOpen(false);
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  };

  const loadSurah = async (surah: SurahData) => {
    setSelectedSurah(surah);
    setIsReaderOpen(true);
    setLoading(true);
    setAyahError('');
    setAyahs([]);
    setIsPlaying(false);
    audioRef.current?.pause();
    audioRef.current = null;

    try {
      const res = await fetch(`https://equran.id/api/v2/surat/${surah.number}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.data?.ayat || [];
        if (items.length === 0) throw new Error('empty');
        setAyahs(items);
        return;
      }

      const altRes = await fetch(
        `https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-uthmani,id.indonesian`
      );
      if (!altRes.ok) throw new Error('unavailable');
      const altData = await altRes.json();
      const arabic = altData.data?.[0]?.ayahs || [];
      const indonesian = altData.data?.[1]?.ayahs || [];
      const combined = arabic.map((ayah: any, index: number) => ({
        nomorAyat: ayah.numberInSurah,
        teksArab: ayah.text,
        teksLatin: '',
        teksIndonesia: indonesian[index]?.text || '',
      }));
      if (combined.length === 0) throw new Error('empty');
      setAyahs(combined);
    } catch {
      setAyahError('Ayat gagal dimuat. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!selectedSurah) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(
        `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.number}.mp3`
      );
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  if (!visible) return null;

  return (
    <>
      <section id="quran-section" className="scroll-mt-24 space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <BookOpen size={14} />
              <span>Mushaf Digital 30 Juz Gratis</span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Bacaan Al-Qur'an 114 Surah</h2>
            <p className="mt-1 text-xs text-slate-500">
              Disediakan gratis untuk seluruh santri, ustadz, dan kaum muslimin. Klik pada surah untuk membaca ayat lengkap
              dan mendengarkan murottal.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                aria-label="Cari surah"
                placeholder="Cari surah (misal: Yasin, Al-Mulk)..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs" role="group" aria-label="Filter surah">
              {[
                { key: 'all' as const, label: 'Semua (114)' },
                { key: 'juz30' as const, label: "Juz 'Amma" },
                { key: 'pilihan' as const, label: 'Surah Pilihan' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    filter === item.key ? 'bg-emerald-600 font-bold text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSurahs.map((surah) => (
            <button
              key={surah.number}
              type="button"
              onClick={() => loadSurah(surah)}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-xs font-bold text-slate-700 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-800">
                  {surah.number}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                    {surah.name}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {surah.translation} • {surah.numberOfAyahs} Ayat
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-arabic text-lg font-bold text-slate-800" dir="rtl" lang="ar">
                  {surah.arabic}
                </div>
                <span className="text-[10px] font-medium text-slate-500">
                  Juz {surah.juz} • {surah.revelation}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {isReaderOpen && selectedSurah && (
        <div role="dialog" aria-modal="true" aria-label={`Bacaan Surah ${selectedSurah.name}`} className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                {selectedSurah.number}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900">
                  {selectedSurah.name}{' '}
                  <span className="font-arabic" dir="rtl" lang="ar">
                    ({selectedSurah.arabic})
                  </span>
                </h3>
                <p className="truncate text-xs text-slate-500">
                  {selectedSurah.translation} • {selectedSurah.numberOfAyahs} Ayat
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleAudio}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:px-4"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">{isPlaying ? 'Jeda Audio' : 'Putar Murottal'}</span>
              </button>
              <button
                type="button"
                onClick={closeReader}
                aria-label="Tutup bacaan surah"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 overflow-y-auto p-4 sm:p-12">
            {loading ? (
              <div className="py-20 text-center text-sm text-slate-500" role="status">
                Memuat ayat suci Al-Qur'an...
              </div>
            ) : ayahError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
                <p className="text-sm font-semibold text-rose-800">{ayahError}</p>
                <button
                  type="button"
                  onClick={() => selectedSurah && loadSurah(selectedSurah)}
                  className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Coba lagi
                </button>
              </div>
            ) : (
              ayahs.map((ayah) => (
                <div key={ayah.nomorAyat} className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700">
                    {ayah.nomorAyat}
                  </span>
                  <div dir="rtl" lang="ar" className="font-arabic text-right text-2xl leading-loose text-slate-900 sm:text-3xl">
                    {ayah.teksArab}
                  </div>
                  {ayah.teksLatin && (
                    <div dir="ltr" lang="id" className="font-mono text-xs italic text-emerald-800">
                      {ayah.teksLatin}
                    </div>
                  )}
                  <div dir="ltr" lang="id" className="border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {ayah.teksIndonesia}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
