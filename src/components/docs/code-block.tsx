'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '@/shared/lib/utils';

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, lang = 'typescript', filename, className }: CodeBlockProps) {
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    codeToHtml(code.trim(), {
      lang,
      theme: 'github-dark-default',
    }).then(setHtml);
  }, [code, lang]);

  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group relative rounded-xl border border-border overflow-hidden text-sm', className)}>
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-xs text-muted-foreground font-mono">{filename}</span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={copy}
        className="absolute top-2.5 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:text-foreground border border-border"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>

      {/* Code */}
      {html ? (
        <div
          className="[&>pre]:p-5 [&>pre]:overflow-x-auto [&>pre]:bg-[#0d1117]! [&>pre]:m-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-5 bg-[#0d1117] overflow-x-auto">
          <code className="text-gray-300 font-mono">{code.trim()}</code>
        </pre>
      )}
    </div>
  );
}
