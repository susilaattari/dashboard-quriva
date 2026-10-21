'use client';

import React from 'react';
import { CreditCard, MessageCircle } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';

interface PublicUpgradeDialogProps {
  open: boolean;
  pkg: any;
  tenant: { name: string; subdomain: string } | null;
  bankTransferInfo: string;
  whatsappUrl: string;
  onClose: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );
}

export default function PublicUpgradeDialog({
  open,
  pkg,
  tenant,
  bankTransferInfo,
  whatsappUrl,
  onClose,
}: PublicUpgradeDialogProps) {
  if (!pkg) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={pkg.name}
      description={`Konfirmasi upgrade untuk institusi ${tenant?.name || 'Institusi Pengguna'}${
        tenant?.subdomain ? ` (${tenant.subdomain})` : ''
      }.`}
      size="md"
    >
      <div className="space-y-5">
        <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          Konfirmasi Prosedur Upgrade
        </span>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Biaya Paket:</span>
            <span className="text-xl font-black text-emerald-700">{formatCurrency(Number(pkg.price))}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-700">
            <span>Durasi Masa Aktif:</span>
            <strong>{pkg.duration_months} Bulan</strong>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Kapasitas Santri:</span>
            <strong>
              {pkg.max_santri > 9999 || pkg.max_santri === 0 ? 'Tanpa Batas' : `${pkg.max_santri} Santri`}
            </strong>
          </div>
        </div>

        {bankTransferInfo && (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CreditCard size={15} className="text-emerald-700" />
              <span>Rekening Transfer Resmi Superadmin:</span>
            </div>
            <div className="whitespace-pre-line rounded-xl border border-emerald-200 bg-white p-3 font-mono text-xs text-slate-800 shadow-sm">
              {bankTransferInfo}
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
          >
            <MessageCircle size={18} />
            <span>Konfirmasi Upgrade via WhatsApp Superadmin</span>
          </a>
          <p className="text-center text-[11px] text-slate-500">
            Pesan WhatsApp otomatis sudah disiapkan berisi nama institusi dan paket yang dipilih.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
