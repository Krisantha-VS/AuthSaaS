'use client';

import { AuthSaasLogo } from '@/components/docs/header';

interface MobileHeaderProps {
  onOpen: () => void;
}

export function MobileHeader({ onOpen }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-zinc-950 border-b border-white/[0.06] flex items-center px-4">
      {/* Hamburger */}
      <button
        onClick={onOpen}
        aria-label="Open navigation"
        className="text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      {/* Centered logo */}
      <div className="flex-1 flex justify-center">
        <AuthSaasLogo size={24} />
      </div>

      {/* Balancing spacer (same width as the hamburger button ~20px) */}
      <div className="w-5" />
    </header>
  );
}
