'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Lock, Sparkles, X } from 'lucide-react';
import { getSupportWhatsAppUrl } from '@/config/brand';

interface LmsUpsellProps {
  packageName?: string;
  tenantName?: string;
  forbiddenMessage?: string;
}

export default function LmsUpsell({ packageName, tenantName, forbiddenMessage }: LmsUpsellProps) {
  const plan = packageName || 'Paket Basic';
  const upgradeUrl = getSupportWhatsAppUrl(
    `Halo Super Admin, saya dari lembaga "${tenantName || 'Pesantren'}" ingin upgrade paket langganan untuk mengaktifkan fitur LMS Pembelajaran.`
  );

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm animate-fade-in motion-reduce:animate-none">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-amber-200/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-8 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/20 text-amber-600 shadow-inner">
            <Lock size={32} />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Sparkles size={13} className="text-amber-600" />
              <span>Fitur Modul Tambahan (Premium & Custom)</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Modul Pembelajaran LMS Terkunci</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pesantren / Lembaga Anda saat ini terdaftar dengan{' '}
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold text-slate-800">{plan}</span>
            </p>
          </div>
        </div>

        <a
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
        >
          <span>Upgrade Paket Sekarang</span>
          <ArrowRight size={16} />
        </a>
      </div>

      <div className="space-y-6 p-8">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6">
          <h4 className="mb-2 text-base font-bold text-slate-900">Mengapa fitur ini tidak dapat diakses?</h4>
          <p className="text-sm leading-relaxed text-slate-600">
            {forbiddenMessage ||
              `Fitur Learning Management System (LMS) seperti pembuatan video pembelajaran YouTube, kuis tajwid custom interaktif, audio podcast murottal, materi teks, serta jadwal sesi tatap muka Live Google Meet tidak termasuk dalam paket langganan Anda saat ini (${plan}).`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
            <div className="mb-4 flex items-center gap-2 font-bold text-slate-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <X size={12} />
              </div>
              <span>Paket Anda Saat Ini ({plan})</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2 text-slate-700">
                <Check size={14} className="shrink-0 text-emerald-500" />
                <span>Rekap & Penilaian Setoran Hafalan Santri</span>
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <Check size={14} className="shrink-0 text-emerald-500" />
                <span>Manajemen Guru, Santri, dan Kelas Halaqah</span>
              </li>
              {[
                'Modul Video Tutorial YouTube Santri (Nonaktif)',
                'Kuis Interaktif Custom Tajwid & Penilaian (Nonaktif)',
                'Jadwal Live Google Meet Tatap Muka (Nonaktif)',
                'Podcast & Audio Murottal Mandiri (Nonaktif)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 font-medium text-rose-500">
                  <X size={14} className="shrink-0 text-rose-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 p-6">
            <div className="mb-4 flex items-center gap-2 font-bold text-emerald-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Check size={12} />
              </div>
              <span>Paket Premium & Custom Flexi</span>
            </div>
            <ul className="space-y-2.5 text-xs font-medium text-slate-700">
              {[
                'Seluruh Fitur Inti Rekap Hafalan & Kelas',
                'Modul Pembelajaran Mandiri Santri Lengkap (LMS)',
                'Pembuat Soal Kuis Pilihan Ganda Tajwid Otomatis',
                'Integrasi Jadwal Google Meet & Zoom Tatap Muka',
                'Audio / Podcast Kajian & Materi Bacaan Santri',
                'Akses Interaktif Langsung di Aplikasi Mobile Santri',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-emerald-800">
                  <Check size={14} className="shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900">
            <span>Kembali ke Dashboard</span>
          </Link>
          <span className="text-xs text-slate-400">Ingin konsultasi paket lembaga Anda? Hubungi Super Admin kapan saja.</span>
        </div>
      </div>
    </div>
  );
}
