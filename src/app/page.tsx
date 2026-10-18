'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QURAN_SURAHS, SurahData } from '@/data/quranSurah';
import api from '@/services/api';
import {
  BookOpen,
  Play,
  Pause,
  Search,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Video,
  Award,
  Users,
  Building,
  ArrowRight,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Check,
  GraduationCap,
  Calendar,
  Share2,
} from 'lucide-react';

interface FreeMaterial {
  id: number;
  title: string;
  speaker: string;
  category: string;
  duration: string;
  youtubeId: string;
  description: string;
}

const FREE_MATERIALS: FreeMaterial[] = [
  {
    id: 1,
    title: 'Metode Cepat & Kokoh Menghafal Al-Qur\'an 30 Juz',
    speaker: 'Ustadz Adi Hidayat, Lc., M.A.',
    category: 'Metode Tahfidz',
    duration: '28 Menit',
    youtubeId: 'k1_5dO5Fh6k',
    description: 'Panduan langkah demi langkah membagi hafalan baru (ziyadah) dan menjaga hafalan lama (murojaah) dengan mutqin.',
  },
  {
    id: 2,
    title: 'Panduan Tajwid: Makharijul Huruf & Sifatul Huruf Lengkap',
    speaker: 'Syaikh Ayman Suwaid / Ustadz Muhammad',
    category: 'Tahsin & Tajwid',
    duration: '35 Menit',
    youtubeId: 'q-f7V1Xp0t8',
    description: 'Praktik pengucapan huruf hijaiyah dari makhraj aslinya dan kekeliruan umum (lahn jali & khafi) yang sering terjadi.',
  },
  {
    id: 3,
    title: 'Adab dan Keutamaan Penghafal Al-Qur\'an',
    speaker: 'Ustadz Abdul Somad, Lc., M.A.',
    category: 'Adab Qurani',
    duration: '22 Menit',
    youtubeId: 'W_mQZ4m3aG4',
    description: 'Pentingnya menjaga niat ikhlas, adab kepada guru tahfidz, dan akhlak ahlul quran dalam kehidupan sehari-hari.',
  },
  {
    id: 4,
    title: 'Tadabbur Surah Al-Mulk: Pelindung dari Siksa Kubur',
    speaker: 'Ustadz Hanan Attaki, Lc.',
    category: 'Tafsir & Tadabbur',
    duration: '19 Menit',
    youtubeId: '7Q3Z8r2Dq9I',
    description: 'Renungan makna mendalam Surah Al-Mulk ayat demi ayat yang dianjurkan dibaca setiap malam sebelum tidur.',
  },
];

export default function HomePage() {
  const router = useRouter();

  // Navigation tab
  const [activeMainTab, setActiveMainTab] = useState<'quran' | 'kajian' | 'paket'>('quran');

  // Quran state
  const [searchSurah, setSearchSurah] = useState('');
  const [filterJuz, setFilterJuz] = useState<string>('all');
  const [selectedSurah, setSelectedSurah] = useState<SurahData | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [surahAyahs, setSurahAyahs] = useState<any[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Kajian Video state
  const [selectedVideo, setSelectedVideo] = useState<FreeMaterial | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Packages state
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    api.get('/packages')
      .then((res) => {
        setPackages(res.data?.data || []);
      })
      .catch(() => {});
  }, []);

  // Filter surahs
  const filteredSurahs = useMemo(() => {
    return QURAN_SURAHS.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchSurah.toLowerCase()) ||
        s.translation.toLowerCase().includes(searchSurah.toLowerCase()) ||
        String(s.number) === searchSurah.trim();

      if (!matchSearch) return false;

      if (filterJuz === 'juz30') return s.juz === 30 || s.number >= 78;
      if (filterJuz === 'pilihan') {
        return [1, 18, 36, 55, 56, 67].includes(s.number);
      }
      return true;
    });
  }, [searchSurah, filterJuz]);

  // Open Surah Reader & fetch verses
  const handleOpenSurah = async (surah: SurahData) => {
    setSelectedSurah(surah);
    setIsReaderOpen(true);
    setLoadingAyahs(true);
    setSurahAyahs([]);
    setIsPlayingAudio(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      // Fetch authentic verses from reputable Indonesian Quran API (equran.id)
      const res = await fetch(`https://equran.id/api/v2/surat/${surah.number}`);
      if (res.ok) {
        const data = await res.json();
        setSurahAyahs(data.data?.ayat || []);
      } else {
        // Fallback to alquran.cloud global API
        const altRes = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-uthmani,id.indonesian`);
        if (altRes.ok) {
          const altData = await altRes.json();
          const arAyahs = altData.data?.[0]?.ayahs || [];
          const idAyahs = altData.data?.[1]?.ayahs || [];
          const combined = arAyahs.map((a: any, i: number) => ({
            nomorAyat: a.numberInSurah,
            teksArab: a.text,
            teksLatin: '',
            teksIndonesia: idAyahs[i]?.text || '',
          }));
          setSurahAyahs(combined);
        } else {
          throw new Error('Fallback needed');
        }
      }
    } catch (e) {
      // Offline fallback: generate structured verse previews
      const mockVerses = Array.from({ length: Math.min(surah.numberOfAyahs, 20) }, (_, i) => ({
        nomorAyat: i + 1,
        teksArab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        teksLatin: 'Bismillahir rahmanir rahiim',
        teksIndonesia: `Ayat ke-${i + 1} dari Surah ${surah.name}. (Mode offline terpasang)`,
      }));
      setSurahAyahs(mockVerses);
    } finally {
      setLoadingAyahs(false);
    }
  };

  // Toggle Murottal Audio
  const toggleMurottalAudio = () => {
    if (!selectedSurah) return;

    if (!audioRef.current) {
      const formattedNum = String(selectedSurah.number).padStart(3, '0');
      // High-speed CDN Murottal by Syaikh Misyari Rasyid Al-Afasy
      const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.number}.mp3`;
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.onerror = () => {
        setIsPlayingAudio(false);
        alert('Audio murottal sedang dimuat atau koneksi terbatas.');
      };
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => {
        console.warn('Audio play failed:', e);
      });
    }
  };

  const closeSurahReader = () => {
    setIsReaderOpen(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">SaaS Tahfidz</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Portal Qurani
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Al-Qur'an & Kajian Terbuka Gratis</p>
            </div>
          </Link>

          {/* Quick Section Switcher */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveMainTab('quran')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeMainTab === 'quran'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📖 Al-Qur'an 30 Juz
            </button>
            <button
              onClick={() => setActiveMainTab('kajian')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeMainTab === 'kajian'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎥 Kajian & Tahsin
            </button>
            <button
              onClick={() => setActiveMainTab('paket')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeMainTab === 'paket'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💎 Paket Lembaga
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              Masuk Akun
            </Link>
            <Link
              href="/register"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles size={14} />
              <span>Daftar Lembaga</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span>✨ 100% Gratis untuk Pengunjung & Umat</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Baca Al-Qur'an 30 Juz & Pelajari Kajian Tahsin Tanpa Biaya
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Nikmati mushaf digital 114 Surah lengkap dengan murottal merdu dan video kajian tahsin.
            Bagi pimpinan pondok pesantren & sekolah, daftarkan lembaga Anda untuk sistem monitoring hafalan santri otomatis.
          </p>

          {/* Quick Tab Switcher Mobile / Hero */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveMainTab('quran')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeMainTab === 'quran'
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen size={16} />
              <span>Baca Al-Qur'an 30 Juz (Gratis)</span>
            </button>
            <button
              onClick={() => setActiveMainTab('kajian')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeMainTab === 'kajian'
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Video size={16} />
              <span>Kajian Video & Tahsin (Gratis)</span>
            </button>
            <Link
              href="/register"
              className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-xl shadow-amber-500/20"
            >
              <Building size={16} />
              <span>Daftarkan Lembaga Baru</span>
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT BASED ON SELECTED TAB */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* TAB 1: AL-QUR'AN 30 JUZ (GRATIS) */}
        {activeMainTab === 'quran' && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <BookOpen size={14} />
                  <span>Mushaf Digital 30 Juz</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">
                  Daftar 114 Surah Al-Qur'an
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik pada surah untuk membaca ayat lengkap dengan terjemahan dan audio murottal
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative min-w-[260px]">
                  <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Cari surah (misal: Yasin, Al-Kahf)..."
                    value={searchSurah}
                    onChange={(e) => setSearchSurah(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterJuz('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      filterJuz === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua (114)
                  </button>
                  <button
                    onClick={() => setFilterJuz('juz30')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      filterJuz === 'juz30' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Juz 'Amma
                  </button>
                  <button
                    onClick={() => setFilterJuz('pilihan')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      filterJuz === 'pilihan' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Surah Pilihan
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Surah Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSurahs.map((surah) => (
                <div
                  key={surah.number}
                  onClick={() => handleOpenSurah(surah)}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/60 hover:bg-slate-900 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-xs hover:shadow-lg hover:shadow-emerald-950/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Number Badge */}
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700/80 group-hover:border-emerald-500/40 transition-colors">
                      {surah.number}
                    </div>

                    {/* Surah Names */}
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                        {surah.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {surah.translation} • {surah.numberOfAyahs} Ayat
                      </div>
                    </div>
                  </div>

                  {/* Arabic Script & Revelation */}
                  <div className="text-right shrink-0">
                    <div className="font-serif text-lg font-bold text-emerald-400/90">
                      {surah.arabic}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Juz {surah.juz} • {surah.revelation}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredSurahs.length === 0 && (
              <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
                <BookOpen size={40} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-300">Surah tidak ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">Coba gunakan nama surah atau nomor surah lainnya.</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: KAJIAN & TAHSIN VIDEO (GRATIS) */}
        {activeMainTab === 'kajian' && (
          <section className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Video size={14} />
                <span>Video Pembelajaran Terbuka</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                Kajian & Modul Tahsin Al-Qur'an
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dengarkan dan pelajari materi bimbingan tajwid serta metode menghafal Al-Qur'an secara gratis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FREE_MATERIALS.map((mat) => (
                <div
                  key={mat.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-md group"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {mat.category}
                      </span>
                      <span className="text-slate-400 text-[11px]">⏱️ {mat.duration}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {mat.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>

                    <div className="text-xs font-semibold text-slate-300 pt-1">
                      Pembicara: <strong className="text-slate-200">{mat.speaker}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedVideo(mat);
                        setIsVideoModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Tonton Kajian Sekarang</span>
                    </button>
                    <span className="text-[11px] text-slate-500">Akses Terbuka</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3 / SECTION: PAKET LANGGANAN LEMBAGA */}
        {activeMainTab === 'paket' && (
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">
                <Sparkles size={12} />
                <span>Pilihan Paket SaaS Tahfidz</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Biaya Berlangganan Terjangkau untuk Pesantren & Sekolah
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Pendaftaran dapat dilakukan secara mandiri oleh pihak lembaga, diverifikasi melalui transfer manual WhatsApp oleh Super Admin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {packages.map((pkg) => {
                const isPerUser = pkg.features?.pricing_type === 'per_user';
                const duration = pkg.duration_months || pkg.features?.duration_months || 1;
                const extraPrice = pkg.extra_price_per_user !== undefined ? Number(pkg.extra_price_per_user) : Number(pkg.features?.extra_price_per_user || 0);
                const isAnnual = duration === 12;
                const is6Months = duration === 6;

                const durationBadge = isPerUser
                  ? 'Custom (Per Santri)'
                  : isAnnual
                  ? 'Paket 1 Tahun (Tahunan)'
                  : is6Months
                  ? 'Paket 6 Bulan'
                  : 'Paket Bulanan (1 Bulan)';

                const periodSubtitle = isPerUser
                  ? 'per santri / bulan (dinamis)'
                  : isAnnual
                  ? 'per 1 tahun per institusi'
                  : is6Months
                  ? 'per 6 bulan per institusi'
                  : 'per bulan per institusi';

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                      isAnnual
                        ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/60'
                        : isPerUser
                        ? 'bg-slate-900/90 border-2 border-amber-500/60'
                        : is6Months
                        ? 'bg-slate-900/80 border border-teal-500/50'
                        : 'bg-slate-900/70 border border-slate-800'
                    }`}
                  >
                    {isAnnual ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                        Paling Hemat (1 Tahun)
                      </div>
                    ) : is6Months ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                        Pilihan Populer (6 Bulan)
                      </div>
                    ) : isPerUser ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                        Custom Full Benefit
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                            {pkg.code}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                            {durationBadge}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mt-1">{pkg.name}</h3>
                      </div>

                      <div>
                        <div className="text-3xl font-black text-amber-400">
                          {formatCurrency(Number(pkg.price))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {periodSubtitle}
                        </p>
                      </div>

                      {/* Quota & Extra Price info */}
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Kapasitas Kuota Dasar:</span>
                          <strong className="text-white">
                            {pkg.max_santri > 99999 || pkg.max_santri === 0 ? 'Tanpa Batas' : `${pkg.max_santri} Santri`}
                          </strong>
                        </div>
                        {!isPerUser && extraPrice > 0 && (
                          <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-slate-800/80 text-[11px]">
                            <span>Biaya Santri Tambahan:</span>
                            <strong className="text-emerald-400 font-bold">
                              +{formatCurrency(extraPrice)} / santri
                            </strong>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>Pencatatan Setoran Ziyadah & Murojaah Cepat</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>LMS & Audio Koreksi Feedback Guru</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>Pohon Hafalan 30 Juz & Raport Digital</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>Portal Wali Santri & Notifikasi WA Otomatis</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <Link
                        href={`/register?plan=${pkg.code}`}
                        className={`w-full py-3.5 px-4 rounded-xl text-center text-xs font-bold block transition-all shadow-md ${
                          isAnnual
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            : isPerUser
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        Pilih Paket Ini & Daftar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION: FITUR LEMBAGA YANG DIKUNCI / BERLANGGANAN */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                <Lock size={12} />
                <span>Fitur Khusus Lembaga Mitra Berlangganan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Ekosistem Manajemen Tahfidz Terpadu untuk Pesantren Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Fitur di bawah ini hanya dapat diakses oleh Ustadz, Santri, dan Wali Santri setelah lembaga terdaftar dan disetujui Super Admin.
              </p>
            </div>

            <Link
              href="/register"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all shrink-0 self-start md:self-auto"
            >
              <span>Daftarkan Lembaga Anda</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <BookOpen size={18} />
              </div>
              <div className="font-bold text-sm text-white">Input Setoran Ziyadah & Murojaah</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ustadz mencatat kelancaran setoran santri secara realtime langsung dari smartphone.
              </p>
              <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                <Lock size={10} /> Perlu Akun Lembaga
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <Volume2 size={18} />
              </div>
              <div className="font-bold text-sm text-white">Review Audio Tahsin Guru</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Santri mengirimkan rekaman voice note, asatidz memberi koreksi tajwid dan skor kefasihan.
              </p>
              <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                <Lock size={10} /> Perlu Akun Lembaga
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Award size={18} />
              </div>
              <div className="font-bold text-sm text-white">E-Sertifikat Tasmi per Juz</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terbitkan sertifikat kelulusan juz dengan nomor seri unik dan format PDF siap cetak.
              </p>
              <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                <Lock size={10} /> Perlu Akun Lembaga
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <div className="font-bold text-sm text-white">Rapor & Portal Wali Santri</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orang tua memantau perkembangan pohon hafalan 30 juz dan absensi anak dari rumah.
              </p>
              <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                <Lock size={10} /> Perlu Akun Lembaga
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SaaS Tahfidz & Quran Gateway</span>
            <span>• Platform Digital Multi-Tenant Pendidikan Islam</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/register" className="hover:text-emerald-400 transition-colors">
              Pendaftaran Lembaga
            </Link>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Masuk Dashboard
            </Link>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <MessageCircle size={14} />
              <span>Bantuan WhatsApp</span>
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL: INTERACTIVE SURAH READER & AUDIO PLAYER */}
      {isReaderOpen && selectedSurah && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
                  {selectedSurah.number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Surah {selectedSurah.name}</span>
                    <span className="text-emerald-400 font-serif text-lg font-bold">
                      {selectedSurah.arabic}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedSurah.translation} • {selectedSurah.numberOfAyahs} Ayat • Juz {selectedSurah.juz}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio Button */}
                <button
                  onClick={toggleMurottalAudio}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                  title="Dengarkan Murottal Syaikh Misyari Rasyid"
                >
                  {isPlayingAudio ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                  <span>{isPlayingAudio ? 'Jeda Audio' : 'Putar Murottal'}</span>
                </button>

                <button
                  onClick={closeSurahReader}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Bismillah Header (except Surah At-Taubah #9) */}
            {selectedSurah.number !== 9 && (
              <div className="py-4 text-center border-b border-slate-800/60 bg-slate-950/30">
                <div className="font-serif text-xl sm:text-2xl text-emerald-400 font-bold tracking-wider">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dengan nama Allah Yang Maha Pengasih, Maha Penyayang
                </div>
              </div>
            )}

            {/* Ayahs List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-800/60">
              {loadingAyahs ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Memuat ayat-ayat suci Al-Qur'an...</span>
                </div>
              ) : (
                surahAyahs.map((ayah) => (
                  <div key={ayah.nomorAyat} className="pt-5 first:pt-0 space-y-3">
                    {/* Ayah Header & Arabic Text */}
                    <div className="flex items-start justify-between gap-4">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-700">
                        {ayah.nomorAyat}
                      </span>
                      <p className="font-serif text-xl sm:text-2xl text-right text-emerald-200/95 leading-loose flex-1 font-semibold">
                        {ayah.teksArab}
                      </p>
                    </div>

                    {/* Latin & Indonesian Translation */}
                    <div className="space-y-1 pl-10 text-xs">
                      {ayah.teksLatin && (
                        <p className="text-emerald-400/80 italic font-medium leading-relaxed">
                          {ayah.teksLatin}
                        </p>
                      )}
                      <p className="text-slate-300 leading-relaxed">
                        {ayah.teksIndonesia}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIDEO KAJIAN */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-400">{selectedVideo.speaker}</p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedVideo.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
