'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layouts/AppShell';
import api from '@/services/api';
import { buildLmsMetadataPayload, validateQuizQuestions } from '@/lib/lms';
import LmsMaterialPreviewDialog from '@/components/lms/LmsMaterialPreviewDialog';
import LmsGlobalMaterialCard from '@/components/superadmin/LmsGlobalMaterialCard';
import LmsGlobalSectionTabs from '@/components/superadmin/LmsGlobalSectionTabs';
import {
  BookOpen,
  Video,
  Plus,
  ExternalLink,
  Calendar,
  Headphones,
  FileText,
  HelpCircle,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Check,
  Radio,
  PlayCircle,
  Globe,
  Layers,
  Search,
  Filter,
  Users,
  ShieldCheck,
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface LMSMaterial {
  id: number;
  tenant_id: number | null;
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'audio' | 'text' | 'live_meet';
  content_url: string;
  is_global: boolean;
  author_name?: string;
  creator_role?: string;
  tenant_name?: string;
  created_at?: string;
  metadata?: {
    summary?: string;
    schedule_date?: string;
    duration_minutes?: number;
    text_content?: string;
    questions?: QuizQuestion[];
  };
}

export default function SuperAdminLMSGlobal() {
  const [activeSection, setActiveSection] = useState<'materials' | 'contributors'>('materials');
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'quiz' | 'audio' | 'text' | 'live_meet'>('all');

  // Contributor Management States
  const [gurus, setGurus] = useState<any[]>([]);
  const [loadingGurus, setLoadingGurus] = useState(false);
  const [guruSearch, setGuruSearch] = useState('');
  const [guruCurrentPage, setGuruCurrentPage] = useState(1);
  const guruPageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'quiz' | 'audio' | 'text' | 'live_meet'>('video');
  const [summary, setSummary] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>(30);
  const [textContent, setTextContent] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 1,
      question: 'Apa hukum bacaan Nun Sukun bertemu huruf Ba (ب)?',
      options: ['Izhar Halqi', 'Idgham Bighunnah', 'Iqlab', 'Ikhfa Haqiqi'],
      correctAnswer: 2,
      explanation: 'Nun sukun bertemu huruf Ba dihukumi Iqlab (ditukar bunyinya menjadi Mim).',
    },
  ]);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<LMSMaterial | null>(null);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchMaterials();
    fetchGurus();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/lms?is_global=true');
      setMaterials(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load global LMS materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGurus = async () => {
    try {
      setLoadingGurus(true);
      const res = await api.get('/users?role=guru');
      setGurus(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load gurus for global LMS:', err);
    } finally {
      setLoadingGurus(false);
    }
  };

  const handleToggleGlobalContributor = async (id: number, currentVal: boolean) => {
    try {
      const nextVal = !currentVal;
      await api.put(`/users/${id}`, {
        can_create_lms_global: nextVal,
      });
      setGurus((prev) =>
        prev.map((g) => (g.id === id ? { ...g, can_create_lms_global: nextVal } : g))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status izin kontributor global.');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setType('video');
    setSummary('');
    setContentUrl('');
    setScheduleDate('');
    setDurationMinutes(30);
    setTextContent('');
    setQuestions([
      {
        id: 1,
        question: 'Apa hukum bacaan Nun Sukun bertemu huruf Ba (ب)?',
        options: ['Izhar Halqi', 'Idgham Bighunnah', 'Iqlab', 'Ikhfa Haqiqi'],
        correctAnswer: 2,
        explanation: 'Nun sukun bertemu huruf Ba dihukumi Iqlab.',
      },
    ]);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (mat: LMSMaterial) => {
    setEditingId(mat.id);
    setTitle(mat.title);
    setType(mat.type);
    setContentUrl(mat.content_url === '#' ? '' : mat.content_url);
    const meta = mat.metadata || {};
    setSummary(meta.summary || (typeof mat.description === 'string' && !mat.description.startsWith('{') ? mat.description : ''));
    setScheduleDate(meta.schedule_date || '');
    setDurationMinutes(meta.duration_minutes || 30);
    setTextContent(meta.text_content || '');
    if (meta.questions && Array.isArray(meta.questions) && meta.questions.length > 0) {
      setQuestions(meta.questions);
    } else {
      setQuestions([
        {
          id: 1,
          question: 'Contoh soal kuis',
          options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          correctAnswer: 0,
        },
      ]);
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Question manipulation handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, val: string) => {
    const updated = [...questions];
    updated[idx].question = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = optIdx;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].explanation = val;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul materi wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (type === 'quiz') validateQuizQuestions(questions);

      const metadataPayload = buildLmsMetadataPayload({
        summary,
        scheduleDate,
        durationMinutes,
        type,
        textContent,
        questions,
      });

      const payload = {
        title: title.trim(),
        type,
        content_url: contentUrl.trim() || '#',
        description: JSON.stringify(metadataPayload),
        is_global: true,
      };

      if (editingId) {
        await api.put(`/lms/${editingId}`, payload);
      } else {
        await api.post('/lms', payload);
      }

      setIsModalOpen(false);
      fetchMaterials();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menyimpan materi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (mat: LMSMaterial) => {
    if (!confirm(`Hapus materi global "${mat.title}"? Seluruh tenant tidak akan dapat mengakses materi ini lagi.`)) {
      return;
    }

    try {
      await api.delete(`/lms/${mat.id}`);
      fetchMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menghapus materi');
    }
  };

  const formatSchedule = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch (e) {
      return isoString;
    }
  };

  const getTypeBadge = (matType: string) => {
    switch (matType) {
      case 'video':
        return {
          label: 'Video YouTube',
          icon: Video,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-600',
        };
      case 'quiz':
        return {
          label: 'Latihan Soal / Kuis',
          icon: HelpCircle,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700',
        };
      case 'audio':
        return {
          label: 'Audio / Podcast',
          icon: Headphones,
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          iconBg: 'bg-teal-100 text-teal-700',
        };
      case 'text':
        return {
          label: 'Teks / Bacaan',
          icon: FileText,
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          iconBg: 'bg-blue-100 text-blue-700',
        };
      case 'live_meet':
        return {
          label: 'Live Google Meet',
          icon: Radio,
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-700',
        };
      default:
        return {
          label: 'Modul Materi',
          icon: BookOpen,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
        };
    }
  };

  // Filter materials by tab & search query
  const filteredMaterials = materials.filter((m) => {
    const matchesTab = activeTab === 'all' || m.type === activeTab;
    const matchesSearch =
      !searchQuery ||
      String(m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.metadata?.summary && String(m.metadata.summary).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Counters
  const counts = {
    all: materials.length,
    video: materials.filter((m) => m.type === 'video').length,
    quiz: materials.filter((m) => m.type === 'quiz').length,
    audio: materials.filter((m) => m.type === 'audio').length,
    text: materials.filter((m) => m.type === 'text').length,
    live_meet: materials.filter((m) => m.type === 'live_meet').length,
  };

  const filteredGurus = gurus.filter((g) => {
    if (!guruSearch) return true;
    const q = guruSearch.toLowerCase();
    return (
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.tenant_name && g.tenant_name.toLowerCase().includes(q))
    );
  });
  const globalContributorCount = gurus.filter((g) => g.can_create_lms_global).length;
  const uniqueTenantCount = new Set(gurus.map((g) => g.tenant_name || g.tenant_id).filter(Boolean)).size;

  return (
    <AppShell
          title="Manajemen LMS Global Tahsin"
          subtitle="Modul kurikulum terpusat SaaS yang disalurkan secara otomatis ke seluruh tenant berlangganan"
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          <LmsGlobalSectionTabs
            activeSection={activeSection}
            materialCount={materials.length}
            contributorCount={globalContributorCount}
            onChange={setActiveSection}
          />

          {activeSection === 'materials' ? (
            <>
              {/* Header Action & Stat Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-inner">
                <Globe size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900">Katalog Materi Global SaaS</h3>
                  <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Auto-Sync Seluruh Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Setiap materi global yang ditambahkan di sini langsung muncul di aplikasi mobile santri & wali pada semua tenant aktif.
                </p>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-purple-600/20 transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={18} />
              <span>Tambah Modul Global</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: 'all', label: 'Semua Modul', count: counts.all, icon: Layers, color: 'text-slate-700', bg: 'bg-white' },
              { id: 'video', label: 'Video YouTube', count: counts.video, icon: Video, color: 'text-rose-600', bg: 'bg-rose-50/50' },
              { id: 'quiz', label: 'Kuis Interaktif', count: counts.quiz, icon: HelpCircle, color: 'text-amber-600', bg: 'bg-amber-50/50' },
              { id: 'audio', label: 'Podcast & Audio', count: counts.audio, icon: Headphones, color: 'text-teal-600', bg: 'bg-teal-50/50' },
              { id: 'text', label: 'Teks Bacaan', count: counts.text, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50/50' },
              { id: 'live_meet', label: 'Live Meet', count: counts.live_meet, icon: Radio, color: 'text-purple-600', bg: 'bg-purple-50/50' },
            ].map((stat) => {
              const IconComp = stat.icon;
              const isActive = activeTab === stat.id;
              return (
                <button
                  key={stat.id}
                  onClick={() => setActiveTab(stat.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-purple-500 bg-purple-50/40 shadow-sm ring-2 ring-purple-500/20'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconComp size={18} className={stat.color} />
                    <span className="text-lg font-black text-slate-800">{stat.count}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 truncate">{stat.label}</p>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari judul materi global, deskripsi topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Grid Materials */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-9 h-9 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium">Memuat materi global LMS...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">Belum ada materi global</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'Tidak ada materi yang sesuai dengan pencarian.'
                  : 'Klik tombol "Tambah Modul Global" di atas untuk menerbitkan materi terpusat.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <LmsGlobalMaterialCard
                  key={material.id}
                  material={material}
                  onPreview={(item) => {
                    setPreviewItem(item);
                    setActiveQuizIndex(0);
                    setSelectedQuizAnswers({});
                  }}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Tab: Kelola Izin Guru Kontributor Global */
        <div className="space-y-6">
          {/* Info & Summary Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Otorisasi Kontributor Kurikulum Global
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Secara default, materi global dikelola oleh Super Admin. Anda dapat memberikan wewenang kepada Guru dari pesantren mana pun untuk ikut merilis modul materi / kuis Tahsin global yang langsung disalurkan ke seluruh tenant SaaS.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Guru</p>
                <p className="text-lg font-black text-slate-800">{gurus.length}</p>
              </div>
              <div className="bg-purple-50 px-4 py-2.5 rounded-2xl border border-purple-200 text-center">
                <p className="text-[10px] uppercase font-bold text-purple-600">Kontributor Global</p>
                <p className="text-lg font-black text-purple-700">{globalContributorCount}</p>
              </div>
              <div className="bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-200 text-center">
                <p className="text-[10px] uppercase font-bold text-blue-600">Tenant Terdaftar</p>
                <p className="text-lg font-black text-blue-700">{uniqueTenantCount}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari guru berdasarkan nama, email, atau nama pesantren..."
              value={guruSearch}
              onChange={(e) => {
                setGuruSearch(e.target.value);
                setGuruCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>

          {/* Table List of Teachers */}
          {loadingGurus ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-medium">Memuat data guru dari seluruh tenant...</p>
            </div>
          ) : filteredGurus.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <Users size={48} className="mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">Tidak ada guru ditemukan</h4>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-emerald-700 text-white text-xs uppercase font-semibold">
<tr>
<th className="px-4 py-3.5 w-14 text-center whitespace-nowrap">No</th>
<th className="px-4 py-3.5 whitespace-nowrap">Nama Guru & Kontak</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">Asal Pesantren / Lembaga</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-center">Izin LMS Lokal</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-center">Wewenang LMS Global</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-right">Aksi Super Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-700">
                    {filteredGurus
                      .slice((guruCurrentPage - 1) * guruPageSize, guruCurrentPage * guruPageSize)
                      .map((guru, idx) => (
                      <tr key={guru.id} className="group">
<td className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap bg-slate-100 group-hover:bg-emerald-100/70 transition-colors">
{(guruCurrentPage - 1) * guruPageSize + idx + 1}
</td>
                        <td className="px-4 py-3 whitespace-nowrap bg-white group-hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-bold text-slate-700 leading-tight">{guru.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{guru.email}</p>
                              {guru.phone && <p className="text-[11px] text-slate-400">{guru.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                            {guru.tenant_name || `Tenant #${guru.tenant_id}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center bg-white group-hover:bg-emerald-50 transition-colors">
                          {guru.can_create_lms_local ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check size={12} />
                              Diizinkan Tenant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                              Menyimak Saja
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          {guru.can_create_lms_global ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                              <ShieldCheck size={14} className="text-emerald-600" />
                              Kontributor Global Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200">
                              Bukan Kontributor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right bg-white group-hover:bg-emerald-50 transition-colors">
                          <button
                            onClick={() => handleToggleGlobalContributor(guru.id, guru.can_create_lms_global)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              guru.can_create_lms_global
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
                            }`}
                          >
                            {guru.can_create_lms_global ? (
                              <>
                                <X size={13} />
                                <span>Cabut Izin Global</span>
                              </>
                            ) : (
                              <>
                                <Plus size={13} />
                                <span>Beri Izin Kontributor</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Component */}
              <Pagination
                currentPage={guruCurrentPage}
                totalItems={filteredGurus.length}
                pageSize={guruPageSize}
                onPageChange={setGuruCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </main>

      {/* Modal Tambah / Ubah Materi Global */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Ubah Modul LMS Global' : 'Tambah Modul LMS Global Baru'}
                </h3>
                <p className="text-xs text-purple-600 font-medium mt-0.5">
                  Materi ini akan disinkronisasikan ke seluruh tenant pelanggan SaaS
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup dialog"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Judul Materi Global
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kaidah Makharijul Huruf Lengkap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Modul Konten
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500 bg-white font-medium"
                  >
                    <option value="video">Video YouTube Tutorial</option>
                    <option value="quiz">Latihan Soal / Kuis Interaktif</option>
                    <option value="audio">Audio / Podcast Kajian</option>
                    <option value="text">Teks / Bacaan & Panduan</option>
                    <option value="live_meet">Sesi Live Google Meet / Zoom</option>
                  </select>
                </div>
              </div>

              {/* Ringkasan Singkat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Deskripsi / Ringkasan Materi
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas mengenai topik materi ini..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                />
              </div>

              {/* Jadwal Pelaksanaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-600" />
                    <span>Jadwal Pelaksanaan / Rilis</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-purple-600" />
                    <span>Estimasi Durasi (Menit)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Kondisional Input Berdasarkan Tipe */}
              {type === 'video' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tautan Video YouTube (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                  />
                </div>
              )}

              {type === 'live_meet' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tautan Google Meet / Zoom Room
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                  />
                </div>
              )}

              {type === 'audio' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tautan Audio Streaming / Podcast MP3
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/audio/murottal.mp3"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                  />
                </div>
              )}

              {type === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Isi Lengkap Teks / Bacaan Materi
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Tuliskan materi tajwid, kaidah membaca, terjemahan, atau dalil di sini..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500 font-sans"
                  />
                </div>
              )}

              {type === 'quiz' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daftar Soal Kuis Pilihan Ganda
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Atur pertanyaan, 4 pilihan opsi jawaban, dan kunci jawaban yang benar
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Tambah Soal</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
                            Soal #{qIdx + 1}
                          </span>
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            placeholder={`Tulis pertanyaan soal #${qIdx + 1}...`}
                            value={q.question}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold text-slate-500">
                            Pilihan Jawaban (Klik radio button untuk memilih kunci jawaban):
                          </p>
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id || qIdx}`}
                                checked={q.correctAnswer === optIdx}
                                onChange={() => handleCorrectAnswerChange(qIdx, optIdx)}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-400 w-4">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <input
                                type="text"
                                required
                                placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Penjelasan / Pembahasan Jawaban (Opsional)..."
                            value={q.explanation || ''}
                            onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                            className="w-full bg-white border border-dashed border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Materi Global'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LmsMaterialPreviewDialog
        material={previewItem}
        activeQuizIndex={activeQuizIndex}
        selectedAnswers={selectedQuizAnswers}
        onSelectAnswer={(index, option) => setSelectedQuizAnswers({ ...selectedQuizAnswers, [index]: option })}
        onQuizIndexChange={setActiveQuizIndex}
        onClose={() => setPreviewItem(null)}
      />

    </AppShell>
  );
}
