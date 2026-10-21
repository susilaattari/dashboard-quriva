'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layouts/AppShell';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { buildLmsMetadataPayload, validateQuizQuestions } from '@/lib/lms';
import LmsUpsell from '@/components/lms/LmsUpsell';
import LmsMaterialPreviewDialog from '@/components/lms/LmsMaterialPreviewDialog';
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
  Radio,
  PlayCircle,
  Lock,
  Sparkles,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface LMSMaterial {
  id: number;
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

export default function TenantLMSMateriPage() {
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [forbiddenMessage, setForbiddenMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'quiz' | 'audio' | 'text' | 'live_meet'>('video');
  const [isGlobalScope, setIsGlobalScope] = useState(false);
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
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/lms');
      setMaterials(res.data?.data || []);
      setIsForbidden(false);
    } catch (err: any) {
      console.error('Failed to load LMS materials:', err);
      if (err.response?.status === 403) {
        setIsForbidden(true);
        setForbiddenMessage(err.response?.data?.message || 'Fitur ini tidak termasuk dalam paket langganan Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const packageFeatures = typeof user?.package?.features === 'string'
    ? JSON.parse(user.package.features || '{}')
    : (user?.package?.features || {});

  const isLocked = !loading && (isForbidden || (user?.role !== 'super_admin' && packageFeatures && packageFeatures.lms === false));

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminTenant = user?.role === 'admin_tenant';
  const isGuru = user?.role === 'guru';
  const canManageLocalLMS = isSuperAdmin || isAdminTenant || (isGuru && Boolean(user?.can_create_lms_local));
  const canManageGlobalLMS = isSuperAdmin || (isGuru && Boolean(user?.can_create_lms_global));
  const canCreateAnyLMS = canManageLocalLMS || canManageGlobalLMS;

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setType('video');
    setSummary('');
    setContentUrl('');
    setScheduleDate('');
    setDurationMinutes(30);
    setTextContent('');
    setIsGlobalScope(!canManageLocalLMS && canManageGlobalLMS);
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
    setIsGlobalScope(Boolean(mat.is_global));
    setContentUrl(mat.content_url === '#' ? '' : mat.content_url);
    const meta = mat.metadata || {};
    setSummary(meta.summary || (typeof mat.description === 'string' && !mat.description.startsWith('{') ? mat.description : ''));
    setScheduleDate(meta.schedule_date || '');
    setDurationMinutes(meta.duration_minutes || 30);
    setTextContent(meta.text_content || '');
    if (meta.questions && meta.questions.length > 0) {
      setQuestions(meta.questions);
    } else {
      setQuestions([
        {
          id: 1,
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
        },
      ]);
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Quiz Builder Helpers
  const addQuestion = () => {
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

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Kuis minimal harus memiliki 1 pertanyaan.');
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = optIndex;
    setQuestions(updated);
  };

  const updateExplanation = (qIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].explanation = text;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Judul materi wajib diisi.');
      return;
    }
    setSubmitting(true);

    try {
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
        is_global: canManageGlobalLMS ? isGlobalScope : false,
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
    if (mat.is_global && !canManageGlobalLMS) {
      alert('Materi Kurikulum Global hanya dapat dikelola oleh Super Admin atau Guru Kontributor Terdaftar.');
      return;
    }
    if (!confirm(`Hapus modul materi "${mat.title}"?`)) return;

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

  return (
    <AppShell
          title="Modul Pembelajaran & LMS Tahsin"
          subtitle="Katalog video tutorial, kuis custom, teks bacaan, podcast, dan jadwal sesi Google Meet"
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Memuat katalog materi LMS...</p>
            </div>
          ) : isLocked ? (
            <LmsUpsell
              packageName={user?.package?.name}
              tenantName={user?.tenant?.name}
              forbiddenMessage={forbiddenMessage}
            />

          ) : (
            <>
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Katalog Materi Pembelajaran</h3>
                  <p className="text-xs text-slate-500">
                    Wali santri dapat mengakses seluruh modul materi ini secara interaktif melalui Aplikasi Mobile
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {user?.can_create_lms_global && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold shadow-sm">
                      <ShieldCheck size={14} className="text-purple-600" />
                      Kontributor Global Aktif
                    </span>
                  )}

                  {canCreateAnyLMS ? (
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
                    >
                      <Plus size={18} />
                      <span>Tambah Modul / Jadwal Materi</span>
                    </button>
                  ) : isGuru ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200">
                      <Lock size={14} className="text-slate-400" />
                      <span>Mode Menyimak (Izin Pembuat Nonaktif)</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Informational banner if Guru does not have local LMS creator permission */}
              {isGuru && !canManageLocalLMS && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs animate-fade-in motion-reduce:animate-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900">Hak Akses Menyimak & Membaca Modul LMS</p>
                      <p className="text-amber-700 mt-0.5 leading-relaxed">
                        Anda dapat menyimak dan memutar materi pembelajaran. Untuk membuat materi lokal pesantren, izin harus diaktifkan oleh <strong>Admin Pesantren</strong> di menu <em>Data Guru</em>.
                        {user?.can_create_lms_global && (
                          <span className="mt-1 flex items-center gap-1 text-purple-800 font-semibold">
                            <Sparkles size={12} /> Anda memiliki wewenang Super Admin untuk menyusun Modul Kurikulum Global.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((m) => {
                  const meta = m.metadata || {};
                  const badge = getTypeBadge(m.type);
                  const IconComp = badge.icon;
                  const formattedDate = formatSchedule(meta.schedule_date);
                  const questionCount = meta.questions?.length || 0;

                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div>
                        {/* Top Row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${badge.iconBg}`}>
                            <IconComp size={22} />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                m.is_global ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {m.is_global ? 'Global' : 'Lokal'}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                          {m.title}
                        </h4>

                        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                          {meta.summary || (typeof m.description === 'string' && !m.description.startsWith('{') ? m.description : 'Tidak ada keterangan.')}
                        </p>

                        {/* Meta info tags */}
                        <div className="space-y-1.5 mb-4">
                          {formattedDate && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl font-medium w-fit">
                              <Calendar size={13} className="shrink-0" />
                              <span>Jadwal: {formattedDate}</span>
                              {meta.duration_minutes && <span>({meta.duration_minutes} mnt)</span>}
                            </div>
                          )}

                          {m.type === 'quiz' && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl font-medium w-fit">
                              <HelpCircle size={13} className="shrink-0" />
                              <span>{questionCount} Soal Pilihan Ganda Custom</span>
                            </div>
                          )}

                          {m.type === 'text' && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl font-medium w-fit">
                              <FileText size={13} className="shrink-0" />
                              <span>Artikel Bacaan & Panduan</span>
                            </div>
                          )}
                        </div>

                        {/* Info Pembuat Materi / Soal */}
                        <div className="pt-3 pb-1 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${
                              m.is_global ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {m.is_global ? 'SA' : (m.author_name ? m.author_name[0].toUpperCase() : 'G')}
                            </div>
                            <span className="truncate">
                              <span className="text-slate-400">Dibuat oleh: </span>
                              <span className="font-semibold text-slate-700">{m.author_name || (m.is_global ? 'Super Administrator' : 'Pengajar')}</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                            {m.creator_role || (m.is_global ? 'Pusat' : 'Institusi')}
                          </span>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Primary Content Action */}
                        {m.type === 'quiz' ? (
                          <button
                            onClick={() => {
                              setPreviewItem(m);
                              setActiveQuizIndex(0);
                              setSelectedQuizAnswers({});
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                            <span>Lihat Soal Kuis</span>
                          </button>
                        ) : m.type === 'text' ? (
                          <button
                            onClick={() => setPreviewItem(m)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <FileText size={14} />
                            <span>Baca Materi</span>
                          </button>
                        ) : (
                          <a
                            href={m.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                          >
                            <span>Buka Tautan</span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {/* Edit and Delete for local institution or user's authored global materials */}
                        {((!m.is_global && canManageLocalLMS) || (m.is_global && canManageGlobalLMS && m.author_name === user?.name)) && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(m)}
                              className="inline-flex h-11 w-11 items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Ubah Modul"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="inline-flex h-11 w-11 items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Modul"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {materials.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="text-base font-bold text-slate-700">Belum ada modul materi</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Klik tombol "Tambah Modul / Jadwal Materi" di atas untuk menambahkan materi pertama.
                  </p>
                </div>
              )}
            </>
          )}
        </main>

      {/* Modal Tambah / Ubah Materi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Ubah Modul Materi LMS' : 'Tambah Modul Materi Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur jenis konten pembelajaran, jadwal rilis/pelaksanaan, serta kuis kustom
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
              {canManageGlobalLMS && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Globe size={14} className="text-purple-600" />
                      Lingkup Distribusi Modul
                    </span>
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full">
                      Kontributor Global Super Admin
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!canManageLocalLMS}
                      onClick={() => setIsGlobalScope(false)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        !isGlobalScope
                          ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-500/20'
                          : 'bg-white/60 border-purple-200 text-slate-500 hover:bg-white'
                      } ${!canManageLocalLMS ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <p className="text-xs font-bold text-slate-900">Lokal Pesantren</p>
                      <p className="text-[10px] text-slate-500">Hanya untuk santri di pesantren Anda</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGlobalScope(true)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isGlobalScope
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : 'bg-white/60 border-purple-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <p className="flex items-center gap-1 text-xs font-bold">
                        <Globe size={12} /> Global Tahsin SaaS
                      </p>
                      <p className={`text-[10px] ${isGlobalScope ? 'text-purple-100' : 'text-slate-500'}`}>
                        Disinkronkan ke seluruh pesantren
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Judul Materi / Sesi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hukum Nun Sukun & Tanwin"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Modul Konten
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 bg-white font-medium"
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
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                />
              </div>

              {/* Jadwal Pelaksanaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-600" />
                    <span>Jadwal Pelaksanaan / Rilis</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Waktu kapan materi atau sesi meet dibuka untuk wali santri.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-600" />
                    <span>Estimasi Durasi (Menit)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="30"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Estimasi durasi pengerjaan kuis atau panjangnya sesi belajar.
                  </p>
                </div>
              </div>

              {/* Dynamic Fields Based on Type */}
              {(type === 'video' || type === 'audio' || type === 'live_meet') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {type === 'video'
                      ? 'URL Video YouTube'
                      : type === 'audio'
                      ? 'URL File Audio / Streaming Podcast'
                      : 'Tautan Google Meet / Zoom'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={
                      type === 'video'
                        ? 'https://www.youtube.com/watch?v=...'
                        : type === 'audio'
                        ? 'https://example.com/audio/kajian-tajwid.mp3'
                        : 'https://meet.google.com/abc-defg-hij'
                    }
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>
              )}

              {type === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Isi Materi Teks / Panduan Bacaan Lengkap
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Tuliskan materi pembelajaran, kaidah hukum tajwid, dalil ayat, atau adab membaca Al-Quran di sini..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-sans leading-relaxed"
                  />
                </div>
              )}

              {/* QUIZ BUILDER */}
              {type === 'quiz' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                        Daftar Soal Kuis ({questions.length} Soal)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Buat pertanyaan pilihan ganda dan tandai kunci jawaban yang benar
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Tambah Soal Baru</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-lg">
                            Soal #{qIdx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 text-xs font-semibold cursor-pointer"
                            title="Hapus Soal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            placeholder={`Tuliskan pertanyaan soal #${qIdx + 1}...`}
                            value={q.question}
                            onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                          />
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const isSelectedKey = q.correctAnswer === optIdx;
                            const optionChar = String.fromCharCode(65 + optIdx);

                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-1.5 rounded-xl border transition-colors ${
                                  isSelectedKey
                                    ? 'bg-emerald-50 border-emerald-400'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setCorrectOption(qIdx, optIdx)}
                                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                                    isSelectedKey
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title="Pilih sebagai kunci jawaban"
                                >
                                  {optionChar}
                                </button>
                                <input
                                  type="text"
                                  required
                                  placeholder={`Pilihan ${optionChar}...`}
                                  value={opt}
                                  onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                                  className="w-full bg-transparent border-none text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 text-slate-800"
                                />
                                {isSelectedKey && (
                                  <span className="text-[10px] text-emerald-700 font-bold pr-1">
                                    Kunci
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div>
                          <input
                            type="text"
                            placeholder="Pembahasan / Alasan jawaban benar (Opsional)..."
                            value={q.explanation || ''}
                            onChange={(e) => updateExplanation(qIdx, e.target.value)}
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Modul Sekarang'}
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
