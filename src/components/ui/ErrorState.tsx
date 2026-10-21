import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorState({
  title = 'Gagal memuat data',
  description = 'Terjadi kendala saat menghubungi server. Periksa koneksi Anda lalu coba lagi.',
  onRetry,
  retryLabel = 'Coba lagi',
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`} role="alert">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
