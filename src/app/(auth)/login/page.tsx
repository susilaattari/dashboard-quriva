'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { BRAND, getSupportWhatsAppUrl } from '@/config/brand';
import { BookOpen, Lock, Mail, ArrowRight, Sparkles, Building, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          .catch(() => { });
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative text-slate-900">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand text-white shadow-md shadow-emerald-600/20 mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {tenantInfo ? tenantInfo.name : 'Quriva'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {tenantInfo
              ? (tenantInfo.theme_config?.tagline || `Portal Manajemen Tahfidz ${tenantInfo.name}`)
              : 'Platform Terpadu Manajemen Tahfidz, Tahsin & Gamifikasi Santri'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm">
          {errorMsg && (
            <div id="login-error" role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-identifier" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Email / No. WhatsApp
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  aria-invalid={Boolean(errorMsg)}
                  aria-describedby={errorMsg ? 'login-error' : undefined}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@alhikmah.sch.id"
                  className="w-full bg-white border border-slate-300 rounded-xl px-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi
                </label>
                <a
                  href={getSupportWhatsAppUrl('Halo Admin Quriva, saya lupa kata sandi akun dashboard dan membutuhkan bantuan reset.')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Lupa kata sandi? Hubungi Admin
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  aria-invalid={Boolean(errorMsg)}
                  aria-describedby={errorMsg ? 'login-error' : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl px-10 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600">
              Belum terdaftar sebagai lembaga mitra?{' '}
              <Link href="/register" className="font-bold text-emerald-700 hover:text-emerald-800 underline transition-colors">
                Daftarkan Lembaga Baru
              </Link>
            </p>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
              >
                <BookOpen size={14} />
                <span>Buka Al-Qur'an 30 Juz & Kajian Gratis</span>
              </Link>
            </div>
          </div>

          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-3 text-center">
                Akses Cepat Demo Akun
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin@tahfidz.com', 'password123')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-1.5 text-purple-700 text-xs font-bold">
                    <Sparkles size={12} />
                    <span>Super Admin</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pemilik SaaS Global</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@alhikmah.sch.id', 'password123')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                    <Building size={12} />
                    <span>Tenant Admin</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Admin Pesantren</p>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          © 2026 {BRAND.name}. Islamic Education Ecosystem.
        </p>
      </div>
    </div>
  );
}
