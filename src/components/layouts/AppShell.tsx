'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const brandColor = user?.tenant?.theme_config?.primaryColor || '#059669';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;

      const items = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [mobileNavOpen]);

  const openMobileNav = () => {
    triggerRef.current = document.activeElement as HTMLElement;
    setMobileNavOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 lg:flex"
      style={
        {
          '--brand': `color-mix(in srgb, ${brandColor} 84%, black)`,
          '--brand-strong': brandColor,
          '--brand-soft': `color-mix(in srgb, ${brandColor} 14%, transparent)`,
        } as React.CSSProperties
      }
    >
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl animate-slide-in-right motion-reduce:animate-none"
          >
            <Sidebar onNavigate={() => setMobileNavOpen(false)} onClose={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar title={title} subtitle={subtitle} onMenuClick={openMobileNav} />
        {children}
      </div>
    </div>
  );
}
