'use client';

import React from 'react';
import { Calendar, Clock, Plus, Sparkles, UserCheck, Users, Zap } from 'lucide-react';

interface PackagePriceSummaryProps {
  pkg: any;
  simulatedSantri: number;
  formatRupiah: (value: number) => string;
}

function durationLabel(pkg: any) {
  const isPerUser = pkg.features?.pricing_type === 'per_user';
  if (isPerUser) return 'Per Santri / Bulan';
  const duration = Number(pkg.duration_months || pkg.features?.duration_months || 1);
  if (duration === 12) return '1 Tahun';
  if (duration === 6) return '6 Bulan';
  return `${duration} Bulan`;
}

export default function PackagePriceSummary({ pkg, simulatedSantri, formatRupiah }: PackagePriceSummaryProps) {
  const isPerUser = pkg.features?.pricing_type === 'per_user';
  const duration = Number(pkg.duration_months || pkg.features?.duration_months || 1);
  const extraPrice = Number(
    pkg.extra_price_per_user !== undefined ? pkg.extra_price_per_user : pkg.features?.extra_price_per_user || 0
  );
  const baseCapacity = Number(pkg.max_santri || pkg.features?.base_capacity || 10);
  const basePrice = Number(pkg.price || 0);
  const defaultSim = isPerUser ? 10 : baseCapacity;
  const current = Math.max(1, Number(simulatedSantri ?? defaultSim));
  const extraSantri = isPerUser ? 0 : Math.max(0, current - baseCapacity);
  const calculatedPrice = isPerUser ? current * basePrice : basePrice + extraSantri * extraPrice;
  const isSimulating = current !== defaultSim;
  const isAnnual = duration === 12;
  const is6Months = duration === 6;

  return (
    <>
      {isPerUser ? (
        <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md">
          <Sparkles size={12} />
          <span>Paket Custom (Per Santri)</span>
        </div>
      ) : isAnnual ? (
        <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
          <Calendar size={12} />
          <span>Paket Hemat 1 Tahun</span>
        </div>
      ) : is6Months ? (
        <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
          <Clock size={12} />
          <span>Paket Pilihan 6 Bulan</span>
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold uppercase text-slate-700">
              {pkg.code}
            </span>
            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              {durationLabel(pkg)}
            </span>
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold ${
            isPerUser ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {isPerUser ? <UserCheck size={20} /> : <Zap size={20} />}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isSimulating ? 'Total Estimasi Simulasi:' : 'Tarif Paket:'}
          </span>
          {isSimulating && (
            <span className="animate-pulse rounded-full border border-emerald-300/60 bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 motion-reduce:animate-none">
              Simulasi {current} Santri
            </span>
          )}
        </div>

        <div className="text-3xl font-black tracking-tight text-slate-900 transition-all">
          {formatRupiah(calculatedPrice)}
          <span className="ml-1.5 text-xs font-semibold text-slate-500">
            {isPerUser ? '/ bulan' : duration === 12 ? '/ tahun' : duration === 6 ? '/ 6 bulan' : '/ bulan'}
          </span>
        </div>

        <p className="mt-1 text-xs font-medium text-slate-500">
          {isPerUser
            ? `${current} santri × ${formatRupiah(basePrice)} / santri / bulan`
            : extraSantri > 0
            ? `Dasar ${formatRupiah(basePrice)} (${baseCapacity} santri) + Tambahan ${extraSantri} santri (${formatRupiah(
                extraSantri * extraPrice
              )})`
            : `Harga dasar untuk kuota awal ${baseCapacity} santri`}
        </p>
      </div>

      {!isPerUser ? (
        <div className="mb-4 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Users size={14} className="text-emerald-600" />
              Kapasitas Kuota Dasar:
            </span>
            <strong className="font-bold text-slate-900">{baseCapacity} Santri</strong>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Plus size={14} className="text-amber-600" />
              Biaya Tambahan Santri:
            </span>
            <strong className="font-bold text-amber-700">+{formatRupiah(extraPrice)} / santri</strong>
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-amber-900">
              <Users size={14} className="text-amber-600" />
              Skema Penagihan:
            </span>
            <strong className="font-bold text-amber-950">Kapasitas Bebas (Custom)</strong>
          </div>
          <div className="flex items-center justify-between border-t border-amber-200/60 pt-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-amber-900">
              <Zap size={14} className="text-amber-600" />
              Tarif Satuan:
            </span>
            <strong className="font-bold text-amber-950">{formatRupiah(basePrice)} / santri / bln</strong>
          </div>
        </div>
      )}
    </>
  );
}
