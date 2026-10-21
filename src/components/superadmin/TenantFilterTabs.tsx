'use client';

import React from 'react';

type TenantTab = 'all' | 'pending_approval' | 'quota_requests' | 'active' | 'suspended';

interface TenantFilterTabsProps {
  activeTab: TenantTab;
  totalCount: number;
  pendingCount: number;
  quotaCount: number;
  activeCount: number;
  suspendedCount: number;
  onChange: (tab: TenantTab) => void;
}

export default function TenantFilterTabs({
  activeTab,
  totalCount,
  pendingCount,
  quotaCount,
  activeCount,
  suspendedCount,
  onChange,
}: TenantFilterTabsProps) {
  const tabs = [
    {
      key: 'all' as TenantTab,
      label: 'Semua Lembaga',
      count: totalCount,
      idle: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70',
      active: 'bg-slate-500 border-slate-500 text-white shadow-md shadow-slate-500/25',
    },
    {
      key: 'pending_approval' as TenantTab,
      label: 'Menunggu Persetujuan',
      count: pendingCount,
      badge: pendingCount > 0 ? `${pendingCount} baru` : null,
      idle: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70',
      active: 'bg-slate-500 border-slate-500 text-white shadow-md shadow-slate-500/25',
    },
    {
      key: 'quota_requests' as TenantTab,
      label: 'Permintaan Kuota',
      count: quotaCount,
      badge: quotaCount > 0 ? `${quotaCount} baru` : null,
      idle: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70',
      active: 'bg-slate-500 border-slate-500 text-white shadow-md shadow-slate-500/25',
    },
    {
      key: 'active' as TenantTab,
      label: 'Aktif Berlangganan',
      count: activeCount,
      idle: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
      active: 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25',
    },
    {
      key: 'suspended' as TenantTab,
      label: 'Ditangguhkan / Ditolak',
      count: suspendedCount,
      idle: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100',
      active: 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/25',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            activeTab === tab.key ? tab.active : tab.idle
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate text-[11px] font-semibold opacity-90">{tab.label}</span>
            {tab.badge && (
              <span className="whitespace-nowrap rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {tab.badge}
              </span>
            )}
          </div>
          <div className="mt-1 text-xl font-bold">{tab.count}</div>
        </button>
      ))}
    </div>
  );
}
