'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import Navbar from '@/components/layouts/Navbar';
import api from '@/services/api';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, packagesRes] = await Promise.all([
        api.get('/tenants'),
        api.get('/packages'),
      ]);
      setTenants(tenantsRes.data?.data || []);
      setPackages(packagesRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSantri = tenants.reduce((acc, t) => acc + (t.stats?.total_santri || 0), 0);
  const totalGuru = tenants.reduce((acc, t) => acc + (t.stats?.total_guru || 0), 0);
  const totalRevenue = tenants.reduce((acc, t) => {
    const isPerUser = t.plan_features?.pricing_type === 'per_user';
    if (isPerUser) {
      return acc + ((t.stats?.total_santri || 0) * (Number(t.plan_price) || 0));
    }
    return acc + (Number(t.plan_price) || 0);
  }, 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Super Admin Dashboard"
          subtitle="Ringkasan Ekosistem SaaS & Performa Seluruh Institusi Mitra"
        />

        <main className="p-8 space-y-8 flex-1">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Institusi Terdaftar
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{tenants.length}</div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <ArrowUpRight size={14} /> 100% Status Aktif Beroperasi
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Santri Terdata
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{totalSantri}</div>
              <p className="text-xs text-slate-500 font-medium mt-2">
                Terbimbing oleh <span className="font-semibold text-slate-700">{totalGuru} Guru</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  MRR Berlangganan
                </span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{formatRupiah(totalRevenue)}</div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Estimasi per bulan
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Paket Layanan SaaS
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{packages.length} Tipe</div>
              <p className="text-xs text-slate-500 font-medium mt-2">
                Basic, Standard, & Premium
              </p>
            </div>
          </div>

          {/* Tenants Overview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Institusi Tenant Aktif</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institusi pendidikan Al-Quran yang menggunakan infrastruktur SaaS
                </p>
              </div>
              <a
                href="/superadmin/tenants"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Lihat Semua Tenant →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Institusi & Subdomain</th>
                    <th className="px-6 py-4">Paket Langganan</th>
                    <th className="px-6 py-4">Status Akun</th>
                    <th className="px-6 py-4 text-center">Jumlah Santri</th>
                    <th className="px-6 py-4 text-center">Jumlah Guru</th>
                    <th className="px-6 py-4">Tanggal Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{tenant.name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {tenant.subdomain}.tahfidzapp.com
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 uppercase tracking-wide">
                          {tenant.plan_name || 'Standar'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} />
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {tenant.stats?.total_santri || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {tenant.stats?.total_guru || 0}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(tenant.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Belum ada tenant yang terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
