import { DocsSidebar } from '@/components/docs/sidebar';
import { DocsHeader } from '@/components/docs/header';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DocsHeader />
      <div className="flex max-w-[1400px] mx-auto">
        <DocsSidebar />
        <main className="flex-1 min-w-0 px-8 py-10 lg:px-12">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
