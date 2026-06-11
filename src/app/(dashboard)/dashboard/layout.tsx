'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardProvider, useDashboardAuth } from '@/components/dashboard/provider';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { MobileHeader } from '@/components/dashboard/mobile-header';
import { ToastProvider } from '@/components/dashboard/toast';
import { AuroraBackground } from '@/components/aurora-background';

const PUBLIC = [
  '/dashboard/login',
  '/dashboard/register',
  '/dashboard/forgot-password',
  '/dashboard/reset-password',
  '/dashboard/google-session',
];

function Guard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useDashboardAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC.some(p => pathname.startsWith(p));
    if (!session && !isPublic) router.replace('/dashboard/login');
    if (session  &&  isPublic) router.replace('/dashboard');
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AuroraBackground />
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isPublic = PUBLIC.some(p => pathname.startsWith(p));
  if (isPublic) {
    return (
      <>
        <AuroraBackground />
        {children}
      </>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100">
      <AuroraBackground />
      <MobileHeader onOpen={() => setSidebarOpen(true)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-60 pt-14 lg:pt-0">
        <main className="min-h-screen p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <ToastProvider>
        <Guard>{children}</Guard>
      </ToastProvider>
    </DashboardProvider>
  );
}
