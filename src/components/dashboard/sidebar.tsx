'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboardAuth } from './provider';
import { useTheme } from '@/components/theme-provider';
import { AuthSaasLogo } from '@/components/docs/header';

const NAV = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/apps',
    label: 'Applications',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/users',
    label: 'Users',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/roles',
    label: 'Roles',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/sessions',
    label: 'Sessions',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="14" rx="2"/>
        <path d="M8 20h8M12 18v2"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/webhooks',
    label: 'Webhooks',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 16.8a7.14 7.14 0 0 0 2.24-5.32c0-4.12-3.36-7.48-7.52-7.48-2.1 0-4 .87-5.38 2.26"/>
        <path d="M7.12 8.48A7.14 7.14 0 0 0 4.88 13.8c0 4.12 3.36 7.48 7.52 7.48 2.04 0 3.9-.81 5.26-2.12"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/audit',
    label: 'Audit Log',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { session, logout } = useDashboardAuth();
  const { theme, toggle } = useTheme();
  const initial = session?.tenant.name?.[0]?.toUpperCase() ?? session?.tenant.email?.[0]?.toUpperCase() ?? 'T';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 glass-sidebar flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-black/[0.06] dark:border-white/[0.06]">
          <Link href="/dashboard" onClick={onClose}>
            <AuthSaasLogo size={26} />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 py-2">
            Platform
          </p>
          {NAV.map(({ href, label, icon }) => {
            const active = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 pl-[10px] pr-3 py-2 rounded-lg text-sm transition-all border-l-2 ${
                  active
                    ? 'border-violet-500 dark:border-violet-400 bg-violet-500/[0.10] dark:bg-violet-600/[0.14] text-violet-600 dark:text-violet-400 font-medium'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 py-2">
              Resources
            </p>
            <Link
              href="/docs/introduction"
              target="_blank"
              onClick={onClose}
              className="flex items-center gap-3 pl-[10px] pr-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all border-l-2 border-transparent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Documentation
            </Link>
            <a
              href="https://github.com/Krisantha-VS/AuthSaaS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 pl-[10px] pr-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all border-l-2 border-transparent"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </a>
          </div>
        </nav>

        {/* Footer: user + theme toggle */}
        <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{session?.tenant.name}</p>
              <p className="text-[11px] text-zinc-500 truncate">{session?.tenant.email}</p>
            </div>
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            {/* Sign out */}
            <button onClick={logout} title="Sign out" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
