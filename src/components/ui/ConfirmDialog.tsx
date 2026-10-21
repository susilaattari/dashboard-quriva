'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Dialog from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmClasses =
    variant === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500';

  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : <AlertTriangle size={16} />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </Dialog>
  );
}
