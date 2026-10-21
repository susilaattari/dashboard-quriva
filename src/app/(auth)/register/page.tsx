'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { BRAND, getTenantHost } from '@/config/brand';
import OtpVerificationDialog from '@/components/auth/OtpVerificationDialog';
import RegistrationSuccessScreen from '@/components/auth/RegistrationSuccessScreen';
import {
  BookOpen,
  Building,
  Check,
  ChevronRight,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  Users,
  Calculator,
  Calendar,
  Building2,
  HeartHandshake,
  Info,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

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

  const checkSubdomainAvailability = async (value: string) => {
    if (!value || value.length < 3) return false;

    setCheckingSubdomain(true);
    try {
      await api.get(`/tenants/public/${value}`);
      setFieldErrors((prev) => ({
        ...prev,
        subdomain: 'Subdomain ini sudah digunakan. Silakan pilih subdomain lain.',
      }));
      return false;
    } catch (err: any) {
      if (err.response?.status === 404) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.subdomain;
          return next;
        });
        return true;
      }
      setFieldErrors((prev) => ({
        ...prev,
        subdomain: 'Gagal memeriksa ketersediaan subdomain. Coba lagi.',
      }));
      return false;
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const errors: Record<string, string> = {};
    if (!institutionName.trim()) errors.institutionName = 'Nama institusi/lembaga wajib diisi.';
    if (!subdomain.trim() || subdomain.length < 3) {
      errors.subdomain = 'Subdomain minimal 3 karakter (huruf, angka, atau strip).';
    }
    if (!adminName.trim()) errors.adminName = 'Nama penanggung jawab wajib diisi.';
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      errors.adminEmail = 'Email penanggung jawab tidak valid.';
    }
    if (!adminPhone.trim() || adminPhone.length < 9) {
      errors.adminPhone = 'Nomor WhatsApp aktif wajib diisi (minimal 9 digit).';
    }
    if (!adminPassword || adminPassword.length < 6) {
      errors.adminPassword = 'Kata sandi admin minimal 6 karakter.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstField = ['institutionName', 'subdomain', 'adminName', 'adminEmail', 'adminPhone', 'adminPassword'].find(
        (field) => errors[field]
      );
      if (firstField) document.getElementById(firstField)?.focus();
      return;
    }

    setFieldErrors({});
    const subdomainAvailable = await checkSubdomainAvailability(subdomain.trim());
    if (!subdomainAvailable) {
      document.getElementById('subdomain')?.focus();
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
      setDevOtpCode(process.env.NODE_ENV !== 'production' ? data.dev_otp || null : null);
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
      setDevOtpCode(process.env.NODE_ENV === 'production' ? null : data.dev_otp || null);
      setOtpDigits(['', '', '', '', '', '']);
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
    if (otpCountdown <= 0) {
      setOtpError('Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru.');
      return;
    }

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

  if (registrationSuccess) {
    return <RegistrationSuccessScreen registration={registrationSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Back & Logo */}
      <div className="max-w-3xl w-full mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Beranda (Fitur Gratis)</span>
        </Link>
        <Link href="/login" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
          Sudah punya akun? <strong className="text-emerald-700 underline font-bold">Masuk di sini</strong>
        </Link>
      </div>

      <div className="max-w-3xl w-full mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Pendaftaran Mandiri Mitra Pesantren & Sekolah</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Daftarkan Lembaga Anda ke Ekosistem Tahfidz
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pilih paket langganan, tentukan subdomain institusi, dan mulai digitalisasi hafalan santri Anda.
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleInitiateRegistration} noValidate className="space-y-8">
          {/* STEP 1: PILIH PAKET LANGGANAN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">1</span>
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
                          ? 'border-2 border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold uppercase text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          {pkg.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {badge}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{pkg.name}</div>
                      
                      {/* Realtime dynamic price in card */}
                      <div className="text-base font-black text-slate-900 mt-2">
                        {formatCurrency(liveCardPrice)}
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          {isPkgPerUser ? ' / bln' : d === 12 ? ' / thn' : d === 6 ? ' / 6 bln' : ' / bln'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        Kuota: <strong className="text-slate-800">{isPkgPerUser ? 'Custom' : `${pkgBase} Santri`}</strong>
                      </div>

                      {/* Realtime breakdown badge in card */}
                      {!isPkgPerUser && pkgExtraSantri > 0 ? (
                        <div className="text-[10px] text-emerald-700 mt-0.5 font-semibold">
                          Termasuk {pkgExtraSantri} santri tambahan (+{formatCurrency(pkgExtraSantri * extra)})
                        </div>
                      ) : !isPkgPerUser && extra > 0 ? (
                        <div className="text-[10px] text-slate-400 mt-0.5">
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
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Users size={15} className="text-emerald-600" />
                      Jumlah Santri Lembaga Anda
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isPerUser
                        ? 'Biaya dihitung murni per santri per bulan'
                        : `Kuota dasar paket ini adalah ${baseCapacity} santri. Jika santri lebih dari ${baseCapacity}, dikenakan +${formatCurrency(extraPrice)} / santri.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setRequestedSantriCount((prev) => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer border border-slate-300 shadow-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={requestedSantriCount}
                      onChange={(e) => setRequestedSantriCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 text-center bg-white border border-slate-300 rounded-xl py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setRequestedSantriCount((prev) => prev + 1)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer border border-slate-300 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-slate-500">Rincian Perhitungan Biaya ({durationLabel}):</span>
                    <div className="text-slate-800 font-medium">
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

                  <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Biaya:</span>
                    <span className="text-lg font-black text-emerald-700">
                      {formatCurrency(calculatedTotalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: MODEL LEMBAGA & IDENTITAS */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</span>
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
                    ? 'border-2 border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {institutionType === 'pesantren' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                  <Building2 size={16} />
                  <span>Pesantren / Sekolah / Yayasan</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Ada pendampingan <strong>Orang Tua / Wali Santri</strong>. Portal monitoring wali & notifikasi hafalan diaktifkan.
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800">
                  <HeartHandshake size={11} /> Model dengan Wali Santri
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInstitutionType('non_pesantren')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  institutionType === 'non_pesantren'
                    ? 'border-2 border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-600/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {institutionType === 'non_pesantren' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 mb-1">
                  <Users size={16} />
                  <span>Non-Pesantren (Komunitas / Mandiri)</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Peserta <strong>belajar mandiri / dewasa</strong> tanpa wali. Akses langsung dipegang peserta tanpa akun wali.
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100/70 text-cyan-800">
                  <Sparkles size={11} /> Mandiri (Tanpa Wali)
                </div>
              </button>
            </div>

            {institutionType === 'non_pesantren' && (
              <div className="p-3.5 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-xl text-xs flex items-center gap-2.5">
                <Info size={16} className="text-cyan-600 shrink-0" />
                <span>
                  <strong>Mode Non-Pesantren Aktif:</strong> Sistem akan disesuaikan otomatis untuk peserta mandiri (tanpa kewajiban data akun wali santri).
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Institusi / Lembaga / Komunitas *
                </label>
                <input
                  id="institutionName"
                  type="text"
                  required
                  autoComplete="organization"
                  aria-invalid={Boolean(fieldErrors.institutionName)}
                  aria-describedby={fieldErrors.institutionName ? 'institutionName-error' : undefined}
                  placeholder={
                    institutionType === 'non_pesantren'
                      ? 'Misal: Komunitas Tahfidz Karyawan / Majelis Al-Fatihah'
                      : 'Misal: Pesantren Tahfidz Al-Hikmah'
                  }
                  value={institutionName}
                  onChange={(e) => {
                    setInstitutionName(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.institutionName;
                      return next;
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                {fieldErrors.institutionName && (
                  <p id="institutionName-error" role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {fieldErrors.institutionName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subdomain Akses Web *
                </label>
                <div className="flex items-center">
                  <input
                    id="subdomain"
                    type="text"
                    required
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.subdomain)}
                    aria-describedby={fieldErrors.subdomain ? 'subdomain-error' : undefined}
                    placeholder="alhikmah"
                    value={subdomain}
                    onChange={(e) => {
                      handleSubdomainChange(e.target.value);
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.subdomain;
                        return next;
                      });
                    }}
                    onBlur={() => {
                      if (subdomain.length >= 3) void checkSubdomainAvailability(subdomain);
                    }}
                    className="flex-1 bg-white border border-r-0 border-slate-300 rounded-l-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <span className="bg-slate-100 border border-slate-300 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-600 font-mono font-medium">
                    .{BRAND.rootDomain}
                  </span>
                </div>
                {checkingSubdomain && (
                  <p className="mt-1.5 text-[11px] text-slate-500">Memeriksa ketersediaan subdomain...</p>
                )}
                {fieldErrors.subdomain && (
                  <p id="subdomain-error" role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {fieldErrors.subdomain}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat / Kota Domisili (Opsional)
              </label>
              <input
                type="text"
                placeholder="Jl. Raya Soreang No. 45, Bandung, Jawa Barat"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* STEP 3: AKUN PENANGGUNG JAWAB (ADMIN) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">3</span>
              Akun Administrator & Kontak WhatsApp
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penanggung Jawab / Pimpinan *
                </label>
                <input
                  id="adminName"
                  type="text"
                  required
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.adminName)}
                  aria-describedby={fieldErrors.adminName ? 'adminName-error' : undefined}
                  placeholder="Ustadz Abdullah, Lc."
                  value={adminName}
                  onChange={(e) => {
                    setAdminName(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.adminName;
                      return next;
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                {fieldErrors.adminName && (
                  <p id="adminName-error" role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {fieldErrors.adminName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  id="adminPhone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={Boolean(fieldErrors.adminPhone)}
                  aria-describedby={fieldErrors.adminPhone ? 'adminPhone-error' : undefined}
                  placeholder="081234567890"
                  value={adminPhone}
                  onChange={(e) => {
                    setAdminPhone(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.adminPhone;
                      return next;
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                {fieldErrors.adminPhone ? (
                  <p id="adminPhone-error" role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {fieldErrors.adminPhone}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Digunakan untuk konfirmasi aktivasi akun dan pengiriman bukti transfer.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Login Admin *
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  required
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.adminEmail)}
                  aria-describedby={fieldErrors.adminEmail ? 'adminEmail-error' : undefined}
                  placeholder="admin@pesantren.sch.id"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.adminEmail;
                      return next;
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                {fieldErrors.adminEmail && (
                  <p id="adminEmail-error" role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {fieldErrors.adminEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Akun (Password) *
                </label>
                <div className="relative">
                  <input
                    id="adminPassword"
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    aria-invalid={Boolean(fieldErrors.adminPassword)}
                    aria-describedby={fieldErrors.adminPassword ? 'adminPassword-error' : undefined}
                    placeholder="Minimal 6 karakter"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.adminPassword;
                        return next;
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pr-12 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    aria-label={showAdminPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800"
                  >
                    {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.adminPassword && (
                  <p id="adminPassword-error" role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {fieldErrors.adminPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 4: METODE PEMBAYARAN MANUAL */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">4</span>
              Skema Pembayaran Transfer Manual
            </label>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Total Tagihan Awal ({selectedPackage?.name || 'Paket Standar'}):</span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(calculatedTotalPrice)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pembayaran dilakukan via transfer manual ke rekening bank Super Admin. Setelah mendaftar, Anda akan diarahkan untuk mengirimkan bukti transfer via WhatsApp agar admin memverifikasi dan mengaktifkan subdomain Anda.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Transfer / Bank Pengirim (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer BSI an. Abdullah Rp 299.000"
                  value={paymentProofNote}
                  onChange={(e) => setPaymentProofNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || checkingSubdomain}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting || checkingSubdomain ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{checkingSubdomain ? 'Memeriksa subdomain...' : 'Mengirim Kode OTP ke Email...'}</span>
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

      <OtpVerificationDialog
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={adminEmail}
        digits={otpDigits}
        countdown={otpCountdown}
        resendCooldown={resendCooldown}
        sending={otpSending}
        verifying={otpVerifying}
        error={otpError}
        successMessage={otpSuccessMsg}
        devOtpCode={devOtpCode}
        onDigitChange={handleDigitChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onResend={handleResendOtp}
        onVerify={handleVerifyOtpAndRegister}
      />
    </div>
  );
}
