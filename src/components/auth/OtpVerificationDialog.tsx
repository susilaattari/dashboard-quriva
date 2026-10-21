'use client';

import React, { useRef } from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, Loader2, Mail, RotateCcw } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';

interface OtpVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  digits: string[];
  countdown: number;
  resendCooldown: number;
  sending: boolean;
  verifying: boolean;
  error: string;
  successMessage: string;
  devOtpCode: string | null;
  onDigitChange: (index: number, value: string) => void;
  onKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onResend: () => void;
  onVerify: () => void;
}

export default function OtpVerificationDialog({
  open,
  onClose,
  email,
  digits,
  countdown,
  resendCooldown,
  sending,
  verifying,
  error,
  successMessage,
  devOtpCode,
  onDigitChange,
  onKeyDown,
  onPaste,
  onResend,
  onVerify,
}: OtpVerificationDialogProps) {
  const firstOtpRef = useRef<HTMLInputElement>(null);
  const isExpired = countdown <= 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Verifikasi Email OTP"
      description="Masukkan 6 digit kode rahasia yang telah kami kirimkan ke email Anda."
      size="md"
      initialFocusRef={firstOtpRef}
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
            <Mail size={28} />
          </div>
          <div className="inline-block rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-emerald-800">
            {email}
          </div>
        </div>

        {process.env.NODE_ENV !== 'production' && devOtpCode && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
            <span>Mode Testing: Kode OTP Anda:</span>
            <span className="rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1 font-mono text-xs font-black tracking-widest text-amber-900">
              {devOtpCode}
            </span>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && !error && (
          <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <div>
          <div className="my-3 flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={index === 0 ? firstOtpRef : undefined}
                id={`otp-box-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1} dari 6 kode OTP`}
                maxLength={1}
                value={digit}
                onChange={(event) => onDigitChange(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(index, event)}
                onPaste={onPaste}
                className="h-14 w-11 rounded-xl border-2 border-slate-300 bg-white text-center font-mono text-xl font-black text-slate-900 shadow-sm transition-all focus:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:h-16 sm:w-12 sm:text-2xl"
              />
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500">
            <span className="flex items-center gap-1" aria-live="polite">
              <Clock size={13} className={isExpired ? 'text-rose-500' : 'text-slate-400'} />
              <span className={isExpired ? 'font-semibold text-rose-600' : ''}>
                {isExpired
                  ? 'Kode OTP kedaluwarsa'
                  : `Berlaku: ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
              </span>
            </span>
            <button
              type="button"
              onClick={onResend}
              disabled={resendCooldown > 0 || sending}
              className="flex items-center gap-1 font-semibold text-emerald-700 transition-colors hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <RotateCcw size={12} className={sending ? 'animate-spin' : ''} />
              <span>{resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang OTP'}</span>
            </button>
          </div>

          <p className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center text-[11px] leading-relaxed text-slate-500">
            <em>Belum melihat email?</em> Periksa tab <strong>Pembaruan/Promosi</strong> atau folder <strong>Spam</strong>, lalu klik <strong>"Bukan Spam"</strong>.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onVerify}
            disabled={verifying || digits.join('').length !== 6 || isExpired}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Memverifikasi & Mendaftarkan...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Verifikasi & Selesaikan Pendaftaran</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            Ubah Data Email atau Batal
          </button>
        </div>
      </div>
    </Dialog>
  );
}
