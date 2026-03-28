export function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Orb 1 — violet, anchored top-left */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: 720,
          height: 720,
          top: '-18%',
          left: '-12%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 68%)',
          animation: 'aurora-1 22s ease-in-out infinite',
        }}
      />
      {/* Orb 2 — indigo, center-right */}
      <div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: 580,
          height: 580,
          top: '28%',
          right: '-14%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.24) 0%, transparent 68%)',
          animation: 'aurora-2 28s ease-in-out infinite',
        }}
      />
      {/* Orb 3 — cyan, bottom-center */}
      <div
        className="absolute rounded-full blur-[130px]"
        style={{
          width: 500,
          height: 500,
          bottom: '-10%',
          left: '28%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 68%)',
          animation: 'aurora-3 18s ease-in-out infinite',
        }}
      />
    </div>
  );
}
