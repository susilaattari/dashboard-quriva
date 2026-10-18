'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { BookOpen, Lock, Mail, ArrowRight, Sparkles, Building, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      let sub = '';
      if (hostname.endsWith('.localhost')) sub = hostname.replace('.localhost', '');
      else if (hostname.endsWith('.lvh.me')) sub = hostname.replace('.lvh.me', '');
      else {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') sub = parts[0];
      }

      if (sub && sub !== 'superadmin') {
        api.get(`/tenants/public/${sub}`)
          .then((res) => {
            if (res.data?.data) {
              setTenantInfo(res.data.data);
              localStorage.setItem('tahfidz_tenant_id', String(res.data.data.id));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(identifier, password);
      if (user.role === 'super_admin') {
        router.push('/superadmin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (emailInput: string, passInput: string) => {
    setIdentifier(emailInput);
    setPassword(passInput);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/25 mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {tenantInfo ? tenantInfo.name : 'SaaS Tahfidz Quran'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {tenantInfo
              ? (tenantInfo.theme_config?.tagline || `Portal Manajemen Tahfidz ${tenantInfo.name}`)
              : 'Platform Terpadu Manajemen Tahfidz, Tahsin & Gamifikasi Santri'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email / No. WhatsApp
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@alhikmah.sch.id"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Kata Sandi
                </label>
                <a href="#" className="text-xs text-emerald-400 hover:underline">
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Registration and Free Features Links */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Belum terdaftar sebagai lembaga mitra?{' '}
              <Link href="/register" className="font-bold text-emerald-400 hover:text-emerald-300 underline transition-colors">
                Daftarkan Lembaga Baru
              </Link>
            </p>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-all"
              >
                <span>📖 Buka Al-Qur'an 30 Juz & Kajian Gratis</span>
              </Link>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-3 text-center">
              Akses Cepat Demo Akun
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@tahfidz.com', 'password123')}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                  <Sparkles size={12} />
                  <span>Super Admin</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Pemilik SaaS Global</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@alhikmah.sch.id', 'password123')}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <Building size={12} />
                  <span>Tenant Admin</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Admin Pesantren</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          © 2026 SaaS Tahfidz & Tahsin Quran. Multi-Tenant Education Ecosystem.
        </p>
      </div>
    </div>
  );
}
