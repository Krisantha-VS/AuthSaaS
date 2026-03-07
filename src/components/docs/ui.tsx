import { cn } from '@/shared/lib/utils';

// HTTP Method Badge
const methodColors: Record<string, string> = {
  GET:    'bg-blue-500/10   text-blue-400   border-blue-500/20',
  POST:   'bg-green-500/10  text-green-400  border-green-500/20',
  PUT:    'bg-amber-500/10  text-amber-400  border-amber-500/20',
  PATCH:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10   text-red-400    border-red-500/20',
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border',
      methodColors[method] ?? 'bg-muted text-muted-foreground border-border'
    )}>
      {method}
    </span>
  );
}

// Endpoint row
export function Endpoint({ method, path, description }: { method: string; path: string; description?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 border-b border-border last:border-0">
      <MethodBadge method={method} />
      <code className="text-sm font-mono text-foreground">{path}</code>
      {description && <span className="text-sm text-muted-foreground sm:ml-auto">{description}</span>}
    </div>
  );
}

// Callout / Note box
type CalloutVariant = 'note' | 'warning' | 'tip' | 'danger';
const calloutStyles: Record<CalloutVariant, { wrapper: string; icon: string; label: string }> = {
  note:    { wrapper: 'border-blue-500/30   bg-blue-500/5',   icon: 'ℹ', label: 'Note'    },
  tip:     { wrapper: 'border-green-500/30  bg-green-500/5',  icon: '✦', label: 'Tip'     },
  warning: { wrapper: 'border-amber-500/30  bg-amber-500/5',  icon: '⚠', label: 'Warning' },
  danger:  { wrapper: 'border-red-500/30    bg-red-500/5',    icon: '✕', label: 'Danger'  },
};

export function Callout({ variant = 'note', children }: { variant?: CalloutVariant; children: React.ReactNode }) {
  const s = calloutStyles[variant];
  return (
    <div className={cn('rounded-lg border px-4 py-3 my-6 text-sm', s.wrapper)}>
      <p className="font-semibold mb-1">{s.icon} {s.label}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

// Param table
export interface ParamRow { name: string; type: string; required?: boolean; description: string }
export function ParamTable({ params }: { params: ParamRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Parameter</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Required</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map(p => (
            <tr key={p.name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5 font-mono text-violet-400">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">{p.type}</td>
              <td className="px-4 py-2.5">
                {p.required
                  ? <span className="text-xs text-red-400">required</span>
                  : <span className="text-xs text-muted-foreground">optional</span>}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Section heading with anchor
export function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group flex items-center gap-2 text-xl font-semibold mt-12 mb-4 scroll-mt-20">
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground text-base transition-opacity">#</a>
    </h2>
  );
}

export function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="group flex items-center gap-2 text-base font-semibold mt-8 mb-3 scroll-mt-20">
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground text-sm transition-opacity">#</a>
    </h3>
  );
}

// Page header
export function PageHeader({ title, description, badge }: { title: string; description: string; badge?: string }) {
  return (
    <div className="mb-10 pb-8 border-b border-border">
      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
          {badge}
        </span>
      )}
      <h1 className="text-3xl font-bold tracking-tight mb-3">{title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// On this page TOC
export interface TocItem { id: string; title: string; depth?: number }
export function OnThisPage({ items }: { items: TocItem[] }) {
  return (
    <aside className="hidden xl:block w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pl-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block text-sm text-muted-foreground hover:text-foreground transition-colors',
                item.depth === 3 && 'pl-3'
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
