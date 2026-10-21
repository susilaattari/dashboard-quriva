'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layouts/AppShell';
import PackageHeader from '@/components/superadmin/PackageHeader';
import PackagePriceSummary from '@/components/superadmin/PackagePriceSummary';
import PackageSimulator from '@/components/superadmin/PackageSimulator';
import api from '@/services/api';
import {
  Check,
  Shield,
  Zap,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  X,
  Users,
  UserCheck,
  Calendar,
  Calculator,
  ArrowRight,
  Clock,
  Layers,
  Info,
} from 'lucide-react';

export interface PackageFeature {
  pricing_type?: 'flat' | 'per_user' | 'group_tiered';
  billing_period?: 'monthly' | '6_months' | 'annual' | 'custom';
  duration_months?: number;
  base_capacity?: number;
  extra_price_per_user?: number;
  hafalan: boolean;
  tahsin_audio: boolean;
  badges: boolean;
  certificates: boolean;
  lms: boolean;
  chat: boolean;
  spaced_repetition: boolean;
}

export interface PackageItem {
  id: number;
  name: string;
  code: string;
  price: number;
  max_santri: number;
  duration_months?: number;
  extra_price_per_user?: number;
  features: PackageFeature;
}

export default function SuperAdminPackages() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'monthly' | '6_months' | 'annual' | 'custom'>('all');

  // Simulation state per package for interactive calculator
  const [simulatedSantri, setSimulatedSantri] = useState<Record<number, number>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pricingType, setPricingType] = useState<'group_tiered' | 'per_user'>('group_tiered');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>(50000);
  const [formMaxSantri, setFormMaxSantri] = useState<number | string>(10);
  const [formExtraPrice, setFormExtraPrice] = useState<number | string>(5000);
  const [isUnlimitedSantri, setIsUnlimitedSantri] = useState(false);
  const [formFeatures, setFormFeatures] = useState<PackageFeature>({
    pricing_type: 'group_tiered',
    hafalan: true,
    tahsin_audio: true,
    badges: true,
    certificates: false,
    lms: false,
    chat: true,
    spaced_repetition: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/packages');
      const data: PackageItem[] = res.data?.data || [];
      setPackages(data);

      // Initialize simulator with each package's base capacity
      const initialSim: Record<number, number> = {};
      data.forEach((p) => {
        initialSim[p.id] = p.max_santri || 10;
      });
      setSimulatedSantri(initialSim);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: number | string) => {
    const num = typeof val === 'number' ? val : Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const featureLabels: Record<
    keyof Omit<PackageFeature, 'pricing_type' | 'billing_period' | 'duration_months' | 'base_capacity' | 'extra_price_per_user'>,
    { label: string; desc: string }
  > = {
    hafalan: {
      label: 'Pencatatan Hafalan Quran',
      desc: 'Ziyadah, Tasmi, dan Murojaah harian',
    },
    tahsin_audio: {
      label: 'Setoran Suara & Tahsin',
      desc: 'Voice note rekaman audio & feedback guru',
    },
    badges: {
      label: 'Gamifikasi & Lencana Digital',
      desc: 'Penghargaan dan trophy pencapaian santri',
    },
    certificates: {
      label: 'Otomatisasi E-Sertifikat',
      desc: 'Generate sertifikat kelulusan per Juz otomatis',
    },
    lms: {
      label: 'Modul Pembelajaran LMS',
      desc: 'Video materi tahsin & webinar kajian',
    },
    chat: {
      label: 'Forum Diskusi & Chat Komunitas',
      desc: 'Komunikasi guru, wali santri, dan kelas',
    },
    spaced_repetition: {
      label: 'Pengingat Murojaah Pintar',
      desc: 'Algoritma jadwal pengulangan otomatis',
    },
  };

  // Preset 1: Paket Bulanan (1 Bulan, 10 santri, Rp 50.000, nambah Rp 5.000)
  const applyPresetMonthly = () => {
    setPricingType('group_tiered');
    setDurationMonths(1);
    setFormName('Paket Grup Bulanan (1 Bulan)');
    setFormCode('monthly-10');
    setFormPrice(50000);
    setFormMaxSantri(10);
    setFormExtraPrice(5000);
    setIsUnlimitedSantri(false);
    setFormFeatures({
      pricing_type: 'group_tiered',
      duration_months: 1,
      base_capacity: 10,
      extra_price_per_user: 5000,
      hafalan: true,
      tahsin_audio: true,
      badges: true,
      certificates: false,
      lms: false,
      chat: true,
      spaced_repetition: false,
    });
  };

  // Preset 2: Paket 6 Bulan (10 santri, Rp 300.000, nambah Rp 5.000)
  const applyPreset6Months = () => {
    setPricingType('group_tiered');
    setDurationMonths(6);
    setFormName('Paket Grup 6 Bulan');
    setFormCode('6months-10');
    setFormPrice(300000);
    setFormMaxSantri(10);
    setFormExtraPrice(5000);
    setIsUnlimitedSantri(false);
    setFormFeatures({
      pricing_type: 'group_tiered',
      duration_months: 6,
      base_capacity: 10,
      extra_price_per_user: 5000,
      hafalan: true,
      tahsin_audio: true,
      badges: true,
      certificates: true,
      lms: true,
      chat: true,
      spaced_repetition: false,
    });
  };

  // Preset 3: Paket 1 Tahun (10 santri, Rp 600.000, nambah Rp 5.000)
  const applyPresetAnnual = () => {
    setPricingType('group_tiered');
    setDurationMonths(12);
    setFormName('Paket Grup 1 Tahun (Tahunan)');
    setFormCode('annual-10');
    setFormPrice(600000);
    setFormMaxSantri(10);
    setFormExtraPrice(5000);
    setIsUnlimitedSantri(false);
    setFormFeatures({
      pricing_type: 'group_tiered',
      duration_months: 12,
      base_capacity: 10,
      extra_price_per_user: 5000,
      hafalan: true,
      tahsin_audio: true,
      badges: true,
      certificates: true,
      lms: true,
      chat: true,
      spaced_repetition: true,
    });
  };

  // Preset 4: Paket Custom (Per Santri / Full Feature)
  const applyPresetCustom = () => {
    setPricingType('per_user');
    setDurationMonths(1);
    setFormName('Paket Custom Full Feature');
    setFormCode('custom-full');
    setFormPrice(10000); // Rp 10.000 / santri / bulan
    setFormMaxSantri(0);
    setFormExtraPrice(0);
    setIsUnlimitedSantri(true);
    setFormFeatures({
      pricing_type: 'per_user',
      duration_months: 1,
      hafalan: true,
      tahsin_audio: true,
      badges: true,
      certificates: true,
      lms: true,
      chat: true,
      spaced_repetition: true,
    });
  };

  // Open modal for new group duration package
  const openCreateGroupModal = (preset: 'monthly' | '6months' | 'annual' = 'monthly') => {
    setEditingId(null);
    setErrorMsg('');
    if (preset === 'monthly') applyPresetMonthly();
    else if (preset === '6months') applyPreset6Months();
    else if (preset === 'annual') applyPresetAnnual();
    setIsModalOpen(true);
  };

  // Open modal for Custom Package (Per-User / Full Features)
  const openCreateCustomModal = () => {
    setEditingId(null);
    setErrorMsg('');
    applyPresetCustom();
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: PackageItem) => {
    setEditingId(pkg.id);
    const isPerUser = pkg.features?.pricing_type === 'per_user';
    setPricingType(isPerUser ? 'per_user' : 'group_tiered');
    setFormName(pkg.name);
    setFormCode(pkg.code);
    setFormPrice(pkg.price);
    setDurationMonths(pkg.duration_months || pkg.features?.duration_months || 1);
    setFormExtraPrice(pkg.extra_price_per_user !== undefined ? pkg.extra_price_per_user : (pkg.features?.extra_price_per_user || 0));
    setIsUnlimitedSantri(pkg.max_santri === 0 || pkg.max_santri > 99999);
    setFormMaxSantri(pkg.max_santri);
    setFormFeatures({
      pricing_type: isPerUser ? 'per_user' : 'group_tiered',
      duration_months: pkg.duration_months || pkg.features?.duration_months || 1,
      base_capacity: pkg.max_santri,
      extra_price_per_user: pkg.extra_price_per_user || pkg.features?.extra_price_per_user || 0,
      hafalan: Boolean(pkg.features?.hafalan),
      tahsin_audio: Boolean(pkg.features?.tahsin_audio),
      badges: Boolean(pkg.features?.badges),
      certificates: Boolean(pkg.features?.certificates),
      lms: Boolean(pkg.features?.lms),
      chat: Boolean(pkg.features?.chat),
      spaced_repetition: Boolean(pkg.features?.spaced_repetition),
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const setAllFeatures = (enable: boolean) => {
    setFormFeatures((prev) => ({
      ...prev,
      hafalan: enable,
      tahsin_audio: enable,
      badges: enable,
      certificates: enable,
      lms: enable,
      chat: enable,
      spaced_repetition: enable,
    }));
  };

  const toggleFeature = (key: keyof Omit<PackageFeature, 'pricing_type' | 'billing_period' | 'duration_months' | 'base_capacity' | 'extra_price_per_user'>) => {
    setFormFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const finalMaxSantri = isUnlimitedSantri ? 999999 : Number(formMaxSantri);
      const finalDuration = pricingType === 'per_user' ? 1 : Number(durationMonths);
      const finalExtraPrice = pricingType === 'per_user' ? 0 : Number(formExtraPrice || 0);

      const payloadFeatures = {
        ...formFeatures,
        pricing_type: pricingType,
        duration_months: finalDuration,
        extra_price_per_user: finalExtraPrice,
        base_capacity: finalMaxSantri,
      };

      const payload = {
        name: formName,
        code: formCode.toLowerCase().trim(),
        price: Number(formPrice),
        max_santri: finalMaxSantri,
        duration_months: finalDuration,
        extra_price_per_user: finalExtraPrice,
        features: payloadFeatures,
      };

      if (editingId) {
        await api.put(`/packages/${editingId}`, payload);
      } else {
        await api.post('/packages', payload);
      }

      setIsModalOpen(false);
      fetchPackages();
    } catch (err: any) {
      const rawMsg = String(err.response?.data?.message || err.message || '');
      if (rawMsg.includes('packages_code_unique') || rawMsg.includes('duplicate key') || rawMsg.toLowerCase().includes('duplicate')) {
        setErrorMsg(`Kode unik paket '${formCode}' sudah digunakan. Silakan gunakan kode unik yang lain.`);
      } else {
        setErrorMsg(rawMsg || 'Gagal menyimpan paket langganan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pkg: PackageItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus paket "${pkg.name}"?`)) return;

    try {
      await api.delete(`/packages/${pkg.id}`);
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menghapus paket');
    }
  };

  // Helper to get duration label
  const getDurationLabel = (pkg: PackageItem) => {
    const isPerUser = pkg.features?.pricing_type === 'per_user';
    if (isPerUser) return 'Custom (Per Santri)';
    const d = pkg.duration_months || pkg.features?.duration_months || 1;
    if (d === 12) return '1 Tahun (Tahunan)';
    if (d === 6) return 'Per 6 Bulan';
    return 'Per Bulan (1 Bln)';
  };

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    const isPerUser = pkg.features?.pricing_type === 'per_user';
    const d = pkg.duration_months || pkg.features?.duration_months || 1;

    if (activeTabFilter === 'monthly') return !isPerUser && d === 1;
    if (activeTabFilter === '6_months') return !isPerUser && d === 6;
    if (activeTabFilter === 'annual') return !isPerUser && d === 12;
    if (activeTabFilter === 'custom') return isPerUser;
    return true;
  });

  return (
    <AppShell
          title="Manajemen Paket Berlangganan"
          subtitle="Atur paket grup fleksibel (1 Bulan, 6 Bulan, 1 Tahun) dengan kuota dasar & biaya santri tambahan dinamis"
        >

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          <PackageHeader
            activeTab={activeTabFilter}
            onTabChange={(tab) => setActiveTabFilter(tab)}
            onCreateGroup={() => openCreateGroupModal('monthly')}
            onCreateCustom={openCreateCustomModal}
          />

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg) => {
              const isPerUser = pkg.features?.pricing_type === 'per_user';
              const duration = Number(pkg.duration_months || pkg.features?.duration_months || 1);
              const extraPrice = Number(pkg.extra_price_per_user !== undefined ? pkg.extra_price_per_user : (pkg.features?.extra_price_per_user || 0));
              const baseCapacity = Number(pkg.max_santri || pkg.features?.base_capacity || 10);
              const basePrice = Number(pkg.price || 0);
              const features = pkg.features || ({} as PackageFeature);

              // Interactive simulation value (strictly cast numbers)
              const defaultSim = isPerUser ? 10 : baseCapacity;
              const currentSimSantri = Math.max(1, Number(simulatedSantri[pkg.id] ?? defaultSim));
              const extraSantri = isPerUser ? 0 : Math.max(0, currentSimSantri - baseCapacity);
              const calculatedPrice = isPerUser
                ? currentSimSantri * basePrice
                : basePrice + extraSantri * extraPrice;

              const isAnnual = duration === 12;
              const is6Months = duration === 6;
              const isSimulating = currentSimSantri !== defaultSim;

              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-3xl p-8 border transition-all relative flex flex-col justify-between shadow-sm hover:shadow-lg ${
                    isPerUser
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : isAnnual
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : is6Months
                      ? 'border-teal-500 ring-1 ring-teal-500/20'
                      : 'border-slate-200'
                  }`}
                >
                  <PackagePriceSummary
                    pkg={pkg}
                    simulatedSantri={currentSimSantri}
                    formatRupiah={formatRupiah}
                  />

                    <PackageSimulator
                      pkg={pkg}
                      value={currentSimSantri}
                      onChange={(value) =>
                        setSimulatedSantri((prev) => ({
                          ...prev,
                          [pkg.id]: value,
                        }))
                      }
                      formatRupiah={formatRupiah}
                    />

                    {/* Features list */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Akses Fitur:
                      </p>
                      {(
                        Object.keys(featureLabels) as Array<
                          keyof Omit<
                            PackageFeature,
                            'pricing_type' | 'billing_period' | 'duration_months' | 'base_capacity' | 'extra_price_per_user'
                          >
                        >
                      ).map((key) => {
                        const isIncluded = Boolean(features[key]);
                        return (
                          <div key={key} className="flex items-center gap-2 text-xs">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isIncluded
                                  ? isPerUser
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              <Check size={10} strokeWidth={3} />
                            </div>
                            <span
                              className={
                                isIncluded
                                  ? 'text-slate-800 font-medium'
                                  : 'text-slate-400 line-through'
                              }
                            >
                              {featureLabels[key].label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  {/* Actions */}
                  <div className="mt-8 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 size={14} className="text-slate-600" />
                      <span>Ubah Tarif & Kuota</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="p-2.5 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                      title="Hapus Paket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {packages.length === 0 && !loading && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Shield size={48} className="mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">Belum ada paket langganan</h4>
              <p className="text-xs text-slate-400 mt-1">
                Klik tombol "Tambah Paket Durasi" atau "Paket Custom" di atas untuk membuat paket pertama.
              </p>
            </div>
          )}
        </main>

      {/* Modal Tambah / Ubah Paket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? `Ubah Paket: ${formName}`
                    : pricingType === 'per_user'
                    ? 'Buat Paket Custom (Per Santri / Full Feature)'
                    : 'Tambah Paket Berlangganan Fleksibel'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur durasi (1 Bulan, 6 Bulan, 1 Tahun), kuota dasar, dan biaya per santri tambahan
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Presets for New Package */}
            {!editingId && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" />
                  Template Cepat Sesuai Kebutuhan Bisnis:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={applyPresetMonthly}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">1 Bulan</div>
                    <div className="text-[10px] text-slate-500">10 santri · 50 rb (+5rb)</div>
                  </button>
                  <button
                    type="button"
                    onClick={applyPreset6Months}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">6 Bulan</div>
                    <div className="text-[10px] text-slate-500">10 santri · 300 rb (+5rb)</div>
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetAnnual}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">1 Tahun</div>
                    <div className="text-[10px] text-slate-500">10 santri · 600 rb (+5rb)</div>
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetCustom}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50 text-left transition-all text-xs cursor-pointer"
                  >
                    <div className="font-bold text-amber-800">Custom</div>
                    <div className="text-[10px] text-slate-500">Per santri · Full Fitur</div>
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pilihan Model Skema Penagihan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Model Skema Penagihan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPricingType('group_tiered');
                      setFormFeatures((prev) => ({ ...prev, pricing_type: 'group_tiered' }));
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      pricingType === 'group_tiered'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-600" />
                      <span>Paket Grup Berdurasi</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kapasitas kuota dasar + biaya tambahan per santri (1 Bln / 6 Bln / 1 Thn)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPricingType('per_user');
                      setFormFeatures((prev) => ({ ...prev, pricing_type: 'per_user' }));
                      setAllFeatures(true);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      pricingType === 'per_user'
                        ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      <span>Paket Custom (Per Santri)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dihitung murni per santri per bulan dengan full benefit (tidak diubah)
                    </p>
                  </button>
                </div>
              </div>

              {/* Pilihan Durasi Langganan (Jika group_tiered) */}
              {pricingType === 'group_tiered' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Durasi Masa Aktif Langganan
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { months: 1, label: '1 Bulan (Bulanan)', desc: 'Per 30 hari' },
                      { months: 6, label: '6 Bulan (Setengah Tahun)', desc: 'Per 180 hari' },
                      { months: 12, label: '1 Tahun (Tahunan)', desc: 'Per 360 hari' },
                    ].map((item) => (
                      <button
                        key={item.months}
                        type="button"
                        onClick={() => {
                          setDurationMonths(item.months);
                          setFormFeatures((prev) => ({ ...prev, duration_months: item.months }));
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          durationMonths === item.months
                            ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{item.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nama & Kode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Paket *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Paket Grup Bulanan 10 Santri"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kode Unik Paket *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="monthly-10 / 6months-10 / annual-10"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Harga Dasar, Kuota Santri & Biaya Tambahan per Orang */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Harga Dasar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {pricingType === 'per_user' ? 'Tarif / Santri (Rp)' : 'Harga Dasar Paket (Rp) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    placeholder="50000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {pricingType === 'per_user'
                      ? 'Tarif per santri terdaftar per bulan.'
                      : `Harga tetap untuk durasi ${durationMonths === 12 ? '1 tahun' : durationMonths === 6 ? '6 bulan' : '1 bulan'}.`}
                  </p>
                </div>

                {/* 2. Kapasitas Kuota Santri Dasar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kapasitas Kuota Dasar *
                  </label>
                  {isUnlimitedSantri ? (
                    <div className="p-2.5 border border-amber-300 bg-amber-50 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between">
                      <span>Tanpa Batasan Kuota</span>
                      <button
                        type="button"
                        onClick={() => setIsUnlimitedSantri(false)}
                        className="text-[10px] text-amber-700 underline cursor-pointer"
                      >
                        Beri Batas
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="10"
                        value={formMaxSantri}
                        onChange={(e) => setFormMaxSantri(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-bold text-slate-900"
                      />
                      <p className="text-[10px] text-slate-400">Jumlah santri yang termasuk dalam harga dasar.</p>
                    </div>
                  )}
                </div>

                {/* 3. Biaya Tambahan per Santri */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Biaya Santri Tambahan (Rp)
                  </label>
                  <input
                    type="number"
                    disabled={pricingType === 'per_user'}
                    min={0}
                    step={1000}
                    placeholder="5000"
                    value={pricingType === 'per_user' ? 0 : formExtraPrice}
                    onChange={(e) => setFormExtraPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus:border-emerald-500 font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tarif jika lembaga menambah orang di atas kuota dasar.
                  </p>
                </div>
              </div>

              {/* Live Preview Perhitungan */}
              {pricingType === 'group_tiered' ? (
                <div className="bg-emerald-50/70 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Info size={14} className="text-emerald-600" />
                      Simulasi Perhitungan Tagihan:
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Jika lembaga memiliki <strong>{Number(formMaxSantri) + 5} santri</strong> (kuota dasar {formMaxSantri} + 5 santri tambahan):
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-900">
                      {formatRupiah(Number(formPrice) + 5 * Number(formExtraPrice || 0))}
                    </div>
                    <span className="text-[10px] text-emerald-700">
                      {formatRupiah(Number(formPrice))} + (5 × {formatRupiah(Number(formExtraPrice || 0))})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Info size={14} className="text-amber-600" />
                      Simulasi Perhitungan Tagihan Custom:
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Jika lembaga memiliki <strong>20 santri</strong> (20 × {formatRupiah(Number(formPrice))}):
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-900">
                      {formatRupiah(20 * Number(formPrice))}
                    </div>
                    <span className="text-[10px] text-amber-700">
                      Tarif per santri: {formatRupiah(Number(formPrice))} / bln
                    </span>
                  </div>
                </div>
              )}

              {/* Matriks Fitur & Preset Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Benefit & Akses Fitur
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAllFeatures(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      Pilih Semua (Full Benefit)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAllFeatures(false)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {(
                    Object.keys(featureLabels) as Array<
                      keyof Omit<
                        PackageFeature,
                        'pricing_type' | 'billing_period' | 'duration_months' | 'base_capacity' | 'extra_price_per_user'
                      >
                    >
                  ).map((key) => {
                    const isChecked = Boolean(formFeatures[key]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleFeature(key)}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {featureLabels[key].label}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {featureLabels[key].desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Paket Sekarang'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
