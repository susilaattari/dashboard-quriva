'use client';

import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

type PackageTab = 'all' | 'monthly' | '6_months' | 'annual' | 'custom';

interface PackageHeaderProps {
  activeTab: PackageTab;
  onTabChange: (tab: PackageTab) => void;
  onCreateGroup: () => void;
  onCreateCustom: () => void;
}

export default function PackageHeader({ activeTab, onTabChange, onCreateGroup, onCreateCustom }: PackageHeaderProps) {
  const tabs: Array<{ id: PackageTab; label: string }> = [
    { id: 'all', label: 'Semua Paket' },
    { id: 'monthly', label: 'Per Bulan (1 Bln)' },
    { id: '6_months', label: 'Per 6 Bulan' },
    { id: 'annual', label: '1 Tahun (Tahunan)' },
    { id: 'custom', label: 'Custom (Per Santri)' },
  ];

  return (
    <>
      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-8 text-white shadow-xl lg:flex-row lg:items-center">
        <div className="relative z-10 max-w-2xl">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Sparkles size={14} /> Skema Fleksibel: Per Bulan, 6 Bulan & 1 Tahun
          </span>
          <h2 className="text-2xl font-black tracking-tight">Model Penagihan Dinamis & Tambah Santri</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
            Tentukan paket grup dengan durasi <strong>1 Bulan</strong>, <strong>6 Bulan</strong>, atau{' '}
            <strong>1 Tahun</strong>. Setiap paket memiliki kapasitas dasar dan tarif penambahan orang yang bisa diatur
            bebas oleh Super Admin.
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={onCreateGroup}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-emerald-400 active:scale-95"
          >
            <Plus size={18} />
            <span>Tambah Paket Durasi</span>
          </button>
          <button
            type="button"
            onClick={onCreateCustom}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-amber-300 active:scale-95"
          >
            <Sparkles size={18} />
            <span>Paket Custom (Per Santri)</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" role="tablist" aria-label="Filter paket">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
