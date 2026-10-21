'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { getTenantHost } from '@/config/brand';

interface QuotaRequestTableProps {
  items: any[];
  currentPage: number;
  pageSize: number;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function QuotaRequestTable({
  items,
  currentPage,
  pageSize,
  onApprove,
  onReject,
}: QuotaRequestTableProps) {
  return (
    <table className="w-full min-w-[1100px] text-left text-sm">
      <thead className="bg-emerald-700 text-xs font-semibold uppercase text-white">
        <tr>
          <th className="w-14 whitespace-nowrap px-4 py-3.5 text-center">No</th>
          <th className="whitespace-nowrap px-4 py-3.5">Institusi Pemohon</th>
          <th className="whitespace-nowrap px-4 py-3.5 text-center">Kuota Saat Ini</th>
          <th className="whitespace-nowrap px-4 py-3.5 text-center">Tambahan Diminta</th>
          <th className="whitespace-nowrap px-4 py-3.5 text-center">Target Kuota Baru</th>
          <th className="whitespace-nowrap px-4 py-3.5">Estimasi Tagihan Tambahan</th>
          <th className="whitespace-nowrap px-4 py-3.5">Catatan Lembaga</th>
          <th className="whitespace-nowrap px-4 py-3.5">Status</th>
          <th className="whitespace-nowrap px-4 py-3.5 text-right">Aksi Super Admin</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200/70 text-slate-700">
        {items
          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
          .map((req, index) => {
            const isPending = req.status === 'pending';
            const rowNumber = (currentPage - 1) * pageSize + index + 1;
            return (
              <tr key={req.id} className="group">
                <td className="whitespace-nowrap bg-slate-100 px-4 py-3 text-center font-semibold text-slate-600 transition-colors group-hover:bg-emerald-100/70">
                  {rowNumber}
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <div className="font-semibold text-slate-700">{req.tenant_name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    <span className="font-mono text-emerald-700">{getTenantHost(req.tenant_subdomain)}</span>
                    {req.tenant_phone && (
                      <a
                        href={`https://wa.me/${req.tenant_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-emerald-700 hover:underline"
                      >
                        WA PIC
                      </a>
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap bg-slate-50 px-4 py-3 text-center transition-colors group-hover:bg-emerald-50">
                  <span className="font-bold text-slate-700">{req.used}</span>
                  <span className="text-xs text-slate-400"> / {req.current_quota}</span>
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 text-center transition-colors group-hover:bg-emerald-50">
                  <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    +{req.requested_add} {req.member_label || 'Santri'}
                  </span>
                </td>

                <td className="whitespace-nowrap bg-slate-50 px-4 py-3 text-center font-bold text-slate-700 transition-colors group-hover:bg-emerald-50">
                  {req.requested_total}
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <div className="font-bold text-slate-700">{formatCurrency(req.estimated_price)}</div>
                  <div className="text-[10px] text-slate-400">per periode langganan</div>
                </td>

                <td className="max-w-xs truncate whitespace-nowrap bg-slate-50 px-4 py-3 text-xs text-slate-600 transition-colors group-hover:bg-emerald-50">
                  {req.note || <span className="italic text-slate-400">Tanpa catatan</span>}
                </td>

                <td className="whitespace-nowrap bg-white px-4 py-3 transition-colors group-hover:bg-emerald-50">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPending
                      ? 'Menunggu Review'
                      : req.status === 'approved'
                      ? 'Disetujui'
                      : req.status === 'rejected'
                      ? 'Ditolak'
                      : 'Dibatalkan'}
                  </span>
                </td>

                <td className="whitespace-nowrap bg-slate-50 px-4 py-3 text-right transition-colors group-hover:bg-emerald-50">
                  {isPending ? (
                    <div className="flex flex-nowrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(req.id)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        title="Setujui dan tambah kuota santri tenant ini secara otomatis"
                      >
                        <Check size={14} />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(req.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                        title="Tolak Pengajuan"
                        aria-label="Tolak pengajuan kuota"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">
                      {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString('id-ID') : 'Selesai'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        {items.length === 0 && (
          <tr>
            <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
              Tidak ada pengajuan tambah kuota dari tenant.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
