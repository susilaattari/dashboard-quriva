'use client';

import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';

interface LmsGlobalSectionTabsProps {
  activeSection: 'materials' | 'contributors';
  materialCount: number;
  contributorCount: number;
  onChange: (section: 'materials' | 'contributors') => void;
}

export default function LmsGlobalSectionTabs({
  activeSection,
  materialCount,
  contributorCount,
  onChange,
}: LmsGlobalSectionTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 sm:gap-3" role="tablist" aria-label="Bagian LMS global">
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'materials'}
        onClick={() => onChange('materials')}
        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-all sm:gap-2.5 sm:px-5 sm:py-2.5 sm:text-sm ${
          activeSection === 'materials'
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
            : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Globe size={18} />
        <span>Katalog Modul Global</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
            activeSection === 'materials' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {materialCount}
        </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'contributors'}
        onClick={() => onChange('contributors')}
        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-all sm:gap-2.5 sm:px-5 sm:py-2.5 sm:text-sm ${
          activeSection === 'contributors'
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
            : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100'
        }`}
      >
        <ShieldCheck size={18} />
        <span>Kelola Izin Guru Kontributor Global</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
            activeSection === 'contributors' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'
          }`}
        >
          {contributorCount} Kontributor
        </span>
      </button>
    </div>
  );
}
