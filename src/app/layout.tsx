'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastProvider } from '@/components/ui/Toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const stored = localStorage.getItem('quriva-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  return (
    <html lang="id">
      <head>
        <title>SaaS Tahfidz & Tahsin Quran Platform</title>
        <meta
          name="description"
          content="Sistem Informasi Manajemen Tahfidz, Tahsin, dan Gamifikasi Hafalan Al-Quran Multi-Tenant"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
