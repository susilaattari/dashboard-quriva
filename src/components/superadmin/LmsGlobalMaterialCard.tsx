'use client';

import React from 'react';
import { Calendar, Edit2, ExternalLink, Eye, FileText, Headphones, HelpCircle, Trash2, Video } from 'lucide-react';

interface LmsGlobalMaterialCardProps {
  material: any;
  onPreview: (material: any) => void;
  onEdit: (material: any) => void;
  onDelete: (material: any) => void;
}

const typeBadges: Record<string, { label: string; icon: any; bg: string; iconBg: string }> = {
  video: {
    label: 'Video YouTube',
    icon: Video,
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  quiz: {
    label: 'Latihan Soal / Kuis',
    icon: HelpCircle,
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  audio: {
    label: 'Audio / Podcast',
    icon: Headphones,
    bg: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-100 text-teal-700',
  },
  text: {
    label: 'Teks Bacaan',
    icon: FileText,
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  live_meet: {
    label: 'Live Meet',
    icon: Calendar,
    bg: 'bg-purple-50 text-purple-800 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
  },
};

function formatSchedule(value?: string) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function LmsGlobalMaterialCard({ material, onPreview, onEdit, onDelete }: LmsGlobalMaterialCardProps) {
  const meta = material.metadata || {};
  const badge = typeBadges[material.type] || typeBadges.text;
  const Icon = badge.icon;
  const formattedDate = formatSchedule(meta.schedule_date);
  const questionCount = meta.questions?.length || 0;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-bold ${badge.iconBg}`}>
            <Icon size={22} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
              Global
            </span>
          </div>
        </div>

        <h4 className="mb-2 text-base font-bold leading-snug text-slate-900">{material.title}</h4>

        <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-slate-500">
          {meta.summary ||
            (typeof material.description === 'string' && !material.description.startsWith('{')
              ? material.description
              : 'Tidak ada keterangan.')}
        </p>

        <div className="mb-4 space-y-1.5">
          {formattedDate && (
            <div className="flex w-fit items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Calendar size={13} className="shrink-0" />
              <span>Jadwal: {formattedDate}</span>
              {meta.duration_minutes && <span>({meta.duration_minutes} mnt)</span>}
            </div>
          )}
          {material.type === 'quiz' && (
            <div className="flex w-fit items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <HelpCircle size={13} className="shrink-0" />
              <span>{questionCount} Soal Pilihan Ganda Interaktif</span>
            </div>
          )}
          {material.type === 'text' && (
            <div className="flex w-fit items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <FileText size={13} className="shrink-0" />
              <span>Artikel Panduan & Teks Mandiri</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pb-1 pt-3 text-[11px] text-slate-500">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[9px] font-bold text-purple-700">
              {material.author_name ? material.author_name[0].toUpperCase() : 'S'}
            </div>
            <span className="truncate">
              <span className="text-slate-400">Pembuat: </span>
              <span className="font-semibold text-slate-800">{material.author_name || 'Super Administrator'}</span>
            </span>
          </div>
          <span className="shrink-0 rounded-md border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
            {material.creator_role || 'Super Admin (Pusat)'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
        {material.type === 'quiz' ? (
          <button
            type="button"
            onClick={() => onPreview(material)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <Eye size={14} />
            <span>Uji Soal Kuis</span>
          </button>
        ) : material.type === 'text' ? (
          <button
            type="button"
            onClick={() => onPreview(material)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 transition-colors hover:bg-blue-100"
          >
            <FileText size={14} />
            <span>Baca Materi</span>
          </button>
        ) : (
          <a
            href={material.content_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200"
          >
            <span>Buka Tautan</span>
            <ExternalLink size={12} />
          </a>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(material)}
            aria-label="Ubah modul global"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-purple-50 hover:text-purple-700"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(material)}
            aria-label="Hapus modul global"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
