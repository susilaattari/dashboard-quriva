'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Clock, CreditCard, MessageCircle, Users } from 'lucide-react';
import { getTenantHost } from '@/config/brand';

interface RegistrationSuccessScreenProps {
  registration: any;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function RegistrationSuccessScreen({ registration }: RegistrationSuccessScreenProps) {
  const payment = registration.payment;
  const amount = payment?.amount_formatted || (registration.total_price ? formatCurrency(registration.total_price) : '-');

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl space-y-6 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm sm:p-10">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-600">
            <Clock size={32} />
          </div>
          <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            Menunggu Verifikasi & Persetujuan
          </span>
          <h2 className="text-2xl font-black text-slate-900">Pendaftaran Lembaga Diterima!</h2>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-600">
            Terima kasih telah mendaftarkan <strong className="text-slate-900">{registration.name}</strong>. Untuk
            mengaktifkan akun dan subdomain Anda, silakan selesaikan pembayaran transfer manual di bawah ini.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Subdomain Sistem:</span>
            <span className="font-mono font-bold text-emerald-700">{getTenantHost(registration.subdomain)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Model Lembaga:</span>
            <span className="font-semibold text-emerald-800">
              {registration.institution_type === 'non_pesantren' ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} /> Non-Pesantren (Mandiri / Tanpa Wali)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} /> Pesantren / Sekolah (Dengan Wali Santri)
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Paket Dipilih:</span>
            <span className="font-bold text-purple-700">{registration.package?.name || 'Paket Standar'}</span>
          </div>
          {registration.requested_santri_count && (
            <div className="flex items-center justify-between border-b border-slate-200 py-1">
              <span className="text-slate-500">Kapasitas Santri:</span>
              <span className="font-bold text-slate-800">{registration.requested_santri_count} Santri</span>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Total Pembayaran:</span>
            <span className="text-base font-black text-emerald-700">{amount}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Status Akun:</span>
            <span className="font-semibold text-amber-700">Menunggu Bukti Transfer</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <CreditCard size={14} className="text-emerald-600" />
            <span>Rekening Pembayaran Resmi Super Admin:</span>
          </h4>
          <div className="space-y-2">
            {payment?.bank_accounts?.map((account: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{account.bank}</div>
                  <div className="text-[11px] text-slate-500">{account.account_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-emerald-700">{account.account_number}</div>
                  <span className="text-[10px] text-slate-400">Salin No. Rek</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          {payment?.whatsapp_confirmation_url && (
            <a
              href={payment.whatsapp_confirmation_url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              <MessageCircle size={18} />
              <span>Kirim Bukti Transfer ke WhatsApp Super Admin</span>
            </a>
          )}

          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Buka Al-Qur'an & Kajian Gratis
            </Link>
            <Link
              href="/login"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ke Halaman Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
