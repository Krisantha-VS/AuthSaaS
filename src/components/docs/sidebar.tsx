'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docsNav } from './nav-config';
import { cn } from '@/shared/lib/utils';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border py-8 pr-6">
      <nav className="space-y-6">
        {docsNav.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-3">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const active = pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-violet-500/10 text-violet-400 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      {item.title}
                      {item.badge && (
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          item.badge === 'soon'  && 'bg-muted text-muted-foreground',
                          item.badge === 'new'   && 'bg-green-500/10 text-green-400',
                          item.badge === 'beta'  && 'bg-amber-500/10 text-amber-400',
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
