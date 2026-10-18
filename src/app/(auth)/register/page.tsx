'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import {
  BookOpen,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle,
  Clock,
  ExternalLink,
  Users,
  Calculator,
  Calendar,
  Building2,
  HeartHandshake,
  Info,
  RotateCcw,
  KeyRound,
  X,
  Loader2,
} from 'lucide-react';

interface PackageItem {
  id: number;
  name: string;
  code: string;
  price: number;
  max_santri: number;
  duration_months?: number;
  extra_price_per_user?: number;
  features: Record<string, any>;
}

export default function RegisterTenantPage() {
  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Form states
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [requestedSantriCount, setRequestedSantriCount] = useState<number>(10);
  const [institutionType, setInstitutionType] = useState<'pesantren' | 'non_pesantren'>('pesantren');
  const [institutionName, setInstitutionName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [address, setAddress] = useState('');

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [paymentProofNote, setPaymentProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Success state
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0); // 30s resend timer
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (showOtpModal && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpCountdown]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    api.get('/packages')
      .then((res) => {
        const pkgs = res.data?.data || [];
        setPackages(pkgs);
        if (pkgs.length > 0) {
          // If URL param ?plan=... is present
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const planCode = params.get('plan');
            const found = pkgs.find((p: PackageItem) => p.code === planCode || String(p.id) === planCode);
            if (found) {
              setSelectedPlanId(found.id);
            } else {
              setSelectedPlanId(pkgs[0].id);
            }
          } else {
            setSelectedPlanId(pkgs[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load packages:', err);
      })
      .finally(() => {
        setLoadingPackages(false);
      });
  }, []);

  const selectedPackage = packages.find((p) => p.id === selectedPlanId);

  // Sync requestedSantriCount if initial or smaller than base
  useEffect(() => {
    if (selectedPackage) {
      const base = Number(selectedPackage.max_santri || 10);
      setRequestedSantriCount((prev) => (prev < base ? base : prev));
    }
  }, [selectedPlanId, selectedPackage]);

  // Dynamic calculations
  const isPerUser = selectedPackage?.features?.pricing_type === 'per_user';
  const baseCapacity = Number(selectedPackage?.max_santri || 10);
  const basePrice = Number(selectedPackage?.price || 0);
  const extraPrice = Number(selectedPackage?.extra_price_per_user ?? selectedPackage?.features?.extra_price_per_user ?? 0);
  const durationMonths = Number(selectedPackage?.duration_months ?? selectedPackage?.features?.duration_months ?? 1);
  const extraSantri = Math.max(0, requestedSantriCount - baseCapacity);
  const calculatedTotalPrice = isPerUser
    ? requestedSantriCount * basePrice
    : basePrice + extraSantri * extraPrice;

  const durationLabel = isPerUser
    ? 'per santri / bulan'
    : durationMonths === 12
    ? '1 Tahun (Tahunan)'
    : durationMonths === 6
    ? '6 Bulan'
    : '1 Bulan';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubdomainChange = (val: string) => {
    // Only allow lowercase alphanumeric and hyphens
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(cleaned);
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];
    updated[index] = clean.slice(-1);
    setOtpDigits(updated);
    setOtpError('');

    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);
    setOtpError('');
    const targetIdx = Math.min(pasted.length, 5);
    const targetInput = document.getElementById(`otp-box-${targetIdx}`);
    if (targetInput) (targetInput as HTMLInputElement).focus();
  };

  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Pre-validations
    if (!institutionName.trim()) {
      setErrorMsg('Nama institusi/lembaga wajib diisi.');
      return;
    }
    if (!subdomain.trim() || subdomain.length < 3) {
      setErrorMsg('Subdomain minimal 3 karakter (huruf, angka, atau strip).');
      return;
    }
    if (!adminName.trim()) {
      setErrorMsg('Nama penanggung jawab wajib diisi.');
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setErrorMsg('Email penanggung jawab tidak valid.');
      return;
    }
    if (!adminPhone.trim() || adminPhone.length < 9) {
      setErrorMsg('Nomor WhatsApp aktif wajib diisi.');
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setErrorMsg('Kata sandi admin minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    setOtpError('');

    try {
      const res = await api.post('/auth/send-otp', {
        email: adminEmail.trim().toLowerCase(),
        type: 'registration',
      });
      const data = res.data?.data || {};
      if (data.dev_otp) {
        setDevOtpCode(data.dev_otp);
      } else {
        setDevOtpCode(null);
      }
      setOtpCountdown(300);
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSuccessMsg(`Kode OTP 6 digit telah dikirim ke ${adminEmail.trim().toLowerCase()}`);
      setShowOtpModal(true);
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.message || 'Gagal mengirim kode verifikasi OTP.';
      setErrorMsg(rawMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpSending) return;
    setOtpSending(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/send-otp', {
        email: adminEmail.trim().toLowerCase(),
        type: 'registration',
      });
      const data = res.data?.data || {};
      if (data.dev_otp) {
        setDevOtpCode(data.dev_otp);
      }
      setOtpCountdown(300);
      setResendCooldown(30);
      setOtpSuccessMsg('Kode verifikasi baru berhasil dikirim ulang ke email Anda.');
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.message || 'Gagal mengirim ulang kode OTP.';
      setOtpError(rawMsg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      setOtpError('Harap masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      // 1. Verify OTP
      await api.post('/auth/verify-otp', {
        email: adminEmail.trim().toLowerCase(),
        otp_code: fullOtp,
        type: 'registration',
      });

      // 2. Submit Tenant Registration with verified OTP
      const payload = {
        name: institutionName,
        subdomain: subdomain.trim().toLowerCase(),
        plan_id: selectedPlanId,
        requested_santri_count: requestedSantriCount,
        admin_name: adminName,
        admin_email: adminEmail.trim().toLowerCase(),
        admin_phone: adminPhone.trim(),
        admin_password: adminPassword,
        address: address.trim(),
        payment_proof_note: paymentProofNote.trim(),
        payment_method: 'manual_transfer',
        institution_type: institutionType,
        has_wali: institutionType === 'pesantren',
        member_label: institutionType === 'non_pesantren' ? 'Peserta' : 'Santri',
        otp_code: fullOtp,
      };

      const res = await api.post('/tenants/register', payload);
      setShowOtpModal(false);
      setRegistrationSuccess(res.data?.data || res.data);
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.message || 'Verifikasi kode OTP atau pendaftaran gagal.';
      if (rawMsg.includes('subdomain')) {
        setErrorMsg(`Subdomain '${subdomain}' sudah digunakan. Silakan pilih subdomain lain.`);
        setShowOtpModal(false);
      } else if (rawMsg.includes('Email') || rawMsg.includes('email')) {
        setErrorMsg(`Email '${adminEmail}' sudah terdaftar. Silakan gunakan email lain atau masuk.`);
        setShowOtpModal(false);
      } else {
        setOtpError(rawMsg);
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  // If already registered successfully, show confirmation screen
  if (registrationSuccess) {
    const payment = registrationSuccess.payment;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Clock size={32} />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider inline-block">
              Menunggu Verifikasi & Persetujuan
            </span>
            <h2 className="text-2xl font-black text-white">
              Pendaftaran Lembaga Diterima!
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Terima kasih telah mendaftarkan <strong className="text-slate-200">{registrationSuccess.name}</strong>.
              Untuk mengaktifkan akun dan subdomain Anda, silakan selesaikan pembayaran transfer manual di bawah ini.
            </p>
          </div>

          {/* Registration Summary Card */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Subdomain Sistem:</span>
              <span className="font-mono font-bold text-emerald-400">
                {registrationSuccess.subdomain}.tahfidzapp.com
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Model Lembaga:</span>
              <span className="font-semibold text-emerald-400">
                {registrationSuccess.institution_type === 'non_pesantren'
                  ? '👥 Non-Pesantren (Mandiri / Tanpa Wali)'
                  : '🏛️ Pesantren / Sekolah (Dengan Wali Santri)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Paket Dipilih:</span>
              <span className="font-bold text-purple-400">
                {registrationSuccess.package?.name || 'Paket Standar'}
              </span>
            </div>
            {registrationSuccess.requested_santri_count && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Kapasitas Santri:</span>
                <span className="font-bold text-emerald-400">
                  {registrationSuccess.requested_santri_count} Santri
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Total Pembayaran:</span>
              <span className="text-base font-black text-amber-400">
                {payment?.amount_formatted || 'Rp 50.000'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Status Akun:</span>
              <span className="font-semibold text-amber-300">Menunggu Bukti Transfer</span>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CreditCard size={14} className="text-emerald-400" />
              <span>Rekening Pembayaran Resmi Super Admin:</span>
            </h4>
            <div className="space-y-2">
              {payment?.bank_accounts?.map((acc: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">{acc.bank}</div>
                    <div className="text-[11px] text-slate-400">{acc.account_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400 text-sm">{acc.account_number}</div>
                    <span className="text-[10px] text-slate-400">Salin No. Rek</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button: WhatsApp Super Admin */}
          <div className="pt-4 space-y-3">
            {payment?.whatsapp_confirmation_url && (
              <a
                href={payment.whatsapp_confirmation_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle size={18} />
                <span>Kirim Bukti Transfer ke WhatsApp Super Admin</span>
              </a>
            )}

            <div className="flex gap-2">
              <Link
                href="/"
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold text-center transition-colors"
              >
                Buka Al-Qur'an & Kajian Gratis
              </Link>
              <Link
                href="/login"
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold text-center transition-colors"
              >
                Ke Halaman Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Back & Logo */}
      <div className="max-w-3xl w-full mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Beranda (Fitur Gratis)</span>
        </Link>
        <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
          Sudah punya akun? <strong className="text-emerald-400 underline">Masuk di sini</strong>
        </Link>
      </div>

      <div className="max-w-3xl w-full mx-auto bg-slate-900 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles size={14} />
            <span>Pendaftaran Mandiri Mitra Pesantren & Sekolah</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Daftarkan Lembaga Anda ke Ekosistem Tahfidz
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pilih paket langganan, tentukan subdomain institusi, dan mulai digitalisasi hafalan santri Anda.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleInitiateRegistration} className="space-y-8">
          {/* STEP 1: PILIH PAKET LANGGANAN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                Pilih Paket Langganan SaaS
              </label>
              <span className="text-[11px] text-slate-400">Tarif transparan & fitur lengkap</span>
            </div>

            {loadingPackages ? (
              <div className="p-8 text-center text-xs text-slate-400">Memuat daftar paket langganan...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPlanId === pkg.id;
                  const isPkgPerUser = pkg.features?.pricing_type === 'per_user';
                  const d = Number(pkg.duration_months || pkg.features?.duration_months || 1);
                  const extra = pkg.extra_price_per_user !== undefined ? Number(pkg.extra_price_per_user) : Number(pkg.features?.extra_price_per_user || 0);
                  const pkgBase = Number(pkg.max_santri || 10);
                  const pkgBasePrice = Number(pkg.price || 0);

                  // Realtime calculation based on requestedSantriCount
                  const pkgExtraSantri = isPkgPerUser ? 0 : Math.max(0, requestedSantriCount - pkgBase);
                  const liveCardPrice = isPkgPerUser
                    ? requestedSantriCount * pkgBasePrice
                    : pkgBasePrice + pkgExtraSantri * extra;

                  const badge = isPkgPerUser
                    ? 'Custom'
                    : d === 12
                    ? '1 Tahun'
                    : d === 6
                    ? '6 Bulan'
                    : '1 Bulan';

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPlanId(pkg.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/60'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                          {pkg.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                          {badge}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1 line-clamp-1">{pkg.name}</div>
                      
                      {/* Realtime dynamic price in card */}
                      <div className="text-base font-black text-amber-400 mt-2">
                        {formatCurrency(liveCardPrice)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          {isPkgPerUser ? ' / bln' : d === 12 ? ' / thn' : d === 6 ? ' / 6 bln' : ' / bln'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1">
                        Kuota: <strong className="text-slate-300">{isPkgPerUser ? 'Custom' : `${pkgBase} Santri`}</strong>
                      </div>

                      {/* Realtime breakdown badge in card */}
                      {!isPkgPerUser && pkgExtraSantri > 0 ? (
                        <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                          Termasuk {pkgExtraSantri} santri tambahan (+{formatCurrency(pkgExtraSantri * extra)})
                        </div>
                      ) : !isPkgPerUser && extra > 0 ? (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          +{formatCurrency(extra)} / santri tambah
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dynamic Santri Capacity & Investment Calculator */}
            {selectedPackage && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users size={15} className="text-emerald-400" />
                      Jumlah Santri Lembaga Anda
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isPerUser
                        ? 'Biaya dihitung murni per santri per bulan'
                        : `Kuota dasar paket ini adalah ${baseCapacity} santri. Jika santri lebih dari ${baseCapacity}, dikenakan +${formatCurrency(extraPrice)} / santri.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setRequestedSantriCount((prev) => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={requestedSantriCount}
                      onChange={(e) => setRequestedSantriCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 text-center bg-slate-950 border border-slate-700 rounded-xl py-1.5 text-sm font-bold text-white focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setRequestedSantriCount((prev) => prev + 1)}
                      className="w-9 h-9 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400">Rincian Perhitungan Biaya ({durationLabel}):</span>
                    <div className="text-slate-300 font-medium">
                      {isPerUser ? (
                        <span>{requestedSantriCount} Santri × {formatCurrency(basePrice)} / santri</span>
                      ) : extraSantri > 0 ? (
                        <span>
                          Dasar ({baseCapacity} Santri): {formatCurrency(basePrice)} + Tambahan ({extraSantri} Santri × {formatCurrency(extraPrice)}): {formatCurrency(extraSantri * extraPrice)}
                        </span>
                      ) : (
                        <span>Semua santri termasuk dalam kuota dasar ({baseCapacity} Santri)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Biaya:</span>
                    <span className="text-lg font-black text-amber-400">
                      {formatCurrency(calculatedTotalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: MODEL LEMBAGA & IDENTITAS */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                Kategori Lembaga & Model Pendampingan
              </label>
              <span className="text-[11px] text-slate-400">Pilih model yang sesuai lembaga Anda</span>
            </div>

            {/* Institution Type Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setInstitutionType('pesantren')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  institutionType === 'pesantren'
                    ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/60'
                }`}
              >
                {institutionType === 'pesantren' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                  <Building2 size={16} />
                  <span>Pesantren / Sekolah / Yayasan</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Ada pendampingan <strong>Orang Tua / Wali Santri</strong>. Portal monitoring wali & notifikasi hafalan diaktifkan.
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                  <HeartHandshake size={11} /> Model dengan Wali Santri
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInstitutionType('non_pesantren')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  institutionType === 'non_pesantren'
                    ? 'border-cyan-500 bg-cyan-950/40 ring-2 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/60'
                }`}
              >
                {institutionType === 'non_pesantren' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
                  <Users size={16} />
                  <span>Non-Pesantren (Komunitas / Mandiri)</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Peserta <strong>belajar mandiri / dewasa</strong> tanpa wali. Akses langsung dipegang peserta tanpa akun wali.
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300">
                  <Sparkles size={11} /> Mandiri (Tanpa Wali)
                </div>
              </button>
            </div>

            {institutionType === 'non_pesantren' && (
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 rounded-xl text-xs flex items-center gap-2.5">
                <Info size={16} className="text-cyan-400 shrink-0" />
                <span>
                  <strong>Mode Non-Pesantren Aktif:</strong> Sistem akan disesuaikan otomatis untuk peserta mandiri (tanpa kewajiban data akun wali santri).
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Institusi / Lembaga / Komunitas *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    institutionType === 'non_pesantren'
                      ? 'Misal: Komunitas Tahfidz Karyawan / Majelis Al-Fatihah'
                      : 'Misal: Pesantren Tahfidz Al-Hikmah'
                  }
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subdomain Akses Web *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="alhikmah"
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className="flex-1 bg-slate-950 border border-r-0 border-slate-700 rounded-l-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="bg-slate-800 border border-slate-700 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono">
                    .tahfidzapp.com
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat / Kota Domisili (Opsional)
              </label>
              <input
                type="text"
                placeholder="Jl. Raya Soreang No. 45, Bandung, Jawa Barat"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* STEP 3: AKUN PENANGGUNG JAWAB (ADMIN) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
              Akun Administrator & Kontak WhatsApp
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Penanggung Jawab / Pimpinan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ustadz Abdullah, Lc."
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan untuk konfirmasi aktivasi akun dan pengiriman bukti transfer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Login Admin *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@pesantren.sch.id"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Akun (Password) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: METODE PEMBAYARAN MANUAL */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">4</span>
              Skema Pembayaran Transfer Manual
            </label>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Tagihan Awal ({selectedPackage?.name || 'Paket Standar'}):</span>
                <span className="text-base font-black text-amber-400">
                  {formatCurrency(selectedPackage?.price || 299000)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pembayaran dilakukan via transfer manual ke rekening bank Super Admin. Setelah mendaftar, Anda akan diarahkan untuk mengirimkan bukti transfer via WhatsApp agar admin memverifikasi dan mengaktifkan subdomain Anda.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Catatan Transfer / Bank Pengirim (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer BSI an. Abdullah Rp 299.000"
                  value={paymentProofNote}
                  onChange={(e) => setPaymentProofNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Mengirim Kode OTP ke Email...</span>
                </>
              ) : (
                <>
                  <Mail size={18} />
                  <span>Verifikasi Email & Lanjutkan Pendaftaran</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              Kode OTP 6 digit akan dikirimkan secara instan dan gratis ke email Anda untuk verifikasi.
            </p>
          </div>
        </form>
      </div>

      {/* MODAL VERIFIKASI OTP 6 DIGIT */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header Icon */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-black text-white">Verifikasi Email OTP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Masukkan 6 digit kode rahasia yang telah kami kirimkan ke email Anda:
              </p>
              <div className="inline-block px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-xs font-mono font-semibold text-emerald-400">
                {adminEmail}
              </div>
            </div>

            {/* Dev Mode Helper Badge if simulated */}
            {devOtpCode && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 flex items-center justify-between">
                <span>⚡ Mode Cepat (Testing): Kode OTP Anda:</span>
                <span className="font-mono font-black text-xs text-amber-200 px-2.5 py-1 bg-amber-500/25 rounded-md tracking-widest border border-amber-500/40">
                  {devOtpCode}
                </span>
              </div>
            )}

            {/* Status Messages */}
            {otpError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{otpError}</span>
              </div>
            )}
            {otpSuccessMsg && !otpError && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>{otpSuccessMsg}</span>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div>
              <div className="flex justify-center gap-2 sm:gap-2.5 my-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-box-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    autoFocus={index === 0}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono bg-slate-950 border-2 border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  <span>
                    Berlaku: {Math.floor(otpCountdown / 60)}:
                    {(otpCountdown % 60).toString().padStart(2, '0')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || otpSending}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <RotateCcw size={12} className={otpSending ? 'animate-spin' : ''} />
                  <span>
                    {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang OTP'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400/80 mt-2.5 text-center leading-relaxed bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                💡 <em>Belum melihat email?</em> Periksa tab <strong>Pembaruan/Promosi</strong> atau folder <strong>Spam</strong>, lalu klik <strong>"Bukan Spam"</strong>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleVerifyOtpAndRegister}
                disabled={otpVerifying || otpDigits.join('').length !== 6}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpVerifying ? (
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
                onClick={() => setShowOtpModal(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Ubah Data Email atau Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
