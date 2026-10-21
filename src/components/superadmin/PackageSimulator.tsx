'use client';

import React from 'react';
import { Calculator } from 'lucide-react';

interface PackageSimulatorProps {
  pkg: any;
  value: number;
  onChange: (value: number) => void;
  formatRupiah: (value: number) => string;
}

export default function PackageSimulator({ pkg, value, onChange, formatRupiah }: PackageSimulatorProps) {
  const isPerUser = pkg.features?.pricing_type === 'per_user';
  const baseCapacity = Number(pkg.max_santri || pkg.features?.base_capacity || 10);
  const basePrice = Number(pkg.price || 0);
  const extraPrice = Number(
    pkg.extra_price_per_user !== undefined ? pkg.extra_price_per_user : pkg.features?.extra_price_per_user || 0
  );
  const defaultSim = isPerUser ? 10 : baseCapacity;
  const current = Math.max(1, Number(value ?? defaultSim));
  const extraSantri = isPerUser ? 0 : Math.max(0, current - baseCapacity);
  const calculatedPrice = isPerUser ? current * basePrice : basePrice + extraSantri * extraPrice;
  const isSimulating = current !== defaultSim;

  const step = (delta: number) => onChange(Math.max(1, current + delta));

  return (
    <div className="mb-5 space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/5 p-4">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
        <span className="flex items-center gap-1.5 text-emerald-800">
          <Calculator size={15} /> Simulasi Hitung Harga:
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={5000}
            aria-label="Jumlah santri simulasi"
            value={current}
            onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
            className="w-16 rounded-lg border border-emerald-300 bg-white px-2 py-0.5 text-center text-xs font-black text-emerald-950 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          />
          <span className="text-xs font-extrabold text-emerald-800">Santri</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {[-5, -1].map((delta) => (
          <button
            key={delta}
            type="button"
            title={`${delta < 0 ? 'Kurangi' : 'Tambah'} ${Math.abs(delta)} santri`}
            onClick={() => step(delta)}
            className="flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
          >
            {delta}
          </button>
        ))}
        <input
          type="range"
          min={1}
          max={isPerUser ? 100 : Math.max(50, baseCapacity * 3)}
          value={current}
          aria-label="Simulasi jumlah santri"
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 flex-1 cursor-pointer rounded-lg bg-slate-200 accent-emerald-600"
        />
        {[1, 5].map((delta) => (
          <button
            key={delta}
            type="button"
            title={`Tambah ${delta} santri`}
            onClick={() => step(delta)}
            className="flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
          >
            +{delta}
          </button>
        ))}
      </div>

      <div className="space-y-1 rounded-xl border border-emerald-500/20 bg-white/95 p-2.5 text-xs">
        {isPerUser ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>
              {current} Santri × {formatRupiah(basePrice)}:
            </span>
            <strong className="text-xs font-black text-emerald-700">{formatRupiah(calculatedPrice)}</strong>
          </div>
        ) : extraSantri > 0 ? (
          <>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Dasar ({baseCapacity} Santri):</span>
              <span className="font-semibold text-slate-800">{formatRupiah(basePrice)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-amber-700">
              <span>
                +{extraSantri} Santri Tambahan ({extraSantri} × {formatRupiah(extraPrice)}):
              </span>
              <span className="font-semibold">+{formatRupiah(extraSantri * extraPrice)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-1 font-bold">
              <span className="text-slate-800">Total Simulasi:</span>
              <strong className="text-xs font-black text-emerald-700">{formatRupiah(calculatedPrice)}</strong>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Masuk dalam kuota dasar ({baseCapacity} Santri):</span>
            <strong className="text-xs font-black text-emerald-700">{formatRupiah(basePrice)}</strong>
          </div>
        )}
      </div>

      {isSimulating && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => onChange(defaultSim)}
            className="text-[10px] font-semibold text-emerald-700 underline hover:text-emerald-900"
          >
            Reset ke {isPerUser ? '10 santri' : `kuota dasar (${baseCapacity} santri)`}
          </button>
        </div>
      )}
    </div>
  );
}
