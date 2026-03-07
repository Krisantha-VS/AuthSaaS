'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardProvider, useDashboardAuth } from '@/components/dashboard/provider';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

const PUBLIC = ['/dashboard/login', '/dashboard/register'];

function Guard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useDashboardAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC.includes(pathname);
    if (!session && !isPublic) router.replace('/dashboard/login');
    if (session  &&  isPublic) router.replace('/dashboard');
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isPublic = PUBLIC.includes(pathname);
  if (isPublic) return <>{children}</>;
  if (!session)  return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <DashboardSidebar />
      <div className="pl-60">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <Guard>{children}</Guard>
    </DashboardProvider>
  );
}
