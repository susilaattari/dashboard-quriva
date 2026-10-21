'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Trash2,
  ShieldAlert,
  MessageCircle,
} from 'lucide-react';

interface RequestQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RequestQuotaModal({
  isOpen,
  onClose,
  onSuccess,
}: RequestQuotaModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [quotaData, setQuotaData] = useState<{
    quota: number;
    used: number;
    member_label: string;
    plan_name?: string;
    pending?: any;
    history?: any[];
  } | null>(null);

  const [addCount, setAddCount] = useState<number | ''>(10);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchQuotaInfo();
    }
  }, [isOpen]);

  const fetchQuotaInfo = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/quota-requests/mine');
      setQuotaData(res.data?.data || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal memuat informasi kuota.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(addCount);
    if (!count || count < 1) {
      setErrorMsg('Jumlah tambahan minimal 1.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      await api.post('/quota-requests', {
        add_santri: count,
        note,
      });
      setSuccessMsg('Pengajuan tambah kuota berhasil dikirim. Menunggu verifikasi tim pusat.');
      setNote('');
      fetchQuotaInfo();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal mengirim pengajuan kuota.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPending = async (requestId: number) => {
    if (!confirm('Batalkan pengajuan penambahan kuota ini?')) return;
    try {
      setCancelling(true);
      setErrorMsg('');
      await api.put(`/quota-requests/${requestId}/cancel`);
      fetchQuotaInfo();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal membatalkan pengajuan.');
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (val?: number | string) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (!isOpen) return null;

  const label = quotaData?.member_label || 'Santri';
  const currentQuota = quotaData?.quota ?? 10;
  const used = quotaData?.used ?? 0;
  const newTarget = currentQuota + (Number(addCount) || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-600/30 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-700">
              Pengajuan Tambah Kuota {label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkatkan kapasitas {label.toLowerCase()} institusi Anda saat sedang berlangganan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Memuat status kuota...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Status cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-100">
                <div className="text-[11px] text-slate-500">{label} Terdaftar</div>
                <div className="text-lg font-bold text-slate-700">{used}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100">
                <div className="text-[11px] text-slate-500">Kuota Saat Ini</div>
                <div className="text-lg font-bold text-slate-700">{currentQuota}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] text-emerald-700">Kuota Baru</div>
                <div className="text-lg font-bold text-emerald-700">{newTarget}</div>
              </div>
            </div>

            {/* Pending Request Alert */}
            {quotaData?.pending ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800 text-xs">
                  <Clock size={16} className="shrink-0" />
                  <span>Pengajuan Sedang Menunggu Verifikasi Tim Pusat</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Permintaan tambahan <strong>+{quotaData.pending.requested_add} {label}</strong> (total kuota menjadi {quotaData.pending.requested_total}) sedang ditinjau. Estimasi tagihan tambahan:{' '}
                  <strong>{formatCurrency(quotaData.pending.estimated_price)}</strong>.
                </p>
                {quotaData.pending.note && (
                  <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-amber-100 italic">
                    "{quotaData.pending.note}"
                  </p>
                )}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCancelPending(quotaData.pending.id)}
                    disabled={cancelling}
                    className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {cancelling ? 'Membatalkan...' : 'Batalkan Pengajuan'}
                  </button>
                </div>
              </div>
            ) : (
              /* Request Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Jumlah {label} Tambahan yang Diinginkan
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={addCount}
                    onChange={(e) => setAddCount(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[5, 10, 25, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAddCount(n)}
                        className={`h-7 px-3 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                          Number(addCount) === n
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Catatan / Keperluan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Contoh: Penerimaan santri baru halaqah angkatan tahun ajaran baru"
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !Number(addCount)}
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{submitting ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Riwayat Pengajuan Sebelumnya */}
            {quotaData?.history && quotaData.history.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">
                  Riwayat Pengajuan Kuota
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {quotaData.history.map((h: any) => (
                    <div key={h.id} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="font-semibold text-slate-700">
                          +{h.requested_add} {label} (Total: {h.requested_total})
                        </div>
                        <div className="text-slate-400">
                          {new Date(h.created_at).toLocaleDateString('id-ID')}
                          {h.review_note && ` • Catatan: ${h.review_note}`}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          h.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.status === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : h.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {h.status === 'approved'
                          ? 'Disetujui'
                          : h.status === 'rejected'
                          ? 'Ditolak'
                          : h.status === 'pending'
                          ? 'Menunggu'
                          : 'Dibatalkan'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
