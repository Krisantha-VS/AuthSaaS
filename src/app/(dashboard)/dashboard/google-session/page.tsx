'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDashboardAuth } from '@/components/dashboard/provider';

export default function GoogleSessionPage() {
  const router        = useRouter();
  const params        = useSearchParams();
  const { login }     = useDashboardAuth();

  useEffect(() => {
    const at  = params.get('at');
    const ei  = params.get('ei');
    const tid = params.get('tid');
    const tn  = params.get('tn');
    const te  = params.get('te');

    if (!at || !tid || !te) {
      router.replace('/dashboard/login');
      return;
    }

    login({
      tenant: { id: tid, name: tn ?? '', email: te },
      tokens: { accessToken: at, refreshToken: '', expiresIn: Number(ei ?? 3600) },
    });
    router.replace('/dashboard');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
        <span className="w-5 h-5 border-2 border-zinc-300 border-t-violet-600 rounded-full animate-spin" />
        Signing you in…
      </div>
    </div>
  );
}
