'use client';

import React from 'react';
import { Play, Video } from 'lucide-react';

interface FreeMaterial {
  id: number;
  title: string;
  speaker: string;
  category: string;
  duration: string;
  youtubeId: string;
  description: string;
}

interface PublicKajianSectionProps {
  visible: boolean;
  materials: FreeMaterial[];
  onSelect: (material: FreeMaterial) => void;
}

export default function PublicKajianSection({ visible, materials, onSelect }: PublicKajianSectionProps) {
  if (!visible) return null;

  return (
    <section id="kajian-section" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Video size={14} />
            <span>Kajian & Tahsin Terbuka</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            Video Pembelajaran Tahsin & Metode Hafalan
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Materi terpilih dari para asatidz dan masyaikh untuk membantu mutaba'ah dan tajwid santri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {materials.map((material) => (
          <button
            key={material.id}
            type="button"
            onClick={() => onSelect(material)}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
          >
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-slate-100">
              <img
                src={`https://img.youtube.com/vi/${material.youtubeId}/hqdefault.jpg`}
                alt={material.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 transition-colors group-hover:bg-slate-900/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-transform group-hover:scale-110">
                  <Play size={18} className="ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                {material.duration}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between space-y-2 p-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{material.category}</span>
                <h4 className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                  {material.title}
                </h4>
              </div>
              <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">{material.speaker}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
